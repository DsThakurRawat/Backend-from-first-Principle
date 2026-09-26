import asyncio

balance = 100
lock = asyncio.Lock()

async def process_withdrawal(amount: int):
    await asyncio.sleep(0.01) # Simulate I/O yielding control to event loop

async def withdraw(amount: int):
    global balance
    async with lock: # Only one coroutine at a time
        if balance >= amount:
            await process_withdrawal(amount)
            balance -= amount

async def main():
    await asyncio.gather(
        withdraw(100),
        withdraw(100),
    )
    print(balance) # 0, not -100

asyncio.run(main())
