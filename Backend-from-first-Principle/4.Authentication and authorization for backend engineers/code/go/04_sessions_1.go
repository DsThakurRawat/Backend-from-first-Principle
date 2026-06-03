package main

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "encoding/json"
    "net/http"
    "time"

    "github.com/redis/go-redis/v9"
    "golang.org/x/crypto/bcrypt"
)

var rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})
var ctx = context.Background()

type User struct {
    ID   string `json:"id"`
    Role string `json:"role"`
}

// hash once at signup; store hash, never the password
func HashPassword(pw string) (string, error) {
    b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
    return string(b), err
}

// bcrypt.CompareHashAndPassword is constant-time internally
func CheckPassword(hash, pw string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

func newSessionID() string {
    b := make([]byte, 32)
    rand.Read(b) // cryptographically random
    return hex.EncodeToString(b)
}

func Login(w http.ResponseWriter, u User) error {
    sid := newSessionID()
    data, _ := json.Marshal(u)
    // store {sessionID -> userData} with a 15-minute TTL
    if err := rdb.Set(ctx, "sess:"+sid, data, 15*time.Minute).Err(); err != nil {
        return err
    }
    http.SetCookie(w, &http.Cookie{
        Name:     "sid",
        Value:    sid,
        HttpOnly: true,            // JS cannot read it
        Secure:   true,            // HTTPS only
        SameSite: http.SameSiteLaxMode,
        Path:     "/",
        Expires:  time.Now().Add(15 * time.Minute),
    })
    return nil
}
