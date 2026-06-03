package middleware

import (
    "log"
    "net/http"
    "time"
)

// TimingMiddleware logs the duration of every HTTP request.
func TimingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Wrap the ResponseWriter to capture the status code
        rw := &statusWriter{ResponseWriter: w, status: 200}
        next.ServeHTTP(rw, r)

        duration := time.Since(start)
        log.Printf(
            "method=%s path=%s status=%d duration=%v",
            r.Method, r.URL.Path, rw.status, duration,
        )
    })
}

type statusWriter struct {
    http.ResponseWriter
    status int
}

func (w *statusWriter) WriteHeader(code int) {
    w.status = code
    w.ResponseWriter.WriteHeader(code)
}
