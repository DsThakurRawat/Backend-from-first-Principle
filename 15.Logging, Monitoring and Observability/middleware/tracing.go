// middleware/tracing.go — Creates a trace span per request
package middleware

import (
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.uber.org/zap"
    "myapp/logger"
)

func EnhancedTracing() gin.HandlerFunc {
    tracer := otel.Tracer("todo-api")

    return func(c *gin.Context) {
        // Extract incoming trace context (from load balancer / front-end)
        ctx := otel.GetTextMapPropagator().Extract(
            c.Request.Context(),
            propagation.HeaderCarrier(c.Request.Header),
        )

        // Start root span for this request
        ctx, span := tracer.Start(ctx, c.FullPath())
        defer span.End()

        // Attach metadata to span (visible in trace UI)
        span.SetAttributes(
            attribute.String("http.method", c.Request.Method),
            attribute.String("http.path", c.FullPath()),
            attribute.String("http.user_agent", c.Request.UserAgent()),
            attribute.String("user.id", getUserID(c)),
        )

        // Inject context so downstream handlers can create child spans
        c.Request = c.Request.WithContext(ctx)
        c.Next()

        // After handler returns: record status code on span
        statusCode := c.Writer.Status()
        span.SetAttributes(attribute.Int("http.status_code", statusCode))
        if statusCode >= 500 {
            span.SetStatus(codes.Error, "server error")
        }

        // Structured log entry linking to this trace
        logger.Log.Info("request completed",
            zap.String("method", c.Request.Method),
            zap.String("path", c.FullPath()),
            zap.Int("status", statusCode),
            zap.String("trace_id", span.SpanContext().TraceID().String()),
        )
    }
}
