# ===== CLIENT: attach a deadline (timeout=) + metadata =====
metadata = (
    ("authorization", f"Bearer {token}"),  # auth as metadata, §16
    ("x-request-id", req_id),               # trace id for correlation
)
try:
    resp = stub.GetUser(pb.GetUserRequest(id="u42"),
                        timeout=1.0,         # the deadline, in seconds
                        metadata=metadata)
except grpc.RpcError as e:
    if e.code() == grpc.StatusCode.DEADLINE_EXCEEDED:
        print("call timed out")             # a network-shaped failure

# ===== SERVER: read metadata, check for cancellation =====
class UserService(pb_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        md = dict(context.invocation_metadata())
        auth = md.get("authorization")       # verify token (or in an interceptor, §15)

        if not context.is_active():          # client gone / deadline passed?
            return pb.GetUserResponse()      # abandon the work
        return self.lookup(request.id)
