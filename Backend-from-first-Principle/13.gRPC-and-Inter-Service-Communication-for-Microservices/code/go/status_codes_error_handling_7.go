import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

// SERVER: return a typed status, not a bare error string.
func (s *server) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
    if req.GetId() == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }
    u, found := s.db.Find(req.GetId())
    if !found {
        return nil, status.Errorf(codes.NotFound, "no user with id %q", req.GetId())
    }
    return &userv1.GetUserResponse{User: u}, nil
}

// CLIENT: inspect the code to decide what to do.
resp, err := client.GetUser(ctx, req)
if err != nil {
    st := status.Convert(err)        // pull the status out of the error
    switch st.Code() {
    case codes.NotFound:        // expected — show "not found" in UI
    case codes.Unavailable:     // transient — retry with backoff, §17
    default:                    log.Printf("unexpected: %v: %s", st.Code(), st.Message())
    }
}
