import (
    "context"
    "github.com/redis/go-redis/v9"
    "time"
)

var rdb = redis.NewClient(&redis.Options{Addr: "redis:6379"})

// StoreSession saves session data in Redis so ANY server can read it.
func StoreSession(ctx context.Context, sessionID string, userID string) error {
    return rdb.Set(ctx, "session:"+sessionID, userID, 24*time.Hour).Err()
}

// GetSession retrieves session data — works regardless of which server
// the request lands on, because Redis is shared across all instances.
func GetSession(ctx context.Context, sessionID string) (string, error) {
    return rdb.Get(ctx, "session:"+sessionID).Result()
}
