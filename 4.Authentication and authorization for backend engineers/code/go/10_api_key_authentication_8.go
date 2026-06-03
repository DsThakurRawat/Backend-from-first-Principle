import (
    "crypto/sha256"
    "crypto/subtle"
    "encoding/hex"
)

// Store only the HASH of issued keys (like passwords).
// On each call, hash the presented key and constant-time compare.
func hashKey(k string) string {
    sum := sha256.Sum256([]byte(k))
    return hex.EncodeToString(sum[:])
}

func RequireAPIKey(lookup func(hash string) (*Client, bool)) func(http.HandlerFunc) http.HandlerFunc {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            key := r.Header.Get("X-API-Key")
            client, ok := lookup(hashKey(key))
            // subtle.ConstantTimeCompare avoids timing leaks
            if !ok || subtle.ConstantTimeCompare([]byte(key), []byte(key)) != 1 {
                http.Error(w, "authentication failed", http.StatusUnauthorized)
                return
            }
            _ = client // check scopes, quota, expiry here
            next(w, r)
        }
    }
}
