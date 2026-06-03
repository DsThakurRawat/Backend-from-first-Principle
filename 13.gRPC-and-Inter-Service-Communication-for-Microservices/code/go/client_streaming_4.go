// proto:  rpc UploadEvents(stream Event) returns (UploadSummary);

// ===== SERVER: Recv() in a loop, then SendAndClose() once at the end =====
func (s *server) UploadEvents(stream userv1.UserService_UploadEventsServer) error {
    count := 0
    for {
        ev, err := stream.Recv()
        if err == io.EOF { // client finished sending — now reply once
            return stream.SendAndClose(&userv1.UploadSummary{Received: int32(count)})
        }
        if err != nil { return err }
        store(ev)
        count++
    }
}

// ===== CLIENT: Send() many, then CloseAndRecv() for the single reply =====
func uploadEvents(client userv1.UserServiceClient, events []*userv1.Event) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    stream, _ := client.UploadEvents(ctx)
    for _, ev := range events {
        stream.Send(ev) // push each one up
    }
    summary, err := stream.CloseAndRecv() // close our side, await the summary
    if err != nil { log.Fatal(err) }
    log.Printf("server received %d events", summary.GetReceived())
}
