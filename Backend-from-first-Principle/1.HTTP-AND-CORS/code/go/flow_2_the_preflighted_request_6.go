func cors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        h := w.Header()
        h.Set("Access-Control-Allow-Origin", "https://example.com") // exact, not * (credentials)
        h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
        h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        h.Set("Access-Control-Allow-Credentials", "true")
        h.Set("Access-Control-Max-Age", "86400") // cache the approval for 24h
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)  // 204: answer the preflight and stop
            return
        }
        next.ServeHTTP(w, r)
    })
}
