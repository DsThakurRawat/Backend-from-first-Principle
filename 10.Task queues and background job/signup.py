# signup.py — Producer side (inside your API handler)
from fastapi import FastAPI
from tasks import send_verification_email

app = FastAPI()

@app.post("/signup")
async def signup(body: SignupRequest):
    # 1. Validate, hash password, save user to DB
    user = await create_user(body)
    token = generate_verification_token(user.id)

    # 2. Enqueue — returns instantly, does NOT wait for email
    send_verification_email.delay(
        user_id=user.id,
        email=user.email,
        token=token
    )

    # 3. Return 201 immediately
    return {"message": "Account created. Check your email."}, 201
