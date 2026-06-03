// proto:  rpc ListUsers(ListUsersRequest) returns (stream User);

// ===== SERVER: receive one req, call stream.Send(...) repeatedly =====
func (s *server) ListUsers(req *userv1.ListUsersRequest, stream userv1.UserService_ListUsersServer) error {
    for _, u := range queryUsers(req.GetFilter()) { // imagine this yields a big result set
        if err := stream.Send(u); err != nil {       // push one message down the stream
            return err                                // client gone / cancelled
        }
    }
    return nil // returning nil closes the stream cleanly (sends OK trailer)
}

// ===== CLIENT: call once, then Recv() in a loop until io.EOF =====
func listUsers(client userv1.UserServiceClient) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    stream, _ := client.ListUsers(ctx, &userv1.ListUsersRequest{Filter: "active"})
    for {
        u, err := stream.Recv()
        if err == io.EOF { break } // server closed the stream — we're done
        if err != nil { log.Fatal(err) }
        log.Printf("user: %s", u.GetFullName())
    }
}
