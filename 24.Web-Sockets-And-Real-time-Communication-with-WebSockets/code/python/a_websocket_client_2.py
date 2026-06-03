# `websockets` library — clean async client
import asyncio, websockets

async def run_client():
    # extra_headers carries auth where the runtime allows it (§13);
    # browsers can't set headers, but a backend client can.
    async with websockets.connect(
        "wss://api.example.com/ws",
        extra_headers={"Authorization": f"Bearer {token}"},
    ) as ws:                                 # context manager → handshake + clean close
        await ws.send('{"type":"hello"}')    # send a message

        async for msg in ws:                 # iterate incoming messages
            print("recv:", msg)
    # leaving the `async with` block sends a close frame and shuts down (§6)

asyncio.run(run_client())
