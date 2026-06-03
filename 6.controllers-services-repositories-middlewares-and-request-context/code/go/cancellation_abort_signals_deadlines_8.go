func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := uuid.NewString() // one unique id for this request
        ctx := context.WithValue(r.Context(), "requestID", id)
        w.Header().Set("X-Request-ID", id) // echo it back / forward it
        log.Printf("[%s] %s %s", id, r.Method, r.URL.Path)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
