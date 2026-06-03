func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        h := w.Header()
        h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        h.Set("Content-Security-Policy", "default-src 'self'")
        h.Set("X-Frame-Options", "DENY")
        h.Set("X-Content-Type-Options", "nosniff")
        next.ServeHTTP(w, r) // headers MUST be set before this call (see §3)
    })
}
// http.ListenAndServe(":8080", securityHeaders(mux))
