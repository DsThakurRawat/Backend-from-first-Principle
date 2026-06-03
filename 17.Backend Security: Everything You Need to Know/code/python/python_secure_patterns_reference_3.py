from fastapi import FastAPI, HTTPException, Response
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import secrets

ph = PasswordHasher(time_cost=1, memory_cost=65536, parallelism=4)

@app.post("/login")
async def login(email: str, password: str, response: Response):
    # 1. Parameterised query (psycopg2 / asyncpg)
    row = await db.fetchrow(
        "SELECT id, password_hash FROM users WHERE email = $1", email
    )

    # 2. Constant-time verify. Generic error always.
    valid = False
    if row:
        try:
            ph.verify(row["password_hash"], password)
            valid = True
        except VerifyMismatchError:
            pass

    if not valid:
        raise HTTPException(401, "invalid email or password")

    # 3. Cryptographically secure session token (32 bytes = 256 bits)
    session_id = secrets.token_urlsafe(32)
    await redis.set(f"session:{session_id}", row["id"], ex=604800)

    # 4. HttpOnly + Secure + SameSite cookie
    response.set_cookie(
        key="session_id", value=session_id,
        httponly=True, secure=True,
        samesite="strict", max_age=604800
    )
    return {"status": "ok"}
