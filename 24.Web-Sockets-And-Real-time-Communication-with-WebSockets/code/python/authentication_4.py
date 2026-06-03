@app.websocket("/ws")
async def ws_handler(ws: WebSocket):
    # AUTHENTICATE FIRST — before accept(). Close with a policy code if it fails.
    token = ws.query_params.get("token")          # or a cookie / subprotocol
    user = verify_jwt(token)                       # your auth logic (auth chapter)
    if user is None:
        await ws.close(code=1008)                  # 1008 = policy violation; no accept
        return
    await ws.accept()                              # only now complete the handshake
    await serve(ws, user)                          # messages are tied to `user`
