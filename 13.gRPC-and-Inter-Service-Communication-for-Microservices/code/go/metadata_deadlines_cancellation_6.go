// ===== CLIENT: attach a deadline + metadata =====
ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second) // absolute deadline
defer cancel() // cancel frees resources whether we time out or finish early

ctx = metadata.AppendToOutgoingContext(ctx,
    "authorization", "Bearer "+token,   // auth travels as metadata, §16
    "x-request-id", reqID)              // trace id for correlation, like §15 of the layers manual

resp, err := client.GetUser(ctx, &userv1.GetUserRequest{Id: "u42"})
if status.Code(err) == codes.DeadlineExceeded {
    log.Println("call timed out") // a network-shaped failure a local call never had
}

// ===== SERVER: read metadata, respect the inherited deadline =====
func (s *server) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
    md, _ := metadata.FromIncomingContext(ctx)
    auth := md.Get("authorization") // verify token here (or in an interceptor, §15)

    // ctx already carries the client's remaining deadline + cancellation —
    // pass it straight to the DB driver so slow work is abandoned automatically.
    if ctx.Err() != nil { return nil, status.FromContextError(ctx.Err()).Err() }
    _ = auth
    return s.lookup(ctx, req.GetId())
}
