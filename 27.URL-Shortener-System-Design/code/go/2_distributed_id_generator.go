package shortener

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

// IDGenerator generates globally unique IDs using Redis atomic counter
type IDGenerator struct {
	redis    *redis.Client
	localSeq int64  // Fallback counter if Redis unavailable
	mu       sync.Mutex
}

// NewIDGenerator creates a new ID generator
func NewIDGenerator(redisAddr string) *IDGenerator {
	return &IDGenerator{
		redis: redis.NewClient(&redis.Options{
			Addr: redisAddr,
		}),
	}
}

// NextID generates the next unique ID
// Primary: uses Redis INCR for distributed atomicity
// Fallback: uses local atomic counter if Redis unavailable
func (g *IDGenerator) NextID(ctx context.Context) (int64, error) {
	const counterKey = "url_shortener:next_id"

	// Try Redis first (primary path)
	val, err := g.redis.Incr(ctx, counterKey).Result()
	if err == nil {
		return val, nil
	}

	// Fallback to local counter if Redis unavailable
	// In production, this should trigger alerts
	localID := atomic.AddInt64(&g.localSeq, 1)

	return localID, fmt.Errorf("redis incr failed, using local counter: %w", err)
}

// NextIDBatch generates a batch of unique IDs
// More efficient than calling NextID multiple times
func (g *IDGenerator) NextIDBatch(ctx context.Context, count int) ([]int64, error) {
	const counterKey = "url_shortener:next_id"

	// Redis INCRBY is atomic
	val, err := g.redis.IncrBy(ctx, counterKey, int64(count)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get ID batch: %w", err)
	}

	// Generate sequence [val-count+1, ..., val]
	ids := make([]int64, count)
	for i := 0; i < count; i++ {
		ids[i] = val - int64(count) + 1 + int64(i)
	}

	return ids, nil
}

// Reset resets the counter to a specific value (admin use only)
func (g *IDGenerator) Reset(ctx context.Context, value int64) error {
	const counterKey = "url_shortener:next_id"
	return g.redis.Set(ctx, counterKey, value, 0).Err()
}

// ExampleDistributedIDGen demonstrates ID generation
func ExampleDistributedIDGen() {
	gen := NewIDGenerator("localhost:6379")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Generate single ID
	id1, _ := gen.NextID(ctx)
	id2, _ := gen.NextID(ctx)
	id3, _ := gen.NextID(ctx)

	fmt.Printf("ID 1: %d -> Code: %s\n", id1, Encode(id1))
	fmt.Printf("ID 2: %d -> Code: %s\n", id2, Encode(id2))
	fmt.Printf("ID 3: %d -> Code: %s\n", id3, Encode(id3))

	// Generate batch
	ids, _ := gen.NextIDBatch(ctx, 5)
	fmt.Printf("Batch IDs: %v\n", ids)
	for _, id := range ids {
		fmt.Printf("  -> %s\n", Encode(id))
	}
}
