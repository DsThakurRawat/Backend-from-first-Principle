// Go — Idempotent multi-step task with full transaction rollback
func (h *AccountHandler) HandleDeleteAccount(ctx context.Context, t *asynq.Task) error {
    var p DeleteAccountPayload
    json.Unmarshal(t.Payload(), &p)

    // Check if already deleted (idempotency guard)
    exists, _ := h.db.UserExists(ctx, p.UserID)
    if !exists {
        return nil // already deleted on a previous attempt — ACK cleanly
    }

    // Wrap all DB writes in a single transaction
    return h.db.WithTransaction(ctx, func(tx DB) error {
        steps := []func() error{
            func() error { return tx.DeleteUserProjects(ctx, p.UserID) },
            func() error { return tx.DeleteUserSessions(ctx, p.UserID) },
            func() error { return tx.DeleteUserAssets(ctx, p.UserID) },
            func() error { return tx.DeleteUserAccount(ctx, p.UserID) },
        }
        for _, step := range steps {
            if err := step(); err != nil {
                return err // triggers full rollback; task retried from scratch
            }
        }
        return nil // all steps succeeded → commit → ACK
    })
}
