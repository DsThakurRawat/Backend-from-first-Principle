package shortener

import (
	"container/list"
	"fmt"
	"sync"
)

// LRUCache is an in-memory LRU cache for hot URLs
// Used to cache frequently accessed short code -> long URL mappings
type LRUCache struct {
	mu    sync.Mutex
	items map[string]*list.Element
	order *list.List // Most recently used at the front, least recently used at the back.
	max   int
}

type cacheItem struct {
	key   string
	value string
}

// NewLRUCache creates a new LRU cache with specified max size
func NewLRUCache(maxSize int) *LRUCache {
	return &LRUCache{
		items: make(map[string]*list.Element),
		order: list.New(),
		max:   maxSize,
	}
}

// Get retrieves a value from cache
func (c *LRUCache) Get(key string) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	element, found := c.items[key]
	if !found {
		return "", false
	}

	c.order.MoveToFront(element)

	return element.Value.(*cacheItem).value, true
}

// Set stores a value in cache
// If cache is full, evicts the least-recently-used item
func (c *LRUCache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// If key already exists, just update
	if element, found := c.items[key]; found {
		element.Value.(*cacheItem).value = value
		c.order.MoveToFront(element)
		return
	}

	// Add the new item as most recently used.
	element := c.order.PushFront(&cacheItem{
		key:   key,
		value: value,
	})
	c.items[key] = element

	// Evict the least recently used item if over capacity.
	if len(c.items) > c.max {
		c.evictLRU()
	}
}

// evictLRU removes the least-recently-used item
func (c *LRUCache) evictLRU() {
	element := c.order.Back()
	if element == nil {
		return
	}

	item := element.Value.(*cacheItem)
	delete(c.items, item.key)
	c.order.Remove(element)
}

// Delete removes a key from cache
func (c *LRUCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if element, found := c.items[key]; found {
		delete(c.items, key)
		c.order.Remove(element)
	}
}

// Clear removes all items from cache
func (c *LRUCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*list.Element)
	c.order.Init()
}

// Size returns current number of items in cache
func (c *LRUCache) Size() int {
	c.mu.Lock()
	defer c.mu.Unlock()

	return len(c.items)
}

// ExampleLRUCache demonstrates LRU cache usage
func ExampleLRUCache() {
	cache := NewLRUCache(3) // Max 3 items

	// Add items
	cache.Set("code1", "https://example.com/page1")
	cache.Set("code2", "https://example.com/page2")
	cache.Set("code3", "https://example.com/page3")

	fmt.Printf("Cache size: %d\n", cache.Size()) // 3

	// Access code1 (becomes most recently used)
	url1, _ := cache.Get("code1")
	fmt.Printf("Retrieved: %s\n", url1)

	// Add new item, should evict code2 (least recently used)
	cache.Set("code4", "https://example.com/page4")

	fmt.Printf("Cache size after eviction: %d\n", cache.Size()) // 3

	// code2 should be gone
	_, found := cache.Get("code2")
	fmt.Printf("code2 found: %v\n", found) // false
}

// HotKeyReplication demonstrates handling viral links
// In real system: replicate to multiple cache servers, route via consistent hashing
type HotKeyCache struct {
	primary   *LRUCache
	replicas  []*LRUCache
}

func NewHotKeyCache(replicaCount int) *HotKeyCache {
	caches := make([]*LRUCache, replicaCount+1)
	for i := range caches {
		caches[i] = NewLRUCache(10000)
	}
	return &HotKeyCache{
		primary:  caches[0],
		replicas: caches[1:],
	}
}

// GetWithReplication reads from all replicas, writes to primary
func (h *HotKeyCache) GetWithReplication(key string) (string, bool) {
	// Read from primary (fastest)
	if val, found := h.primary.Get(key); found {
		return val, true
	}

	// Fallback to replicas in parallel
	type result struct {
		value string
		found bool
	}
	results := make(chan result, len(h.replicas))
	var wg sync.WaitGroup

	for _, replica := range h.replicas {
		wg.Add(1)
		go func(r *LRUCache) {
			defer wg.Done()
			if val, found := r.Get(key); found {
				results <- result{val, true}
			}
		}(replica)
	}

	wg.Wait()
	close(results)

	for res := range results {
		if res.found {
			return res.value, true
		}
	}

	return "", false
}

// SetWithReplication writes to all replicas (for hot keys)
func (h *HotKeyCache) SetWithReplication(key, value string) {
	h.primary.Set(key, value)

	for _, replica := range h.replicas {
		replica.Set(key, value)
	}
}
