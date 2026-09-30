"""Complete URL Shortener service implementation"""

from flask import Flask, request, redirect, jsonify
from datetime import datetime, timedelta
from typing import Optional, Tuple
import redis
import json
import logging

from base62_encoding import encode, decode
from distributed_id_generator import IDGenerator
from lru_caching import LRUCache

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class URLShortenerService:
    """
    Production-ready URL shortener service.
    
    Handles:
    - URL shortening (auto-generated and custom codes)
    - Fast redirects with multi-level caching
    - Analytics tracking (async)
    - TTL/expiration management
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379", base_url: str = "https://tiny.url"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.id_gen = IDGenerator(redis_url)
        self.cache = LRUCache(max_size=10000)
        self.base_url = base_url
        
        # Mock database (in production: PostgreSQL, Cassandra, etc)
        self.db: dict = {}
        self.metadata: dict = {}
    
    def shorten_url(
        self,
        long_url: str,
        custom_code: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        user_id: Optional[str] = None
    ) -> Tuple[str, int]:
        """
        Shorten a URL.
        
        Args:
            long_url: Original long URL
            custom_code: Optional custom short code
            expires_at: Optional expiration timestamp
            user_id: Optional user identifier for analytics
        
        Returns:
            (short_code, status_code)
        """
        try:
            if custom_code:
                # Try to reserve custom code
                if not self._reserve_custom_code(custom_code, long_url, expires_at):
                    return None, 409  # Conflict
                short_code = custom_code
            else:
                # Generate new short code
                next_id = self.id_gen.next_id()
                short_code = encode(next_id)
                
                # Store in database
                self.db[short_code] = long_url
                self.metadata[short_code] = {
                    "created_at": datetime.now().isoformat(),
                    "expires_at": expires_at.isoformat() if expires_at else None,
                    "user_id": user_id,
                    "click_count": 0,
                }
                
                # Cache it
                self.cache.set(short_code, long_url)
            
            return short_code, 201
        
        except Exception as e:
            logger.error(f"Failed to shorten URL: {e}")
            return None, 500
    
    def lookup_code(self, code: str) -> Optional[str]:
        """
        Lookup short code and return long URL.
        
        Multi-level lookup:
        1. Check in-memory LRU cache
        2. Query database
        3. Check expiration
        
        Returns:
            Long URL, or None if expired/not found
        """
        # Check cache first (< 1 microsecond)
        if code in self.cache.get.__self__.cache:
            return self.cache.get(code)
        
        # Query database
        if code not in self.db:
            return None
        
        long_url = self.db[code]
        meta = self.metadata.get(code, {})
        
        # Check expiration
        if meta.get("expires_at"):
            expires_at = datetime.fromisoformat(meta["expires_at"])
            if expires_at < datetime.now():
                # Delete and return None
                self._delete_code(code)
                return None
        
        # Cache for future requests
        self.cache.set(code, long_url)
        
        return long_url
    
    def _reserve_custom_code(
        self,
        code: str,
        long_url: str,
        expires_at: Optional[datetime]
    ) -> bool:
        """
        Attempt to reserve custom code with distributed lock.
        
        Returns:
            True if successful, False if code already taken
        """
        lock_key = f"custom_code_lock:{code}"
        
        try:
            # Acquire distributed lock (5 second TTL)
            lock_acquired = self.redis.set(lock_key, "reserved", nx=True, ex=5)
            if not lock_acquired:
                return False
            
            # Double-check: code not already in use
            if code in self.db:
                self.redis.delete(lock_key)
                return False
            
            # Store in database
            self.db[code] = long_url
            self.metadata[code] = {
                "created_at": datetime.now().isoformat(),
                "expires_at": expires_at.isoformat() if expires_at else None,
                "click_count": 0,
            }
            
            # Cache it
            self.cache.set(code, long_url)
            
            # Release lock
            self.redis.delete(lock_key)
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to reserve custom code: {e}")
            return False
    
    def track_click(self, code: str, request_obj) -> None:
        """
        Track click event asynchronously via Redis stream.
        
        Non-blocking: returns immediately after publishing to stream
        """
        event = {
            "code": code,
            "user_ip": request_obj.remote_addr,
            "user_agent": request_obj.headers.get("User-Agent", ""),
            "referrer": request_obj.headers.get("Referer", ""),
            "timestamp": datetime.now().isoformat(),
        }
        
        try:
            # Publish to Redis stream (< 1ms)
            self.redis.xadd(
                "click_events",
                {"data": json.dumps(event)}
            )
            
            # Update local click count
            if code in self.metadata:
                self.metadata[code]["click_count"] += 1
        
        except Exception as e:
            # Don't block redirect if tracking fails
            logger.error(f"Failed to track click: {e}")
    
    def _delete_code(self, code: str) -> None:
        """Delete a short code (e.g., on expiration or user request)."""
        self.db.pop(code, None)
        self.metadata.pop(code, None)
        self.cache.delete(code)
    
    def get_analytics(self, code: str) -> dict:
        """Get analytics for a short code."""
        if code not in self.metadata:
            return {}
        
        meta = self.metadata[code]
        return {
            "short_code": code,
            "short_url": f"{self.base_url}/{code}",
            "long_url": self.db.get(code),
            "created_at": meta.get("created_at"),
            "expires_at": meta.get("expires_at"),
            "click_count": meta.get("click_count", 0),
        }


# Initialize service
service = URLShortenerService()


# HTTP Routes

@app.route("/api/v1/shorten", methods=["POST"])
def shorten():
    """POST /api/v1/shorten - Shorten a URL"""
    data = request.get_json()
    
    if not data or "long_url" not in data:
        return jsonify({"error": "long_url required"}), 400
    
    expires_at = None
    if data.get("expires_at"):
        expires_at = datetime.fromisoformat(data["expires_at"])
    
    short_code, status = service.shorten_url(
        long_url=data["long_url"],
        custom_code=data.get("custom_code"),
        expires_at=expires_at,
        user_id=data.get("user_id")
    )
    
    if status != 201:
        return jsonify({"error": "custom code unavailable"}), status
    
    return jsonify({
        "short_code": short_code,
        "short_url": f"{service.base_url}/{short_code}",
        "long_url": data["long_url"],
        "created_at": datetime.now().isoformat(),
        "expires_at": expires_at.isoformat() if expires_at else None,
    }), status


@app.route("/<code>", methods=["GET"])
def redirect_url(code: str):
    """GET /{code} - Redirect to long URL"""
    long_url = service.lookup_code(code)
    
    if not long_url:
        return "Not found", 404
    
    # Track click asynchronously
    service.track_click(code, request)
    
    # Return 301 Permanent Redirect (browser caches, saves bandwidth)
    return redirect(long_url, code=301)


@app.route("/api/v1/links/<code>", methods=["GET"])
def get_analytics(code: str):
    """GET /api/v1/links/{code} - Get link analytics"""
    analytics = service.get_analytics(code)
    
    if not analytics:
        return jsonify({"error": "not found"}), 404
    
    return jsonify(analytics), 200


@app.route("/api/v1/links/<code>", methods=["DELETE"])
def delete_link(code: str):
    """DELETE /api/v1/links/{code} - Delete a link"""
    if code not in service.db:
        return jsonify({"error": "not found"}), 404
    
    service._delete_code(code)
    return "", 204


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "internal server error"}), 500


if __name__ == "__main__":
    logger.info("Starting URL Shortener Service")
    app.run(host="0.0.0.0", port=8080, debug=False)
