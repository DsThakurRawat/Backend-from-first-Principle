def require_jwt(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        h = request.headers.get("Authorization", "")
        if not h.startswith("Bearer "):
            return jsonify(error="authentication failed"), 401
        try:
            claims = verify(h.removeprefix("Bearer "))
        except jwt.PyJWTError:
            return jsonify(error="authentication failed"), 401
        # no store lookup — identity comes from the verified token
        g.user = {"id": claims["sub"], "role": claims["role"]}
        return view(*args, **kwargs)
    return wrapper
