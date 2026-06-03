# A WSGI/Flask-style middleware receives the request and a `next`
# callable that invokes the rest of the chain.
def logging_middleware(next):
    def wrapper(request):
        print(f"{request.method} {request.path}")  # do work

        # EARLY EXIT example (short-circuit, never calls next):
        if request.headers.get("X-Blocked") == "yes":
            return Response("forbidden", status=403)  # stops here

        return next(request)  # === next(): continue the chain ===
    return wrapper
