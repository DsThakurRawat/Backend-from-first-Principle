# proto:  rpc ListUsers(ListUsersRequest) returns (stream User);

# ===== SERVER: a generator — every `yield` sends one message =====
class UserService(pb_grpc.UserServiceServicer):
    def ListUsers(self, request, context):
        for u in query_users(request.filter):  # big result set
            yield u                             # yielding pushes one message down the stream
        # function returning ends the stream cleanly

# ===== CLIENT: the call returns an ITERABLE of responses =====
def list_users(stub):
    responses = stub.ListUsers(pb.ListUsersRequest(filter="active"), timeout=10.0)
    for u in responses:        # iterate until the server closes the stream
        print("user:", u.full_name)
