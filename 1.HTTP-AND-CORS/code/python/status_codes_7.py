from fastapi import HTTPException, Header

@app.get("/users/{id}")
def get_user(id: int, authorization: str = Header(default="")):
    if not authorization:
        raise HTTPException(401, "login required")     # 401: who are you?
    user = db.find(id)
    if user is None:
        raise HTTPException(404, "no such user")        # 404
    if not user.visible_to(authorization):
        raise HTTPException(403, "forbidden")           # 403: not allowed
    return user                                         # 200
