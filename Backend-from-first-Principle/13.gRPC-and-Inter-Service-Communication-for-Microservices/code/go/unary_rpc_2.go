// ===== SERVER =====
package main

import (
    "context"
    "log"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    userv1 "example.com/gen/userv1" // generated from user.proto
)

// Embed the generated UnimplementedUserServiceServer for forward-compat.
type server struct {
    userv1.UnimplementedUserServiceServer
}

// The method signature is generated FROM the proto: ctx, *Request -> *Response, error
func (s *server) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
    if req.GetId() == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required") // typed error, §14
    }
    // ...real work: query the DB by req.GetId()...
    u := &userv1.User{Id: req.GetId(), Email: "ada@example.com", FullName: "Ada", Role: userv1.Role_ROLE_ADMIN}
    return &userv1.GetUserResponse{User: u}, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    userv1.RegisterUserServiceServer(s, &server{}) // wire the impl to the service
    log.Println("gRPC on :50051")
    s.Serve(lis)
}

// ===== CLIENT =====
func callGetUser() {
    // NewClient replaces the deprecated grpc.Dial; insecure creds for local dev only
    conn, _ := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
    defer conn.Close()

    client := userv1.NewUserServiceClient(conn) // the generated STUB
    ctx, cancel := context.WithTimeout(context.Background(), time.Second) // always a deadline, §13
    defer cancel()

    resp, err := client.GetUser(ctx, &userv1.GetUserRequest{Id: "u42"}) // looks local, runs remote
    if err != nil {
        log.Fatalf("GetUser failed: %v", err) // err carries the gRPC status code
    }
    log.Printf("got user: %s", resp.GetUser().GetFullName())
}
