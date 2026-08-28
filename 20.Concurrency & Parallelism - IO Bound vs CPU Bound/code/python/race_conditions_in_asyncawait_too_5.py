balance = 100

async def withdraw(amount: int):
    global balance
    if balance >= amount:               # Check at time T1
        await process_withdrawal(amount)  # ← yields control here!
        balance -= amount                 # Deduct at time T2

# Both coroutines see balance=100, both pass the check,
# both deduct 100 → balance = -100 (invalid!)
await asyncio.gather(
    withdraw(100),
    withdraw(100),
)
