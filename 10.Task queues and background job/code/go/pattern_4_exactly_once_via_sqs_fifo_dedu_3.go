// Go — SQS FIFO with content-based deduplication
client.SendMessage(ctx, &sqs.SendMessageInput{
    QueueUrl:               aws.String("https://sqs.us-east-1.amazonaws.com/123/orders.fifo"),
    MessageBody:            aws.String(payload),
    MessageGroupId:         aws.String("order-processing"), // ordering group
    MessageDeduplicationId: aws.String(orderID),           // unique per business event
})
// Sending the same orderID twice within 5 min → second is silently dropped by SQS
