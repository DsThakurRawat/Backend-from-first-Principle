// Verify with a PUBLIC key, pinning RS256 (blocks alg:none & key confusion)
func VerifyRS256(tokenStr string, pub *rsa.PublicKey) (jwt.MapClaims, error) {
    tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok { // pin family
            return nil, jwt.ErrSignatureInvalid
        }
        return pub, nil
    }, jwt.WithValidMethods([]string{"RS256"}))
    if err != nil || !tok.Valid {
        return nil, err
    }
    return tok.Claims.(jwt.MapClaims), nil
}

// Rotate a refresh token; detect reuse of an already-spent one.
func Refresh(rdb *redis.Client, presented string) (string, error) {
    family, err := rdb.Get(ctx, "rt:"+presented).Result()
    if err != nil {
        // not a live token — was it a previously-spent one? -> theft
        if fam, e := rdb.Get(ctx, "spent:"+presented).Result(); e == nil {
            rdb.Del(ctx, "family:"+fam)            // revoke the whole family
            return "", errors.New("refresh reuse detected")
        }
        return "", errors.New("invalid refresh token")
    }
    rdb.Del(ctx, "rt:"+presented)                  // consume the live token
    rdb.Set(ctx, "spent:"+presented, family, 14*24*time.Hour) // remember it
    newRefresh := newSessionID()
    rdb.Set(ctx, "rt:"+newRefresh, family, 14*24*time.Hour)
    return newRefresh, nil
}
