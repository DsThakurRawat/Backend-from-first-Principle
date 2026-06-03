# proto:  rpc UploadEvents(stream Event) returns (UploadSummary);

# ===== SERVER: request_iterator yields incoming messages; return once =====
class UserService(pb_grpc.UserServiceServicer):
    def UploadEvents(self, request_iterator, context):
        count = 0
        for ev in request_iterator:   # iterate the client's stream
            store(ev)
            count += 1
        return pb.UploadSummary(received=count)  # single reply after client closes

# ===== CLIENT: pass an iterable/generator of requests; get one response =====
def upload_events(stub, events):
    def gen():
        for ev in events:
            yield ev
    summary = stub.UploadEvents(gen(), timeout=30.0)  # returns the single summary
    print("server received", summary.received, "events")
