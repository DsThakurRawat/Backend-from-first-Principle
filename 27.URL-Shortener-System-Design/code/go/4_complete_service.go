package shortener

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

// URLShortener is the main service
type URLShortener struct {
	redis    *redis.Client
	cache    *LRUCache
	idGen    *IDGenerator
	baseURL  string
	mockDB   map[string]linkRecord // Mock database for example
	mockDBMu sync.RWMutex
}

type linkRecord struct {
	longURL  string
	expiresAt time.Time
}

// ShortenRequest from client
type ShortenRequest struct {
	LongURL    string     `json:"long_url"`
	CustomCode string     `json:"custom_code,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	UserID     string     `json:"user_id,omitempty"`
}

// ShortenResponse to client
type ShortenResponse struct {
	ShortCode string     `json:"short_code"`
	ShortURL  string     `json:"short_url"`
	LongURL   string     `json:"long_url"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

// NewURLShortener creates a new shortener service
func NewURLShortener(redisAddr, baseURL string) *URLShortener {
	return &URLShortener{
		redis:   redis.NewClient(&redis.Options{Addr: redisAddr}),
		cache:   NewLRUCache(10000),
		idGen:   NewIDGenerator(redisAddr),
		baseURL: baseURL,
		mockDB:  make(map[string]linkRecord),
	}
}

// ShortenURL generates a short code for a long URL
func (s *URLShortener) ShortenURL(ctx context.Context, longURL string, expiresAt *time.Time) (string, error) {
	id, err := s.idGen.NextID(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to generate ID: %w", err)
	}

	shortCode := Encode(id)
	expiresAtValue := time.Time{}
	if expiresAt != nil {
		expiresAtValue = *expiresAt
	}

	// Store in database (mock)
	s.mockDBMu.Lock()
	s.mockDB[shortCode] = linkRecord{longURL: longURL, expiresAt: expiresAtValue}
	s.mockDBMu.Unlock()

	// Cache it
	s.cache.Set(shortCode, longURL)

	return shortCode, nil
}

// ReserveCustomCode attempts to reserve a custom code
func (s *URLShortener) ReserveCustomCode(ctx context.Context, code, longURL string, expiresAt *time.Time) error {
	const lockKey = "custom_code_lock:"
	const lockExpiry = 5 * time.Second

	// Acquire distributed lock
	ok, err := s.redis.SetNX(ctx, lockKey+code, "reserved", lockExpiry).Result()
	if err != nil {
		return fmt.Errorf("lock acquisition failed: %w", err)
	}

	if !ok {
		return fmt.Errorf("custom code already reserved")
	}

	// Double-check: ensure code isn't already in use
	s.mockDBMu.Lock()
	_, exists := s.mockDB[code]
	if exists {
		s.mockDBMu.Unlock()
		s.redis.Del(ctx, lockKey+code)
		return fmt.Errorf("custom code already in use")
	}

	// Store in database
	expiresAtValue := time.Time{}
	if expiresAt != nil {
		expiresAtValue = *expiresAt
	}
	s.mockDB[code] = linkRecord{longURL: longURL, expiresAt: expiresAtValue}
	s.mockDBMu.Unlock()

	// Cache it
	s.cache.Set(code, longURL)

	// Release lock
	s.redis.Del(ctx, lockKey+code)

	return nil
}

// LookupCode returns the long URL for a short code
func (s *URLShortener) LookupCode(ctx context.Context, code string) (string, error) {
	// Query database (mock)
	s.mockDBMu.RLock()
	record, exists := s.mockDB[code]
	s.mockDBMu.RUnlock()
	if !exists {
		return "", fmt.Errorf("not found")
	}

	if !record.expiresAt.IsZero() && !time.Now().Before(record.expiresAt) {
		s.mockDBMu.Lock()
		delete(s.mockDB, code)
		s.mockDBMu.Unlock()
		s.cache.Delete(code)
		return "", fmt.Errorf("expired")
	}

	// Try cache after checking expiration so stale cached links cannot redirect.
	if longURL, found := s.cache.Get(code); found {
		return longURL, nil
	}

	// Cache for future requests
	s.cache.Set(code, record.longURL)

	return record.longURL, nil
}

// HTTP Handlers

// HandleShorten handles POST /api/v1/shorten
func (s *URLShortener) HandleShorten(w http.ResponseWriter, r *http.Request) {
	var req ShortenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	parsedURL, err := url.ParseRequestURI(req.LongURL)
	if err != nil || parsedURL.Host == "" ||
		(!strings.EqualFold(parsedURL.Scheme, "http") && !strings.EqualFold(parsedURL.Scheme, "https")) {
		http.Error(w, "long_url must be a valid http or https URL", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var shortCode string

	if req.CustomCode != "" {
		err = s.ReserveCustomCode(ctx, req.CustomCode, req.LongURL, req.ExpiresAt)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed: %v", err), http.StatusConflict)
			return
		}
		shortCode = req.CustomCode
	} else {
		shortCode, err = s.ShortenURL(ctx, req.LongURL, req.ExpiresAt)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed: %v", err), http.StatusInternalServerError)
			return
		}
	}

	resp := ShortenResponse{
		ShortCode: shortCode,
		ShortURL:  fmt.Sprintf("%s/%s", s.baseURL, shortCode),
		LongURL:   req.LongURL,
		CreatedAt: time.Now(),
		ExpiresAt: req.ExpiresAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// HandleRedirect handles GET /{code}
func (s *URLShortener) HandleRedirect(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	longURL, err := s.LookupCode(ctx, code)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	userIP := r.RemoteAddr
	userAgent := r.Header.Get("User-Agent")
	referrer := r.Header.Get("Referer")

	// Redirect (302 Found) so repeat clicks remain observable.
	http.Redirect(w, r, longURL, http.StatusFound)

	// Track click asynchronously using request data captured before return.
	go s.TrackClick(code, userIP, userAgent, referrer)
}

// TrackClick publishes a click event to Redis stream
func (s *URLShortener) TrackClick(code, userIP, userAgent, referrer string) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	event := map[string]string{
		"code":       code,
		"user_ip":    userIP,
		"user_agent": userAgent,
		"referrer":   referrer,
		"timestamp":  time.Now().Format(time.RFC3339),
	}

	data, _ := json.Marshal(event)

	// Publish to Redis stream (fire-and-forget)
	s.redis.XAdd(ctx, &redis.XAddArgs{
		Stream: "click_events",
		Values: map[string]interface{}{"event": string(data)},
	})
}

// NewRouter sets up HTTP routes
func NewRouter(s *URLShortener) *chi.Mux {
	r := chi.NewRouter()

	r.Post("/api/v1/shorten", s.HandleShorten)
	r.Get("/{code}", s.HandleRedirect)

	return r
}

// Example main function
func ExampleServer() {
	shortener := NewURLShortener("localhost:6379", "https://tiny.url")
	router := NewRouter(shortener)

	fmt.Println("Starting URL shortener on :8080")
	http.ListenAndServe(":8080", router)
}
