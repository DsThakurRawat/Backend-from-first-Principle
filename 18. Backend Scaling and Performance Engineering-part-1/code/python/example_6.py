import json, redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

def get_product(product_id: str) -> dict:
    cache_key = f"product:{product_id}"

    # 1. Try cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)  # Cache HIT

    # 2. Cache miss — query database
    product = query_product_from_db(product_id)

    # 3. Store with 10-minute TTL
    r.setex(cache_key, 600, json.dumps(product))
    return product
