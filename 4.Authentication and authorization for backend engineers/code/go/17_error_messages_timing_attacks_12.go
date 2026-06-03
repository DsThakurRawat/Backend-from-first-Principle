// dummyHash: a fixed, precomputed bcrypt hash, used to equalize timing.
var dummyHash = "$2a$12$abcdefghijklmnopqrstuv0000000000000000000000000000000000"

func Authenticate(w http.ResponseWriter, email, pw string) {
    start := time.Now()
    const floor = 250 * time.Millisecond // equalize every path

    defer func() { // pad so all outcomes take ~the same time
        if d := time.Since(start); d < floor {
            time.Sleep(floor - d)
        }
    }()

    user, found := lookupByEmail(email)
    if !found {
        // still run a dummy hash so step-3 cost is paid anyway
        bcrypt.CompareHashAndPassword([]byte(dummyHash), []byte(pw))
        http.Error(w, "authentication failed", http.StatusUnauthorized)
        return
    }
    // CompareHashAndPassword is constant-time internally
    if bcrypt.CompareHashAndPassword([]byte(user.Hash), []byte(pw)) != nil {
        http.Error(w, "authentication failed", http.StatusUnauthorized)
        return
    }
    // success: issue session / JWT ...
}
