ALLOWED_ORIGIN = "https://app.example.com"

def cors_middleware(next):
    def wrapper(request):
        resp = next(request)
        origin = request.headers.get("Origin")  # runtime gives us this
        if origin == ALLOWED_ORIGIN:
            resp.headers["Access-Control-Allow-Origin"] = origin
        return resp
    return wrapper

def auth_middleware(next):
    def wrapper(request):
        token = request.headers.get("Authorization")
        try:
            user_id, role = verify_token(token)
        except Exception:
            return Response("unauthorized", status=401)  # stop
        # SUCCESS: stash identity in the request context, then continue.
        request.context["user_id"] = user_id
        request.context["role"] = role
        return next(request)
    return wrapper
