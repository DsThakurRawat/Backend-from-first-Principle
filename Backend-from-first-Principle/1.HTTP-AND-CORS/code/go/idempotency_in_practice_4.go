var seen sync.Map // key -> []byte result. Use Redis with a TTL in production.

func createPayment(w http.ResponseWriter, r *http.Request) {
    key := r.Header.Get("Idempotency-Key")
    if key == "" {
        http.Error(w, "missing Idempotency-Key", http.StatusBadRequest)
        return
    }
    if cached, ok := seen.Load(key); ok {     // replay: return the stored result
        w.WriteHeader(http.StatusOK)
        w.Write(cached.([]byte))
        return
    }
    result := charge(r)                       // the real, non-idempotent work
    seen.Store(key, result)                   // remember it BEFORE responding
    w.WriteHeader(http.StatusCreated)
    w.Write(result)
}
