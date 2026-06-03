type HealthStatus struct {
    Status   string            `json:"status"`
    Checks   map[string]string `json:"checks"`
}

func healthHandler(db *pgxpool.Pool, rdb *redis.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        checks := map[string]string{}
        overall := "ok"

        // DB check
        ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
        defer cancel()
        if err := db.Ping(ctx); err != nil {
            checks["database"] = "unhealthy: " + err.Error()
            overall = "degraded"
        } else {
            checks["database"] = "ok"
        }

        // Redis check
        if err := rdb.Ping(r.Context()).Err(); err != nil {
            checks["cache"] = "unhealthy: " + err.Error()
            overall = "degraded"
        } else {
            checks["cache"] = "ok"
        }

        status := http.StatusOK
        if overall != "ok" { status = http.StatusServiceUnavailable }

        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(status)
        json.NewEncoder(w).Encode(HealthStatus{Status: overall, Checks: checks})
    }
}
