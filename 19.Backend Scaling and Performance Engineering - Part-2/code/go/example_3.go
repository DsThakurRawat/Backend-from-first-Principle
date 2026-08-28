import (
    "context"
    "encoding/json"
    "github.com/redis/go-redis/v9"
)

type EmailJob struct {
    To       string `json:"to"`
    Subject  string `json:"subject"`
    Template string `json:"template"`
}

// Producer: push job to queue (called from your API handler)
func EnqueueEmail(ctx context.Context, job EmailJob) error {
    data, _ := json.Marshal(job)
    return rdb.LPush(ctx, "queue:emails", data).Err()
}

// Consumer: runs as a separate process (or goroutine)
func EmailWorker(ctx context.Context) {
    for {
        result, err := rdb.BRPop(ctx, 0, "queue:emails").Result()
        if err != nil { continue }

        var job EmailJob
        json.Unmarshal([]byte(result[1]), &job)
        sendEmail(job)  // takes 300ms — but no user is waiting
    }
}
