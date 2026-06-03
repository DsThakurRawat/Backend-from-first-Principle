import json, secrets
import bcrypt
import redis
from flask import Flask, request, make_response

app = Flask(__name__)
rdb = redis.Redis(host="localhost", port=6379)
TTL = 15 * 60  # 15 minutes

# hash once at signup; store hash, never the password
def hash_password(pw: str) -> bytes:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt())

# bcrypt.checkpw is constant-time internally
def check_password(hash_: bytes, pw: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hash_)

def new_session_id() -> str:
    return secrets.token_hex(32)  # cryptographically random

@app.post("/login")
def login():
    body = request.get_json()
    # ... look up user, check_password(stored_hash, body["password"]) ...
    user = {"id": "u_42", "role": "admin"}

    sid = new_session_id()
    # store {sessionID -> userData} with a 15-minute TTL
    rdb.setex(f"sess:{sid}", TTL, json.dumps(user))

    resp = make_response({"ok": True})
    resp.set_cookie(
        "sid", sid,
        httponly=True,   # JS cannot read it
        secure=True,     # HTTPS only
        samesite="Lax",
        max_age=TTL,
        path="/",
    )
    return resp
