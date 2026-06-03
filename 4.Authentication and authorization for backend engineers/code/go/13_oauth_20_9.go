// Build the PKCE pair before redirecting the user.
func newPKCE() (verifier, challenge string) {
    b := make([]byte, 32)
    rand.Read(b)
    verifier = base64.RawURLEncoding.EncodeToString(b)
    sum := sha256.Sum256([]byte(verifier))
    challenge = base64.RawURLEncoding.EncodeToString(sum[:])
    return
}

// Leg 2: exchange the code (send code_verifier, not the secret).
func exchange(code, verifier string) (*TokenResp, error) {
    form := url.Values{
        "grant_type":    {"authorization_code"},
        "code":          {code},
        "redirect_uri":  {"https://notes.app/callback"},
        "client_id":     {"note_app"},
        "code_verifier": {verifier},
    }
    resp, err := http.PostForm("https://auth.example/token", form)
    if err != nil { return nil, err }
    defer resp.Body.Close()
    var t TokenResp
    json.NewDecoder(resp.Body).Decode(&t)
    return &t, nil
}
