func wsHandler(w http.ResponseWriter, r *http.Request) {
    // AUTHENTICATE FIRST — before upgrading. Reject with a normal HTTP error.
    token := r.URL.Query().Get("token")          // or read a cookie / subprotocol
    user, err := verifyJWT(token)                 // your auth logic (auth chapter)
    if err != nil {
        http.Error(w, "unauthorized", http.StatusUnauthorized) // 401, no upgrade
        return
    }
    // Only now perform the upgrade; attach the identity to the connection.
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    serve(conn, user) // every message from this conn is now tied to `user`
}
