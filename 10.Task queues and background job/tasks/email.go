// tasks/email.go — Task definitions (producer + payload)
package tasks

import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/hibiken/asynq"
)

const TypeSendVerificationEmail = "email:send_verification"

// Payload struct — serialized to JSON in queue
type EmailPayload struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Token  string `json:"token"`
}

// NewSendVerificationEmailTask creates the Asynq task
func NewSendVerificationEmailTask(userID, email, token string) (*asynq.Task, error) {
    payload, err := json.Marshal(EmailPayload{UserID: userID, Email: email, Token: token})
    if err != nil {
        return nil, fmt.Errorf("json.Marshal: %w", err)
    }
    // asynq.MaxRetry — after 5 failures, moves to dead letter
    return asynq.NewTask(TypeSendVerificationEmail, payload, asynq.MaxRetry(5)), nil
}
