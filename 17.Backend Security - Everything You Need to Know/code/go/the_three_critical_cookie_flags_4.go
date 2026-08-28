http.SetCookie(w, &http.Cookie{
    Name:     "session_id",
    Value:    sessionID,
    HttpOnly: true,          // JS cannot access
    Secure:   true,           // HTTPS only
    SameSite: http.SameSiteStrictMode,  // no cross-site
    MaxAge:   7 * 24 * 3600, // 7 days
    Path:     "/",
})
