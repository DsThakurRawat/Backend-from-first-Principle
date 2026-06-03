// workflows/payment_approval.go — Wait for human signal
func PaymentApprovalWorkflow(ctx workflow.Context, orderID string) error {
    // Register a signal channel — external events can wake this workflow
    approvalCh := workflow.GetSignalChannel(ctx, "approval-signal")

    // Step 1: Process payment details
    workflow.ExecuteActivity(ctx, activities.PreparePayment, orderID).Get(ctx, nil)

    // Step 2: Wait up to 24 hours for human approval
    // Temporal pauses here — no CPU/memory consumed while waiting
    var approved bool
    selector := workflow.NewSelector(ctx)
    selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
        ch.Receive(ctx, &approved)
    })
    selector.AddFuture(workflow.NewTimer(ctx, 24*time.Hour), func(f workflow.Future) {
        approved = false // timeout — auto-reject
    })
    selector.Select(ctx)

    if !approved {
        // Saga: compensate previous steps
        workflow.ExecuteActivity(ctx, activities.RefundPayment, orderID).Get(ctx, nil)
        return nil
    }
    return workflow.ExecuteActivity(ctx, activities.FinalizePayment, orderID).Get(ctx, nil)
}

// To send approval signal from your API handler:
func ApprovePaymentHandler(c *gin.Context) {
    orderID := c.Param("id")
    temporalClient.SignalWorkflow(c, orderID, "", "approval-signal", true)
    c.JSON(200, gin.H{"status": "approved"})
}
