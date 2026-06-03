// proto:  rpc Chat(stream ChatMessage) returns (stream ChatMessage);

// ===== SERVER: loop Recv() and Send() on the same stream =====
func (s *server) Chat(stream userv1.UserService_ChatServer) error {
    for {
        msg, err := stream.Recv()
        if err == io.EOF { return nil } // client closed its send side
        if err != nil { return err }
        // echo back (or broadcast to a room, etc.) — can Send anytime, any number
        reply := &userv1.ChatMessage{User: "server", Text: "ack: " + msg.GetText()}
        if err := stream.Send(reply); err != nil { return err }
    }
}

// ===== CLIENT: typically Send in one goroutine, Recv in another =====
func chat(client userv1.UserServiceClient) {
    stream, _ := client.Chat(context.Background())
    go func() { // concurrent receiver
        for {
            in, err := stream.Recv()
            if err != nil { return }
            log.Printf("<< %s", in.GetText())
        }
    }()
    for _, t := range []string{"hi", "how are you", "bye"} {
        stream.Send(&userv1.ChatMessage{User: "ada", Text: t}) // send concurrently
    }
    stream.CloseSend() // signal we're done sending; receiver drains the rest
}
