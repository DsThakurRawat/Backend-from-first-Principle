from fastapi import Header, HTTPException

seen: dict[str, dict] = {}  # use Redis with a TTL in production

@app.post("/payments", status_code=201)
def create_payment(payload: dict, idempotency_key: str = Header(...)):
    if idempotency_key in seen:          # replay: return the stored result
        return seen[idempotency_key]
    result = charge(payload)             # the real, non-idempotent work
    seen[idempotency_key] = result       # remember it BEFORE responding
    return result
