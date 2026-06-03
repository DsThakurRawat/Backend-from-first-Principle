from functools import wraps
from flask import request, g, jsonify

def require_session(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        sid = request.cookies.get("sid")
        if not sid:
            return jsonify(error="authentication failed"), 401
        raw = rdb.get(f"sess:{sid}")     # None if missing/expired
        if raw is None:
            return jsonify(error="authentication failed"), 401
        g.user = json.loads(raw)          # attach for later handlers
        return view(*args, **kwargs)
    return wrapper

@app.get("/notes")
@require_session
def notes():
    return jsonify(owner=g.user["id"])
