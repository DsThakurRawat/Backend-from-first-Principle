// rate/sliding_window.go — Redis sorted-set sliding window
package rate

import (
    "context"
    "fmt"
    "time"
    "github.com/redis/go-redis/v9"
)

type SlidingWindowLimiter struct {
    client  *redis.Client
    key     string
    limit   int           // max requests
    window  time.Duration // time window
}

func (l *SlidingWindowLimiter) Allow(ctx context.Context) (bool, error) {
    now := time.Now()
    windowStart := now.Add(-l.window).UnixMicro()
    nowMicro := now.UnixMicro()

    pipe := l.client.Pipeline()
    // Remove entries older than the window
    pipe.ZRemRangeByScore(ctx, l.key, "0", fmt.Sprintf("%d", windowStart))
    // Count entries in current window
    countCmd := pipe.ZCard(ctx, l.key)
    // Add current request timestamp as a member
    pipe.ZAdd(ctx, l.key, redis.Z{Score: float64(nowMicro), Member: nowMicro})
    pipe.Expire(ctx, l.key, l.window*2)
    pipe.Exec(ctx)

    count := countCmd.Val()
    return count < int64(l.limit), nil
}

// Usage in Asynq handler
func (h *EmailHandler) HandleSendEmail(ctx context.Context, t *asynq.Task) error {
    allowed, _ := h.limiter.Allow(ctx)
    if !allowed {
        // Return a retryable error — asynq will retry with backoff
        return fmt.Errorf("rate limit exceeded: %w", asynq.ErrRetry)
    }
    return h.doSendEmail(ctx, t)
}
