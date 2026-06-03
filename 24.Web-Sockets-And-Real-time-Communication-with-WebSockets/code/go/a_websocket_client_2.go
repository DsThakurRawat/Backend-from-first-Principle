// github.com/gorilla/websocket
func runClient() {
    // Dial performs the upgrade handshake; header carries auth where allowed (§13).
    h := http.Header{"Authorization": {"Bearer " + token}}
    conn, _, err := websocket.DefaultDialer.Dial("wss://api.example.com/ws", h)
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    // reader goroutine
    go func() {
        for {
            _, msg, err := conn.ReadMessage()
            if err != nil {
                return
            }
            log.Printf("recv: %s", msg)
        }
    }()

    // send a message
    conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"hello"}`))

    // graceful close: send a close frame, then the socket shuts (§6)
    conn.WriteMessage(websocket.CloseMessage,
        websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye"))
}
