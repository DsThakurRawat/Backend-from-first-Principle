@app.post("/v1/payments", status_code=201)
def create_payment(body: dict, idempotency_key: str = Header(...)):
    # already processed this exact request? return the SAME result, don't re-charge
    prior = idem_store.get(idempotency_key)
    if prior is not None:
        return JSONResponse(status_code=prior["status"], content=prior["body"])

    payment = charge(body["amount"])               # the real, non-idempotent side effect
    idem_store.save(idempotency_key, 201, payment) # remember it, keyed by the idempotency key
    return payment
