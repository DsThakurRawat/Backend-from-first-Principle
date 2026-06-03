import redis, uuid
from fastapi import FastAPI, Response, Cookie

app = FastAPI()
r = redis.Redis(host="redis", decode_responses=True)

@app.post("/login")
def login(response: Response, email: str, password: str):
    user = authenticate(email, password)
    session_id = str(uuid.uuid4())

    # Store in Redis — accessible by ALL server instances
    r.setex(f"session:{session_id}", 86400, user.id)
    response.set_cookie("session_id", session_id, httponly=True)
    return {"status": "ok"}
