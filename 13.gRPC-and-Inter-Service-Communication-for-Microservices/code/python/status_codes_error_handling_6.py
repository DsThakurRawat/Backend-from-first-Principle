import grpc

# SERVER: abort with a code + message (or set_code/set_details then return).
class UserService(pb_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        if not request.id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "id is required")
        user = self.db.find(request.id)
        if user is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"no user with id {request.id!r}")
        return pb.GetUserResponse(user=user)

# CLIENT: catch RpcError and switch on .code()
try:
    resp = stub.GetUser(req, timeout=1.0)
except grpc.RpcError as e:
    if e.code() == grpc.StatusCode.NOT_FOUND:
        ...   # expected — show "not found"
    elif e.code() == grpc.StatusCode.UNAVAILABLE:
        ...   # transient — retry with backoff, §17
    else:
        print("unexpected:", e.code(), e.details())
