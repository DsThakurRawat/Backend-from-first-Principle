# require_role runs AFTER an auth decorator that set g.user
def require_role(*roles):
    allowed = set(roles)
    def deco(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if g.user["role"] not in allowed:
                return jsonify(error="forbidden"), 403   # 403
            return view(*args, **kwargs)
        return wrapper
    return deco

# usage: only admins reach the dead-zone handler
@app.get("/admin/deadzone")
@require_jwt
@require_role("admin")
def dead_zone():
    return jsonify(notes=[...])
