import (
    "golang.org/x/time/rate"
    "sync"
    "net/http"
)

var (
    mu       sync.Mutex
    limiters = map[string]*rate.Limiter{}
)

// Per-IP limiter: 5 requests per second, burst of 10
func getIPLimiter(ip string) *rate.Limiter {
    mu.Lock()
    defer mu.Unlock()
    l, ok := limiters[ip]
    if !ok {
        l = rate.NewLimiter(5, 10)
        limiters[ip] = l
    }
    return l
}

func RateLimitMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ip := r.RemoteAddr
        if !getIPLimiter(ip).Allow() {
            http.Error(w, "too many requests", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    })
}
