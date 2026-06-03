# ===== SERVER =====
from concurrent import futures
import grpc
import user_pb2 as pb          # generated: messages
import user_pb2_grpc as pb_grpc  # generated: service base classes

class UserService(pb_grpc.UserServiceServicer):
    # Method signature generated FROM the proto: (self, request, context) -> response
    def GetUser(self, request, context):
        if not request.id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "id is required")  # typed error, §14
        # ...real work: query the DB by request.id...
        user = pb.User(id=request.id, email="ada@example.com",
                       full_name="Ada", role=pb.ROLE_ADMIN)
        return pb.GetUserResponse(user=user)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb_grpc.add_UserServiceServicer_to_server(UserService(), server)  # wire impl to service
    server.add_insecure_port("[::]:50051")  # insecure = local dev only
    server.start()
    print("gRPC on :50051")
    server.wait_for_termination()

# ===== CLIENT =====
def call_get_user():
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = pb_grpc.UserServiceStub(channel)        # the generated STUB
        try:
            # timeout= is the deadline, §13; looks local, runs remote
            resp = stub.GetUser(pb.GetUserRequest(id="u42"), timeout=1.0)
            print("got user:", resp.user.full_name)
        except grpc.RpcError as e:
            print("failed:", e.code(), e.details())     # carries the gRPC status code

if __name__ == "__main__":
    serve()
