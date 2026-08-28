async def fetch_user_data(user_id):
    user   = await db.get_user(user_id)      # State 0 → 1
    orders = await db.get_orders(user_id)    # State 1 → 2
    return {"user": user, "orders": orders}  # State 2 → done
