package middleware

import (
    "context"
    "fmt"
    "net/http"
    "time"

    "github.com/redis/go-redis/v9"
)

const (
    maxRequests = 50
    windowTime  = 1 * time.Minute
)

func RateLimitMiddleware(rdb *redis.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx := context.Background()

        // Extract client IP from X-Forwarded-For header
        // (set by reverse proxy like Nginx or Caddy)
        clientIP := r.Header.Get("X-Forwarded-For")
        if clientIP == "" {
            clientIP = r.RemoteAddr
        }

        // Redis key: per IP, per minute window
        key := fmt.Sprintf("rate_limit:%s:%d", clientIP, time.Now().Unix()/60)

        // INCR is atomic — no race condition even with concurrent requests
        count, err := rdb.Incr(ctx, key).Result()
        if err != nil {
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            return
        }

        // Set TTL on first request of this window (key is new)
        if count == 1 {
            rdb.Expire(ctx, key, windowTime)
        }

        // Check if limit exceeded
        if count > maxRequests {
            w.Header().Set("Retry-After", "60")
            http.Error(w, "429 Too Many Requests", http.StatusTooManyRequests)
            return
        }

        // Proceed to actual handler
        w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", maxRequests-count))
    }
}
