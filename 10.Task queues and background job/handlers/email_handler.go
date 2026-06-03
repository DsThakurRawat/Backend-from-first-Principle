// handlers/email_handler.go — Consumer handler
package handlers

import (
    "context"
    "encoding/json"
    "fmt"
    "log/slog"
    tasks "myapp/tasks"
    "github.com/hibiken/asynq"
)

type EmailHandler struct {
    emailSvc EmailService // injected dependency
}

// HandleSendVerificationEmail — registered with the Asynq server
func (h *EmailHandler) HandleSendVerificationEmail(
    ctx context.Context,
    t *asynq.Task,
) error {
    // 1. Deserialize JSON → Go struct
    var p tasks.EmailPayload
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        // Non-retryable error: mark as failed immediately
        return fmt.Errorf("json.Unmarshal: %w: %w", err, asynq.SkipRetry)
    }

    // 2. Execute: call email provider API
    slog.Info("sending verification email", "user_id", p.UserID, "email", p.Email)
    if err := h.emailSvc.SendVerification(ctx, p.Email, p.Token); err != nil {
        // Returning error triggers retry with exponential backoff
        return fmt.Errorf("emailSvc.SendVerification: %w", err)
    }

    // 3. Returning nil → ACK to queue (task done)
    return nil
}
