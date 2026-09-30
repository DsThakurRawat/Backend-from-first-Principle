package shortener

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
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
	mockDB   map[string]string // Mock database for example
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
		mockDB:  make(map[string]string),
	}
}

// ShortenURL generates a short code for a long URL
func (s *URLShortener) ShortenURL(ctx context.Context, longURL string, expiresAt *time.Time) (string, error) {
	id, err := s.idGen.NextID(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to generate ID: %w", err)
	}

	shortCode := Encode(id)

	// Store in database (mock)
	s.mockDB[shortCode] = longURL

	// Cache it
	s.cache.Set(shortCode, longURL)

	return shortCode, nil
}

// ReserveCustomCode attempts to reserve a custom code
func (s *URLShortener) ReserveCustomCode(ctx context.Context, code, longURL string) error {
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
	if _, exists := s.mockDB[code]; exists {
		s.redis.Del(ctx, lockKey+code)
		return fmt.Errorf("custom code already in use")
	}

	// Store in database
	s.mockDB[code] = longURL

	// Cache it
	s.cache.Set(code, longURL)

	// Release lock
	s.redis.Del(ctx, lockKey+code)

	return nil
}

// LookupCode returns the long URL for a short code
func (s *URLShortener) LookupCode(ctx context.Context, code string) (string, error) {
	// Try cache first
	if longURL, found := s.cache.Get(code); found {
		return longURL, nil
	}

	// Query database (mock)
	longURL, exists := s.mockDB[code]
	if !exists {
		return "", fmt.Errorf("not found")
	}

	// Cache for future requests
	s.cache.Set(code, longURL)

	return longURL, nil
}

// HTTP Handlers

// HandleShorten handles POST /api/v1/shorten
func (s *URLShortener) HandleShorten(w http.ResponseWriter, r *http.Request) {
	var req ShortenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var shortCode string
	var err error

	if req.CustomCode != "" {
		err = s.ReserveCustomCode(ctx, req.CustomCode, req.LongURL)
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

	// Redirect (301 Permanent)
	http.Redirect(w, r, longURL, http.StatusMovedPermanently)

	// Track click asynchronously
	go s.TrackClick(code, r)
}

// TrackClick publishes a click event to Redis stream
func (s *URLShortener) TrackClick(code string, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	event := map[string]string{
		"code":       code,
		"user_ip":    r.RemoteAddr,
		"user_agent": r.Header.Get("User-Agent"),
		"referrer":   r.Header.Get("Referer"),
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
