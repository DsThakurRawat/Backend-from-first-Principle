// main.go — New Relic agent setup in Go
import (
    "github.com/newrelic/go-agent/v3/newrelic"
    "github.com/newrelic/go-agent/v3/integrations/nrgin"
)

func main() {
    // Initialize New Relic application agent
    nrApp, _ := newrelic.NewApplication(
        newrelic.ConfigAppName("todo-api"),
        newrelic.ConfigLicense(os.Getenv("NEW_RELIC_LICENSE_KEY")),
        newrelic.ConfigAppLogForwardingEnabled(true),  // forward logs to NR
        newrelic.ConfigDistributedTracerEnabled(true), // enable distributed tracing
    )

    r := gin.New()
    // nrgin middleware — auto-instruments every route with NR transactions
    r.Use(nrgin.Middleware(nrApp))

    r.Run(":8080")
}
