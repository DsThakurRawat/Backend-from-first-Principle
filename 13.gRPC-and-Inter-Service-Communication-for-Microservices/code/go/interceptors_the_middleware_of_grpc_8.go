// A unary server interceptor: signature is fixed by the framework.
func authInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler) (any, error) {

    md, _ := metadata.FromIncomingContext(ctx)
    tokens := md.Get("authorization")
    if len(tokens) == 0 || !valid(tokens[0]) {
        return nil, status.Error(codes.Unauthenticated, "missing or invalid token")
    }
    // attach the verified identity for the handler to read from ctx
    ctx = context.WithValue(ctx, userKey{}, parse(tokens[0]))
    return handler(ctx, req) // call the next link / the real handler
}

func loggingInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler) (any, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    log.Printf("%s took %s -> %s", info.FullMethod, time.Since(start), status.Code(err))
    return resp, err
}

// Register the chain when building the server (outermost listed first):
s := grpc.NewServer(
    grpc.ChainUnaryInterceptor(loggingInterceptor, authInterceptor),
)
