import hmac

# Double-submit: compare the CSRF cookie against the header.
def check_csrf(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if request.method in ("GET", "HEAD"):
            return view(*args, **kwargs)
        cookie = request.cookies.get("csrf", "")
        header = request.headers.get("X-CSRF-Token", "")
        if not cookie or not hmac.compare_digest(cookie, header):
            return jsonify(error="forbidden"), 403
        return view(*args, **kwargs)
    return wrapper

# Regenerate the session ID right after a successful login.
def regenerate_session(old_sid: str) -> str:
    raw = rdb.get(f"sess:{old_sid}")
    rdb.delete(f"sess:{old_sid}")            # kill the pre-login ID
    new_sid = secrets.token_hex(32)          # brand-new value
    rdb.setex(f"sess:{new_sid}", 15 * 60, raw)
    return new_sid
