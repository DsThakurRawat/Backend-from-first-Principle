import asyncio

class Hub:
    def __init__(self):
        self.clients: set[WebSocket] = set()   # the active connection set

    async def register(self, ws: WebSocket):
        await ws.accept()
        self.clients.add(ws)

    def unregister(self, ws: WebSocket):
        self.clients.discard(ws)               # idempotent removal

    async def broadcast(self, message: str):
        dead = []
        for ws in self.clients:
            try:
                await ws.send_text(message)     # fan out to everyone
            except Exception:
                dead.append(ws)                 # send failed → connection is gone
        for ws in dead:
            self.unregister(ws)                 # clean up on the way out

hub = Hub()
# (asyncio is single-threaded, so the set needs no lock; just don't mutate
#  it while iterating — collect dead ones, remove after.)
