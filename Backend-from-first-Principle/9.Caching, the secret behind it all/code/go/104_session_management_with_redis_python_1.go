package main

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

type Product struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Price float64 `json:"price"`
}

var rdb = redis.NewClient(&redis.Options{
    Addr: "localhost:6379",
})

// GetProduct implements Cache-Aside (Lazy) caching.
// 1. Check Redis first
// 2. On miss, fetch from DB, store in cache, return
func GetProduct(ctx context.Context, productID string) (*Product, error) {
    cacheKey := "product:" + productID

    // Step 1: Try cache first (Cache Hit path)
    cached, err := rdb.Get(ctx, cacheKey).Result()
    if err == nil {
        var product Product
        json.Unmarshal([]byte(cached), &product)
        fmt.Println("[CACHE HIT]", productID)
        return &product, nil
    }

    // Step 2: Cache Miss — fetch from database (expensive operation)
    fmt.Println("[CACHE MISS] fetching from DB...", productID)
    product, err := fetchFromDatabase(productID) // simulate DB call
    if err != nil {
        return nil, err
    }

    // Step 3: Store in cache with a 1-hour TTL
    data, _ := json.Marshal(product)
    rdb.Set(ctx, cacheKey, data, 1*time.Hour)

    return product, nil
}

// Write-Through: update DB and cache simultaneously
func UpdateProduct(ctx context.Context, product *Product) error {
    // Step 1: Update in database
    if err := updateInDatabase(product); err != nil {
        return err
    }

    // Step 2: Write-through — update cache immediately
    cacheKey := "product:" + product.ID
    data, _ := json.Marshal(product)
    rdb.Set(ctx, cacheKey, data, 1*time.Hour)

    fmt.Println("[WRITE-THROUGH] DB + cache updated for", product.ID)
    return nil
}
