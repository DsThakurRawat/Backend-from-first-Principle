// Go — SQS producer + consumer using AWS SDK v2
package main

import (
    "context"
    "encoding/json"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/sqs"
)

// ── PRODUCER ──────────────────────────────────────────
func EnqueueEmailTask(ctx context.Context, client *sqs.Client, queueURL string, payload EmailPayload) error {
    body, _ := json.Marshal(payload)
    _, err := client.SendMessage(ctx, &sqs.SendMessageInput{
        QueueUrl:    aws.String(queueURL),
        MessageBody: aws.String(string(body)),
        // For FIFO queue: add MessageGroupId + MessageDeduplicationId
        // MessageGroupId:         aws.String("email-group"),
        // MessageDeduplicationId: aws.String(payload.UserID),
    })
    return err
}

// ── CONSUMER ──────────────────────────────────────────
func PollQueue(ctx context.Context, client *sqs.Client, queueURL string) {
    for {
        result, _ := client.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
            QueueUrl:            aws.String(queueURL),
            MaxNumberOfMessages: 10,          // batch up to 10
            WaitTimeSeconds:     20,          // long-polling reduces empty receives
            VisibilityTimeout:   60,          // 60s to process before redelivery
        })

        for _, msg := range result.Messages {
            if err := processMessage(ctx, msg); err == nil {
                // ACK: delete from queue on success
                client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
                    QueueUrl:      aws.String(queueURL),
                    ReceiptHandle: msg.ReceiptHandle, // unique handle per receive
                })
            }
            // On error: do nothing — visibility timeout expires, SQS redelivers
        }
    }
}
