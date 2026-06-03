import "strings"

func RequireJWT(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        h := r.Header.Get("Authorization")
        if !strings.HasPrefix(h, "Bearer ") {
            http.Error(w, "authentication failed", http.StatusUnauthorized)
            return
        }
        claims, err := Verify(strings.TrimPrefix(h, "Bearer "))
        if err != nil {
            http.Error(w, "authentication failed", http.StatusUnauthorized)
            return
        }
        // no store lookup — identity comes from the verified token
        u := User{ID: claims["sub"].(string), Role: claims["role"].(string)}
        next(w, r.WithContext(context.WithValue(r.Context(), "user", u)))
    }
}
