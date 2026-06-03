# proto:  rpc Chat(stream ChatMessage) returns (stream ChatMessage);

# ===== SERVER: iterate incoming, yield outgoing — interleaved =====
class UserService(pb_grpc.UserServiceServicer):
    def Chat(self, request_iterator, context):
        for msg in request_iterator:          # read the client's stream
            yield pb.ChatMessage(user="server", text="ack: " + msg.text)  # write back

# ===== CLIENT: pass a request generator; iterate the response stream =====
def chat(stub):
    def outgoing():
        for t in ["hi", "how are you", "bye"]:
            yield pb.ChatMessage(user="ada", text=t)
    responses = stub.Chat(outgoing())   # both directions live at once
    for reply in responses:
        print("<<", reply.text)

# (for true concurrency under load, prefer the async API: grpc.aio)
