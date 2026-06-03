import uuid
import json
import redis
from datetime import timedelta

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

def create_session(user_id: str, user_data: dict) -> str:
    """Create a session after successful login. Store in Redis."""
    session_id = str(uuid.uuid4())
    session_key = f"session:{session_id}"

    # Store session data with 24-hour TTL
    # TTL ensures sessions auto-expire — no manual cleanup needed
    r.setex(
        session_key,
        timedelta(hours=24),
        json.dumps({"user_id": user_id, **user_data})
    )

    return session_id  # returned to client as cookie/token


def get_session(session_id: str) -> dict | None:
    """
    Validate session on every authenticated API request.
    Redis O(1) lookup — microseconds, not milliseconds.
    """
    session_key = f"session:{session_id}"
    data = r.get(session_key)

    if not data:
        return None  # session expired or invalid

    # Optionally: refresh TTL on activity (sliding window)
    r.expire(session_key, timedelta(hours=24))

    return json.loads(data)


def delete_session(session_id: str):
    """Logout — delete session from Redis immediately."""
    r.delete(f"session:{session_id}")
