# What Celery does under the hood in Redis:

# Producer (your API) — pushes serialized task to left of list
LPUSH celery '{"task":"send_email","args":["alice@example.com","token123"]}'

# Worker — blocks waiting for item, pops from right (FIFO)
# BRPOP blocks for up to 5 seconds, then re-polls
BRPOP celery 5

# To see queue depth at any time:
LLEN celery   # → 42 (42 pending tasks)
