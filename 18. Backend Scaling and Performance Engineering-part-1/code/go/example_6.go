import (
    "context"
    "encoding/json"
    "time"
    "github.com/redis/go-redis/v9"
)

var rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

func GetProduct(ctx context.Context, id string) (*Product, error) {
    cacheKey := "product:" + id

    // 1. Try cache first
    cached, err := rdb.Get(ctx, cacheKey).Result()
    if err == nil {
        var p Product
        json.Unmarshal([]byte(cached), &p)
        return &p, nil  // Cache HIT — ~2ms
    }

    // 2. Cache miss — query database
    p, err := queryProductFromDB(ctx, id)
    if err != nil {
        return nil, err
    }

    // 3. Store in cache with TTL
    data, _ := json.Marshal(p)
    rdb.Set(ctx, cacheKey, data, 10*time.Minute)

    return p, nil
}
