func CreatePayment(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("Idempotency-Key") // client-generated UUID

	// already processed this exact request? return the SAME result, don't re-charge
	if prior, ok := idemStore.Get(key); ok {
		writeJSON(w, prior.Status, prior.Body)
		return
	}

	var in struct{ Amount int `json:"amount"` }
	json.NewDecoder(r.Body).Decode(&in)

	payment := charge(in.Amount)          // the real, non-idempotent side effect
	idemStore.Save(key, 201, payment)     // remember it, keyed by the idempotency key
	writeJSON(w, 201, payment)
}
