import hashlib, hmac

# Store only the HASH of issued keys (like passwords).
def hash_key(k: str) -> str:
    return hashlib.sha256(k.encode()).hexdigest()

def require_api_key(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        key = request.headers.get("X-API-Key", "")
        client = lookup_client(hash_key(key))   # your DB lookup
        if client is None:
            return jsonify(error="authentication failed"), 401
        # check scopes, quota, expiry on `client` here
        # hmac.compare_digest is constant-time
        if not hmac.compare_digest(hash_key(key), client["key_hash"]):
            return jsonify(error="authentication failed"), 401
        g.client = client
        return view(*args, **kwargs)
    return wrapper
