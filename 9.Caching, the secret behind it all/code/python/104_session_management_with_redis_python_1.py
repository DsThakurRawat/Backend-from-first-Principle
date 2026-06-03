import json
import functools
import redis
from fastapi import FastAPI

app = FastAPI()

# Connect to Redis
r = redis.Redis(host="localhost", port=6379, decode_responses=True)

def cache_result(ttl: int = 3600):
    """
    Decorator that implements lazy (cache-aside) caching.
    ttl: time-to-live in seconds (default 1 hour)
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from function name + args
            cache_key = f"{func.__name__}:{args}:{kwargs}"

            # Step 1: Check cache (Cache Hit)
            cached = r.get(cache_key)
            if cached:
                print(f"[CACHE HIT] {cache_key}")
                return json.loads(cached)

            # Step 2: Cache Miss — execute the actual function
            print(f"[CACHE MISS] calling {func.__name__}...")
            result = await func(*args, **kwargs)

            # Step 3: Store in Redis with TTL
            r.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator


# Usage: apply cache decorator to any route handler
@app.get("/products/{product_id}")
@cache_result(ttl=3600)  # cache for 1 hour
async def get_product(product_id: str):
    # Expensive DB query — only runs on cache miss
    product = await fetch_from_db(product_id)
    return product


# TTL-based API Response Caching (e.g. weather)
@app.get("/weather/{city}")
async def get_weather(city: str):
    cache_key = f"weather:{city}"

    # Check cache (TTL = 1 hour, weather doesn't change every minute)
    cached = r.get(cache_key)
    if cached:
        return {"source": "cache", "data": json.loads(cached)}

    # Miss: call external weather API (costs money / rate limited)
    weather_data = await call_weather_api(city)

    # Store for 1 hour
    r.setex(cache_key, 3600, json.dumps(weather_data))

    return {"source": "api", "data": weather_data}
