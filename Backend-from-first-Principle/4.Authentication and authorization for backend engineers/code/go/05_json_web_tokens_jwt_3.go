package auth

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

var secret = []byte("keep-this-very-secret")

// mint a self-contained token carrying the claims
func Sign(userID, role string) (string, error) {
    claims := jwt.MapClaims{
        "sub":  userID,                              // user id
        "role": role,                                // for authorization
        "iat":  time.Now().Unix(),                   // issued at
        "exp":  time.Now().Add(time.Hour).Unix(),    // expiry
    }
    tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return tok.SignedString(secret)
}

// verify signature + expiry; returns the claims if valid
func Verify(tokenStr string) (jwt.MapClaims, error) {
    tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
        // pin the algorithm to stop "alg: none" attacks
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, jwt.ErrSignatureInvalid
        }
        return secret, nil
    })
    if err != nil || !tok.Valid {
        return nil, err
    }
    return tok.Claims.(jwt.MapClaims), nil
}
