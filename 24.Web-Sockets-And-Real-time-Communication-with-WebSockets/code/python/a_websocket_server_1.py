# FastAPI / Starlette expose WebSockets natively (the `websockets` lib is an alternative).
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def ws_handler(ws: WebSocket):
    # Validate origin yourself before accepting (§14); then complete the handshake.
    await ws.accept()                      # performs the 101 handshake (§4)
    try:
        while True:                        # the READ LOOP — one coroutine per connection
            msg = await ws.receive_text()  # awaits the next message
            await ws.send_text(msg)        # echo it straight back
    except WebSocketDisconnect:
        pass                               # client closed or connection died (§6)
    # FastAPI cleans up the connection when the coroutine returns

# uvicorn app:app  — uvicorn speaks the WebSocket protocol for you
