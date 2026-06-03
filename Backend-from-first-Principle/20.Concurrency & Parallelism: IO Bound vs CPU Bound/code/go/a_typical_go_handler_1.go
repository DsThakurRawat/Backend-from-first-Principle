// From Go's standard library net/http/server.go (simplified)
func (srv *Server) Serve(l net.Listener) error {
    for {
        conn, err := l.Accept()   // Accept new TCP connection
        if err != nil {
            return err
        }
        // Create a NEW goroutine for each connection
        go srv.handleConn(conn)
    }
}
