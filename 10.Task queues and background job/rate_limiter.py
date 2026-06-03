# rate_limiter.py — Redis token bucket implementation
import time
import redis

class TokenBucketRateLimiter:
    def __init__(self, redis_client, key: str, capacity: int, refill_rate: float):
        self.r = redis_client
        self.key = key               # e.g. "ratelimit:resend_emails"
        self.capacity = capacity     # max burst (e.g. 100)
        self.refill_rate = refill_rate  # tokens per second (e.g. 10)

    def acquire(self) -> bool:
        """Returns True if a token was acquired, False if rate limited."""
        now = time.time()
        pipe = self.r.pipeline()

        # Lua script ensures atomic read-modify-write (no race conditions)
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        -- Refill tokens based on time elapsed
        local elapsed = now - last_refill
        tokens = math.min(capacity, tokens + elapsed * refill_rate)

        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return 1
        end
        return 0
        """
        result = self.r.eval(lua_script, 1, self.key, self.capacity, self.refill_rate, now)
        return bool(result)

# Usage inside a Celery task
limiter = TokenBucketRateLimiter(r, "ratelimit:resend", capacity=100, refill_rate=10)

@app.task(bind=True, max_retries=10)
def send_email_task(self, email, token):
    if not limiter.acquire():
        # Rate limited — retry after a short delay (not counted as failure)
        raise self.retry(countdown=1, max_retries=60)  # retry every 1s up to 60 times
    _do_send_email(email, token)
