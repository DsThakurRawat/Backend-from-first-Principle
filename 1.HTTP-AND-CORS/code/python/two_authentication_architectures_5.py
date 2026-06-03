from fastapi import Response, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Set a secure session cookie after login (stateful)
@app.post("/login")
def login(response: Response):
    sid = new_session_id()
    sessions[sid] = user_id                  # server-side session store (use Redis)
    response.set_cookie(
        key="session", value=sid,
        httponly=True,                       # JS can't read it
        secure=True,                         # HTTPS only
        samesite="strict",                   # CSRF defense
        max_age=3600, path="/",
    )

# Bearer-token auth dependency (stateless)
bearer = HTTPBearer()

def require_token(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    if not valid_jwt(cred.credentials):
        raise HTTPException(401, "unauthorized",
                            headers={"WWW-Authenticate": "Bearer"})

@app.get("/me")
def me(_=Depends(require_token)):
    return {"ok": True}
