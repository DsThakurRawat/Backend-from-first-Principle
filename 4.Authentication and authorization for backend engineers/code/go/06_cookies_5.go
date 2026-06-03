// Double-submit: compare the CSRF cookie against the header.
func CheckCSRF(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method == "GET" || r.Method == "HEAD" {
            next(w, r); return
        }
        c, err := r.Cookie("csrf")
        hdr := r.Header.Get("X-CSRF-Token")
        if err != nil || subtle.ConstantTimeCompare(
            []byte(c.Value), []byte(hdr)) != 1 {
            http.Error(w, "forbidden", http.StatusForbidden)
            return
        }
        next(w, r)
    }
}

// Regenerate the session ID right after a successful login.
func RegenerateSession(oldSID string, u User) (string, error) {
    raw, _ := rdb.Get(ctx, "sess:"+oldSID).Result()
    rdb.Del(ctx, "sess:"+oldSID)            // kill the pre-login ID
    newSID := newSessionID()                // brand-new value
    rdb.Set(ctx, "sess:"+newSID, raw, 15*time.Minute)
    return newSID, nil
}
