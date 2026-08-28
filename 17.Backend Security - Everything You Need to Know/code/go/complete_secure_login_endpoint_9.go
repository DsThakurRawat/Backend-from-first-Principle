func loginHandler(db *pgxpool.Pool, redis *redis.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            Email    string `json:"email"`
            Password string `json:"password"`
        }
        json.NewDecoder(r.Body).Decode(&req)

        // 1. Validate format (first line of defence)
        if !isValidEmail(req.Email) || len(req.Password) < 8 {
            http.Error(w, "invalid credentials", 400)
            return
        }

        // 2. Parameterised query — no SQL injection possible
        var userID string
        var hashedPass string
        err := db.QueryRow(ctx,
            "SELECT id, password_hash FROM users WHERE email = $1",
            req.Email).Scan(&userID, &hashedPass)

        // 3. Generic error — never reveal whether email exists
        if err != nil || !verifyArgon2(req.Password, hashedPass) {
            http.Error(w, "invalid email or password", 401)
            return
        }

        // 4. Cryptographically secure session ID
        sessionID := generateSecureToken(32)

        // 5. Store session in Redis with metadata
        redis.Set(ctx, "session:"+sessionID,
            userID, 7*24*time.Hour)

        // 6. Secure cookie — HttpOnly, Secure, SameSite=Strict
        http.SetCookie(w, &http.Cookie{
            Name: "session_id", Value: sessionID,
            HttpOnly: true, Secure: true,
            SameSite: http.SameSiteStrictMode,
            MaxAge: 7 * 24 * 3600,
        })
        w.WriteHeader(http.StatusOK)
    }
}

func generateSecureToken(n int) string {
    b := make([]byte, n)
    rand.Read(b) // crypto/rand — not math/rand
    return base64.URLEncoding.EncodeToString(b)
}
