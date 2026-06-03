import jwt   # PyJWT
from datetime import datetime, timedelta, timezone

SECRET = "keep-this-very-secret"

# mint a self-contained token carrying the claims
def sign(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":  user_id,                 # user id
        "role": role,                    # for authorization
        "iat":  now,                     # issued at
        "exp":  now + timedelta(hours=1) # expiry
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

# verify signature + expiry; returns the claims if valid
def verify(token: str) -> dict:
    # algorithms is a whitelist -> stops "alg: none" attacks
    return jwt.decode(token, SECRET, algorithms=["HS256"])

# hybrid: after verify(), also check a revocation blacklist
def is_revoked(rdb, jti_or_token: str) -> bool:
    return rdb.sismember("jwt:blacklist", jti_or_token)
