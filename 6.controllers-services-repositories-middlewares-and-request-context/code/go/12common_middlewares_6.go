var allowedOrigin = "https://app.example.com"

func CORSMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin") // runtime gives us this
        if origin == allowedOrigin {
            w.Header().Set("Access-Control-Allow-Origin", origin)
        }
        next.ServeHTTP(w, r) // pass along; browser blocks if header absent
    })
}

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        userID, role, err := verifyToken(token)
        if err != nil {
            http.Error(w, "unauthorized", http.StatusUnauthorized) // 401, stop
            return
        }
        // SUCCESS: stash identity in the request context, then continue.
        ctx := context.WithValue(r.Context(), "userID", userID)
        ctx = context.WithValue(ctx, "role", role)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
