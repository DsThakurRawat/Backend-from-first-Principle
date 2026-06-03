import "google.golang.org/grpc/credentials"

// ===== SERVER over TLS =====
creds, _ := credentials.NewServerTLSFromFile("server.crt", "server.key")
s := grpc.NewServer(grpc.Creds(creds)) // every connection is now encrypted

// ===== CLIENT over TLS =====
tlsCreds := credentials.NewTLS(&tls.Config{RootCAs: pool}) // trust this CA
conn, _ := grpc.NewClient("api.example.com:443", grpc.WithTransportCredentials(tlsCreds))

// ===== Per-call token (combine with TLS) =====
// Implement credentials.PerRPCCredentials so a fresh token rides on every call:
type tokenCreds struct{ token string }
func (t tokenCreds) GetRequestMetadata(ctx context.Context, _ ...string) (map[string]string, error) {
    return map[string]string{"authorization": "Bearer " + t.token}, nil
}
func (t tokenCreds) RequireTransportSecurity() bool { return true } // refuse to send token in cleartext

conn, _ = grpc.NewClient("api.example.com:443",
    grpc.WithTransportCredentials(tlsCreds),
    grpc.WithPerRPCCredentials(tokenCreds{token}),
)
