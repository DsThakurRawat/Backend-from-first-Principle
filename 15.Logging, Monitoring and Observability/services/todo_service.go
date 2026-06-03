// services/todo_service.go — The full LMO pattern per function
package services

import (
    "context"
    "fmt"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.uber.org/zap"
    "myapp/logger"
    "myapp/models"
)

var tracer = otel.Tracer("todo-service")

func CreateTodo(ctx context.Context, req models.CreateTodoRequest, userID string) (*models.Todo, error) {
    // 1. Start a child span (parent span is in ctx from the middleware)
    ctx, span := tracer.Start(ctx, "TodoService.CreateTodo")
    defer span.End()

    // 2. Add business context to the span — visible in trace UI
    span.SetAttributes(
        attribute.String("user.id", userID),
        attribute.String("todo.title", req.Title),
        attribute.String("todo.priority", req.Priority),
    )

    // 3. INFO log — record business event start
    logger.Log.Info("creating todo",
        zap.String("user_id", userID),
        zap.String("title", req.Title),
        zap.String("trace_id", span.SpanContext().TraceID().String()),
    )

    // 4. Execute DB operation (inside its own child span — auto via otelgorm)
    todo, err := repo.CreateTodo(ctx, req, userID)
    if err != nil {
        // ERROR log with full context
        logger.Log.Error("failed to create todo",
            zap.String("user_id", userID),
            zap.String("error", err.Error()),
            zap.String("trace_id", span.SpanContext().TraceID().String()),
        )
        // Record error on span — shows as failed in Jaeger/Grafana Tempo
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return nil, fmt.Errorf("repo.CreateTodo: %w", err)
    }

    // 5. DEBUG log — only visible in dev, suppressed in production
    logger.Log.Debug("todo created",
        zap.String("todo_id", todo.ID),
    )

    // 6. INFO — business event completion log (for audit trail)
    logger.Log.Info("todo created successfully",
        zap.String("todo_id", todo.ID),
        zap.String("user_id", userID),
        zap.String("title", todo.Title),
        zap.String("priority", todo.Priority),
        zap.String("category_id", todo.CategoryID),
    )

    return todo, nil
}
