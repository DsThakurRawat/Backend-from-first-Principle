"""Distributed ID generation using Redis atomic counter"""

import redis
from typing import List


class IDGenerator:
    """
    Generates globally unique IDs using Redis atomic counter.
    
    Primary: Redis INCR command for distributed atomicity.
    Redis failures are surfaced so callers never issue duplicate IDs.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        """Initialize ID generator with Redis connection."""
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.counter_key = "url_shortener:next_id"
    
    def next_id(self) -> int:
        """
        Generate next unique ID.
        
        Returns: Next ID in sequence
        Raises: redis.RedisError when the counter cannot be reached.
        """
        try:
            return int(self.redis.incr(self.counter_key))
        except redis.RedisError:
            raise
    
    def next_id_batch(self, count: int) -> List[int]:
        """
        Generate a batch of unique IDs more efficiently.
        
        Atomic operation: INCRBY is executed as single command
        Returns: List of sequential IDs
        """
        try:
            # INCRBY is atomic
            end_id = int(self.redis.incrby(self.counter_key, count))
            # Generate sequence [end_id - count + 1, ..., end_id]
            return list(range(end_id - count + 1, end_id + 1))
        except redis.RedisError:
            raise
    
    def reset(self, value: int = 0) -> None:
        """
        Reset counter to specific value (admin use only).
        
        Use cases:
        - Disaster recovery
        - Migrating from old system
        - Testing
        """
        self.redis.set(self.counter_key, value)
    
    def current_id(self) -> int:
        """Get current counter value."""
        val = self.redis.get(self.counter_key)
        return int(val) if val else 0


class DistributedIDService:
    """
    High-performance ID generation service with Redis clustering support.
    """
    
    def __init__(self, redis_url: str, min_ids_per_batch: int = 100):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.generator = IDGenerator(redis_url)
        self.min_ids_per_batch = min_ids_per_batch
        
        # Local cache of pre-allocated IDs
        self.local_pool: List[int] = []
    
    def get_id(self) -> int:
        """
        Get next ID with local pooling for reduced Redis calls.
        """
        if not self.local_pool:
            # Allocate batch when local pool empty
            self.local_pool = self.generator.next_id_batch(self.min_ids_per_batch)
        
        return self.local_pool.pop(0)
    
    def pool_size(self) -> int:
        """Return current local pool size."""
        return len(self.local_pool)


if __name__ == "__main__":
    import time
    
    # Test basic ID generation
    print("Testing Distributed ID Generation:")
    print("-" * 50)
    
    try:
        gen = IDGenerator("redis://localhost:6379")
        
        # Single ID generation
        print("\nSingle ID Generation:")
        for i in range(5):
            id_val = gen.next_id()
            print(f"  ID {i+1}: {id_val}")
        
        # Batch ID generation
        print("\nBatch ID Generation (10 IDs):")
        batch = gen.next_id_batch(10)
        print(f"  IDs: {batch}")
        
        # Current counter
        current = gen.current_id()
        print(f"\nCurrent counter value: {current}")
        
        # Performance test
        print("\nPerformance Test (10000 IDs):")
        start = time.time()
        ids = gen.next_id_batch(10000)
        elapsed = time.time() - start
        print(f"  Generated {len(ids)} IDs in {elapsed:.4f}s")
        print(f"  Rate: {len(ids)/elapsed:.0f} IDs/sec")
        
    except redis.RedisError as error:
        print(f"Redis connection failed: {error}")
