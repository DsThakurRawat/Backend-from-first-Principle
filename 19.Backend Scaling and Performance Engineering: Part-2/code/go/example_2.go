// A production health check verifies downstream dependencies, not just "I'm alive."
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    checks := map[string]string{}

    if err := db.PingContext(r.Context()); err != nil {
        checks["database"] = "unreachable"
    } else {
        checks["database"] = "ok"
    }

    if err := rdb.Ping(r.Context()).Err(); err != nil {
        checks["redis"] = "unreachable"
    } else {
        checks["redis"] = "ok"
    }

    for _, v := range checks {
        if v != "ok" {
            w.WriteHeader(http.StatusServiceUnavailable)
            json.NewEncoder(w).Encode(checks)
            return
        }
    }
    json.NewEncoder(w).Encode(checks)
})
