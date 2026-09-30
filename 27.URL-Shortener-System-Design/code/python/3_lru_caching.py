"""LRU Cache implementation for hot URL caching"""

from collections import OrderedDict
from threading import RLock
from typing import Optional, Tuple
from datetime import datetime


class LRUCache:
    """
    Thread-safe Least Recently Used (LRU) cache.
    
    Used for caching frequently accessed short code -> long URL mappings.
    Evicts least-recently-used items when capacity reached.
    """
    
    def __init__(self, max_size: int = 10000):
        """
        Initialize LRU cache.
        
        Args:
            max_size: Maximum number of items to cache
        """
        self.max_size = max_size
        self.cache: OrderedDict = OrderedDict()
        self.lock = RLock()
    
    def get(self, key: str) -> Optional[str]:
        """
        Retrieve value from cache, marking as recently used.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value, or None if not found
        """
        with self.lock:
            if key not in self.cache:
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            return self.cache[key]
    
    def set(self, key: str, value: str) -> None:
        """
        Store value in cache, evicting LRU if necessary.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        with self.lock:
            if key in self.cache:
                # Update existing key, move to end
                self.cache[key] = value
                self.cache.move_to_end(key)
            else:
                # Add new key
                self.cache[key] = value
                
                # Evict LRU if over capacity
                if len(self.cache) > self.max_size:
                    # Remove first (least recently used)
                    self.cache.popitem(last=False)
    
    def delete(self, key: str) -> bool:
        """
        Remove key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted, False if not found
        """
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Clear all items from cache."""
        with self.lock:
            self.cache.clear()
    
    def size(self) -> int:
        """Get current number of items in cache."""
        with self.lock:
            return len(self.cache)
    
    def stats(self) -> dict:
        """Get cache statistics."""
        with self.lock:
            return {
                "size": len(self.cache),
                "max_size": self.max_size,
                "capacity": len(self.cache) / self.max_size * 100,
            }


class HotKeyCache:
    """
    Distributed cache for handling viral/hot URLs.
    
    Replicates hot keys across multiple in-memory caches
    to handle high traffic on single URLs (10K+ req/sec).
    """
    
    def __init__(self, replica_count: int = 3, cache_size: int = 10000):
        """
        Initialize hot key cache with replicas.
        
        Args:
            replica_count: Number of replica caches
            cache_size: Size of each cache
        """
        self.primary = LRUCache(cache_size)
        self.replicas = [LRUCache(cache_size) for _ in range(replica_count)]
    
    def get(self, key: str) -> Optional[str]:
        """
        Retrieve from cache, checking primary first then replicas.
        """
        # Try primary first (fastest)
        value = self.primary.get(key)
        if value:
            return value
        
        # Fallback to replicas
        for replica in self.replicas:
            value = replica.get(key)
            if value:
                # Update primary for next request
                self.primary.set(key, value)
                return value
        
        return None
    
    def set(self, key: str, value: str) -> None:
        """
        Store value in all replicas (for hot key replication).
        """
        self.primary.set(key, value)
        for replica in self.replicas:
            replica.set(key, value)
    
    def delete(self, key: str) -> None:
        """Delete key from all caches."""
        self.primary.delete(key)
        for replica in self.replicas:
            replica.delete(key)
    
    def stats(self) -> dict:
        """Get stats from all caches."""
        return {
            "primary": self.primary.stats(),
            "replicas": [r.stats() for r in self.replicas],
        }


if __name__ == "__main__":
    # Test LRU cache
    print("Testing LRU Cache:")
    print("-" * 50)
    
    cache = LRUCache(max_size=3)
    
    # Add items
    cache.set("code1", "https://example.com/page1")
    cache.set("code2", "https://example.com/page2")
    cache.set("code3", "https://example.com/page3")
    
    print(f"After adding 3 items: {cache.stats()}")
    
    # Access code1 (becomes most recently used)
    val = cache.get("code1")
    print(f"Retrieved code1: {val}")
    
    # Add new item (should evict code2, the LRU)
    cache.set("code4", "https://example.com/page4")
    print(f"After adding code4: {cache.stats()}")
    
    # Check if code2 was evicted
    val = cache.get("code2")
    print(f"code2 after eviction: {val} (should be None)")
    
    # Test hot key cache
    print("\nTesting Hot Key Cache:")
    print("-" * 50)
    
    hot_cache = HotKeyCache(replica_count=2, cache_size=100)
    
    # Set viral URL in all replicas
    hot_cache.set("viral", "https://viral-content.com")
    print(f"Stats after setting viral URL:")
    print(f"  {hot_cache.stats()}")
    
    # Retrieve from cache
    val = hot_cache.get("viral")
    print(f"Retrieved viral URL: {val}")
