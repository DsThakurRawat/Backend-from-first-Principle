import asyncio
import aiohttp

async def handle_request(user_id: int) -> dict:
    # await = "yield control to the event loop until this IO completes"
    user = await db.fetchone(
        "SELECT * FROM users WHERE id = $1", user_id
    )
    orders = await db.fetch(
        "SELECT * FROM orders WHERE user_id = $1", user_id
    )
    return {"user": user, "orders": orders}

# Run with an event loop (uvloop for performance)
asyncio.run(handle_request(123))
