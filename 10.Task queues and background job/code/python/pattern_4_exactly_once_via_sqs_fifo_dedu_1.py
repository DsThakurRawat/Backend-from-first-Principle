# Python — Idempotency key pattern with Redis
import redis
import hashlib

r = redis.Redis(host='localhost', port=6379)

@app.task(bind=True, max_retries=5)
def send_verification_email(self, user_id: str, email: str, token: str):
    # Build idempotency key from task inputs
    key = f"idem:verify_email:{user_id}:{token}"

    # SET NX = set only if Not eXists; EX = expire after 1 hour
    # Returns True if we are the FIRST execution, False if already done
    acquired = r.set(key, "done", nx=True, ex=3600)
    if not acquired:
        # Already processed — skip silently (idempotent return)
        return {"status": "already_sent"}

    # First time — actually send the email
    try:
        _send_email_via_provider(email, token)
    except Exception as exc:
        # Delete the key so next retry can attempt again
        r.delete(key)
        raise self.retry(exc=exc, countdown=60 * 2 ** self.request.retries)
