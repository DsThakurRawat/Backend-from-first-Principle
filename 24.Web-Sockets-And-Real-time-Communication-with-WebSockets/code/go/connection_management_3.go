type Hub struct {
    clients    map[*Client]bool
    register   chan *Client
    unregister chan *Client
    broadcast  chan []byte
}

// One goroutine owns the map → all mutation is serialized here (no locks needed).
func (h *Hub) Run() {
    for {
        select {
        case c := <-h.register:
            h.clients[c] = true
        case c := <-h.unregister:
            if _, ok := h.clients[c]; ok {
                delete(h.clients, c)
                close(c.send) // tell the client's writer goroutine to stop
            }
        case msg := <-h.broadcast:
            for c := range h.clients {
                select {
                case c.send <- msg:        // queue into the client's buffered channel
                default:                   // buffer full → slow client; drop it (§12)
                    delete(h.clients, c)
                    close(c.send)
                }
            }
        }
    }
}
