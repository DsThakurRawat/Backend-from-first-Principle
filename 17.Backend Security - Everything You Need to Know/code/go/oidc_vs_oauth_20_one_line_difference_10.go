import (
    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
)

var (
    provider, _ = oidc.NewProvider(ctx, "https://accounts.google.com")
    verifier     = provider.Verifier(&oidc.Config{ClientID: os.Getenv("GOOGLE_CLIENT_ID")})
    oauth2Cfg    = &oauth2.Config{
        ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
        RedirectURL:  "https://yourapp.com/auth/callback",
        Scopes:       []string{oidc.ScopeOpenID, "email", "profile"},
        Endpoint:     provider.Endpoint(),
    }
)

func callbackHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Verify state matches what we stored in session (CSRF protection)
    if r.URL.Query().Get("state") != getSessionState(r) {
        http.Error(w, "invalid state", 400); return
    }

    // 2. Exchange code for tokens (server-to-server)
    token, _ := oauth2Cfg.Exchange(ctx, r.URL.Query().Get("code"))
    rawIDToken := token.Extra("id_token").(string)

    // 3. Verify ID token signature + aud + exp
    idToken, err := verifier.Verify(ctx, rawIDToken)
    if err != nil { http.Error(w, "invalid token", 401); return }

    // 4. Extract claims
    var claims struct { Email string `json:"email"`; Sub string `json:"sub"` }
    idToken.Claims(&claims)

    // 5. Upsert user in DB, create session, set cookie
    userID := upsertUser(claims.Sub, claims.Email)
    setSecureSessionCookie(w, userID)
    http.Redirect(w, r, "/dashboard", http.StatusFound)
}
