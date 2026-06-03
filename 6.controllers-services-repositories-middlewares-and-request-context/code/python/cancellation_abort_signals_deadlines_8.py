import uuid

def request_id_middleware(next):
    def wrapper(request):
        rid = str(uuid.uuid4())  # one unique id for this request
        request.context["request_id"] = rid
        print(f"[{rid}] {request.method} {request.path}")
        resp = next(request)
        resp.headers["X-Request-ID"] = rid  # echo it back / forward it
        return resp
    return wrapper
