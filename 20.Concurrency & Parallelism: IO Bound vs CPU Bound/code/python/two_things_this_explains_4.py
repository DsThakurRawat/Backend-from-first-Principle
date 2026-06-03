# Conceptual state machine representation
def fetch_user_data_machine(user_id):
    state = 0
    user = None
    orders = None

    def step():
        nonlocal state, user, orders

        if state == 0:
            state = 1
            # Start the IO, register callback for when it completes
            return db.get_user(user_id).then(
                lambda result: (user := result, step())
            )

        elif state == 1:
            state = 2
            return db.get_orders(user_id).then(
                lambda result: (orders := result, step())
            )

        elif state == 2:
            return {"user": user, "orders": orders}

    return step
