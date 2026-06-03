// In Go, middleware wraps the "next" handler. Calling next.ServeHTTP
// is the equivalent of next(): pass execution along the chain.
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path) // do work

        // EARLY EXIT example (short-circuit, never calls next):
        if r.Header.Get("X-Blocked") == "yes" {
            http.Error(w, "forbidden", http.StatusForbidden)
            return // request stops here
        }

        next.ServeHTTP(w, r) // === next(): continue the chain ===
    })
}
