// Set a secure session cookie after login (stateful)
func login(w http.ResponseWriter, r *http.Request) {
    sid := newSessionID()
    sessions.Store(sid, userID)              // server-side session store (use Redis)
    http.SetCookie(w, &http.Cookie{
        Name:     "session",
        Value:    sid,
        HttpOnly: true,                      // JS can't read it
        Secure:   true,                      // HTTPS only
        SameSite: http.SameSiteStrictMode,   // CSRF defense
        MaxAge:   3600,
        Path:     "/",
    })
}

// Bearer-token auth middleware (stateless)
func requireToken(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        auth := r.Header.Get("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") || !validJWT(auth[7:]) {
            w.Header().Set("WWW-Authenticate", `Bearer`)
            http.Error(w, "unauthorized", http.StatusUnauthorized) // 401
            return
        }
        next.ServeHTTP(w, r)
    })
}
