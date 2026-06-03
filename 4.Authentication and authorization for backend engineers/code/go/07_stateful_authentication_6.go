// RequireSession reads the sid cookie and looks it up in Redis.
func RequireSession(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        c, err := r.Cookie("sid")
        if err != nil {
            http.Error(w, "authentication failed", http.StatusUnauthorized)
            return
        }
        raw, err := rdb.Get(ctx, "sess:"+c.Value).Result()
        if err != nil { // missing or expired
            http.Error(w, "authentication failed", http.StatusUnauthorized)
            return
        }
        var u User
        json.Unmarshal([]byte(raw), &u)
        // attach the user to the request context for later handlers
        ctxWithUser := context.WithValue(r.Context(), "user", u)
        next(w, r.WithContext(ctxWithUser))
    }
}
