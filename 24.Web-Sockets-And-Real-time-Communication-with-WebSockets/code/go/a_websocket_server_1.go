// github.com/gorilla/websocket
var upgrader = websocket.Upgrader{
    // CheckOrigin guards against cross-site hijacking — DO NOT leave it open (§14).
    CheckOrigin: func(r *http.Request) bool {
        return r.Header.Get("Origin") == "https://app.example.com"
    },
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil) // performs the 101 handshake (§4)
    if err != nil {
        return // upgrader already wrote an HTTP error
    }
    defer conn.Close() // always close → frees the socket (§19)

    for { // the READ LOOP — one per connection
        mt, msg, err := conn.ReadMessage()
        if err != nil {
            break // client closed or connection died (§6) → exit, cleanup via defer
        }
        // echo it straight back
        if err := conn.WriteMessage(mt, msg); err != nil {
            break
        }
    }
}

func main() {
    http.HandleFunc("/ws", wsHandler) // a normal HTTP route that upgrades
    http.ListenAndServe(":8080", nil)
}
