// A minimal but real observability setup: Prometheus metrics + structured logging
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "log/slog"
)

var requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "Duration of HTTP requests",
        Buckets: prometheus.DefBuckets,
    },
    []string{"method", "path", "status"},
)

func init() {
    prometheus.MustRegister(requestDuration)
}

// Expose /metrics for Prometheus to scrape
// Visualize in Grafana: p50, p90, p99 latency per endpoint
http.Handle("/metrics", promhttp.Handler())
