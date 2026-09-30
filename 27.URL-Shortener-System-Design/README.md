# Module 27: URL Shortener System Design - Quick Reference

## 🎯 Overview
A comprehensive guide to building a scalable URL shortener system (like Bitly/TinyURL) from first principles.

**Chapter:** 27  
**Reading Time:** 4-5 hours  
**Status:** ✅ Fully integrated & compiled

---

## 📂 Directory Structure

```
27.URL-Shortener-System-Design/
└── code/
    ├── go/
    │   ├── 1_base62_encoding.go           # Base62 codec
    │   ├── 2_distributed_id_generator.go  # Redis atomic counter
    │   ├── 3_lru_caching.go               # LRU cache + hot key handling
    │   └── 4_complete_service.go          # Full HTTP service
    └── python/
        ├── 1_base62_encoding.py           # Base62 codec
        ├── 2_distributed_id_generator.py  # ID generation with batching
        ├── 3_lru_caching.py               # LRU + hot key replication
        └── 4_complete_service.py          # Flask REST service
```

---

## 📖 Content Sections

### Part 1: High-Level Design (HLD)
1. **What is a URL Shortener?**
   - The engineering challenge (read-heavy, hot keys, expiration)

2. **Requirements Gathering & Estimation**
   - Functional: shortening, custom aliases, redirection, analytics, deletion
   - Non-functional: <10ms latency, 99.99% uptime, durability
   - Numbers: 500M writes/month, 50B reads/month, 63TB storage (5 years)

3. **API Design**
   - `POST /api/v1/shorten` - Shorten a URL
   - `GET /{shortCode}` - Redirect (301 vs 302 trade-offs)
   - `GET /api/v1/links/{code}` - Get analytics
   - `DELETE /api/v1/links/{code}` - Delete link

4. **Data Storage Selection**
   - Single-node RDBMS ❌
   - Distributed SQL (sharding) ✅ (complex)
   - NoSQL (Cassandra/DynamoDB) ✅ (recommended)

5. **Distributed ID Generation** (The Core Challenge)
   - Random strings ❌ (collision risk)
   - Hashing ❌ (too long when truncated)
   - UUID ❌ (too long)
   - **Base62 Counter ✅** (recommended)
   - Snowflake IDs ✅ (industry standard)

6. **Caching Strategy**
   - Layer 1: Client-side (browser 301 redirect cache)
   - Layer 2: CDN (edge locations, 24h TTL)
   - Layer 3: Application (Redis + in-process LRU)

### Part 2: Low-Level Design (LLD)
1. **Base62 Encoding** - Convert IDs to compact strings
2. **Distributed Counter** - Redis INCR for atomic ID generation
3. **Collision Handling** - Pessimistic/Optimistic locking for custom codes
4. **Expiration & TTL** - Lazy deletion vs active background cleanup
5. **Analytics** - Async event publishing (non-blocking redirects)

### Part 3: Production Implementation
- Complete Go service (Chi router, Redis, HTTP handlers)
- Complete Python service (Flask, Redis Streams, async tracking)

### Part 4: Scaling & Reliability
- Handling hot keys (viral links, 10K+ req/sec)
- High-availability architecture (multi-region, replicated caches)
- Graceful degradation (works without Redis)

---

## 💡 Key Learnings

### ID Generation Strategy
```
DO use:   Base62(Redis INCR)      → compact, collision-free
DON'T:    Random strings          → 0.3% collision risk
DON'T:    Truncated MD5           → collision risk
DON'T:    UUID                    → too long for short URL
```

### Caching Strategy
```
Browser    ──(301 cached)──>  Won't re-request
   ↓
CDN Edge   ──(24h cache)──>   Geo-distributed
   ↓
Redis      ──(< 1ms)──>       In-process LRU for hot keys
   ↓
Database   ──(~10ms)──>       Cassandra/DynamoDB
```

### HTTP Status Codes
- **301 Permanent:** Better performance (browser caches), loses analytics
- **302 Temporary:** Every request hits your server, enables analytics
- **Recommendation:** Use 302 initially, switch to 301 + client-side tracking

### Handling Hot Keys
```
Single Redis: 10K req/sec → bottleneck
                ↓
With local LRU: Each app server has own cache
                ↓
Sticky session routes same code to same server
                ↓
Result: Microsecond latency, no DB queries
```

---

## 🚀 Quick Start (Running the Code)

### Python Service
```bash
cd 27.URL-Shortener-System-Design/code/python

# Install dependencies
pip install flask redis

# Run the service
python 4_complete_service.py
# Server runs on http://localhost:8080

# Test endpoints
curl -X POST http://localhost:8080/api/v1/shorten \
  -H "Content-Type: application/json" \
  -d '{"long_url": "https://example.com/very/long/path"}'

# Redirect
curl -L http://localhost:8080/abc123
```

### Go Service
```bash
cd 27.URL-Shortener-System-Design/code/go

# Run the service
go run *.go
# Server runs on http://localhost:8080

# Same API as Python version
```

---

## 📊 Capacity Planning

### Codepoint Growth by Character Count
```
Length 1: 62 codes
Length 2: 3,844 codes
Length 3: 238,328 codes
Length 4: 14.7M codes
Length 5: 916M codes
Length 6: 56.8B codes  ← typical for 500M URLs/month
Length 7: 3.5T codes   ← future-proof
```

### Latency Targets (p99)
- Browser cache hit: 0ms (no request)
- CDN cache hit: 5-10ms
- Redis cache hit: 0.1-1ms
- Database query: 5-10ms
- **Total SLA: <10ms**

---

## 📚 Further Reading

### Distributed ID Generation
- Twitter Snowflake - [GitHub](https://github.com/twitter-archive/snowflake)
- UUID v7 - [RFC 4122](https://tools.ietf.org/html/rfc4122)
- Base62 Encoding - [Wikipedia](https://en.wikipedia.org/wiki/Radix)

### Caching
- Redis Documentation - [redis.io](https://redis.io)
- Cache Stampede Problem - [Blog](https://en.wikipedia.org/wiki/Cache_stampede)
- Memcached vs Redis - [Comparison](https://en.wikipedia.org/wiki/Memcached)

### Databases
- Cassandra Partitioning - [Docs](https://cassandra.apache.org/doc/latest/)
- DynamoDB TTL - [AWS Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- PostgreSQL Sharding - [Wiki](https://wiki.postgresql.org/wiki/Partitioning)

### System Design
- System Design Interview (Alex Xu)
- Designing Data-Intensive Applications (Martin Kleppmann)
- The Art of Scalability (O'Reilly)

---

## 🎓 Learning Outcomes

After reading this module, you'll understand:

1. ✅ How URL shorteners work at scale
2. ✅ Trade-offs between different data storage options
3. ✅ Distributed ID generation without a SPOF
4. ✅ Multi-layer caching strategies
5. ✅ How to handle viral traffic (hot keys)
6. ✅ Async analytics tracking patterns
7. ✅ Database design for read-heavy workloads
8. ✅ High-availability architecture
9. ✅ Graceful degradation strategies
10. ✅ Production-ready Go and Python implementations

---

## 📝 Notes

- This is **Chapter 27** in the Backend from First Principles series
- Complements chapters on Caching (#9), Databases (#8), and Scaling (#18, #19)
- Features both HLD (high-level architecture) and LLD (implementation details)
- Includes working code examples in Go and Python
- Designed for intermediate to advanced backend engineers

---

**Created:** 2026-09-28  
**Status:** ✅ Published & Integrated  
**Next Module:** Would you like to add more chapters or improve this one?
