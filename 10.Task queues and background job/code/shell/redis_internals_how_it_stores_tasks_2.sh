# Producer adds entry to stream
# * means auto-generate ID (timestamp-sequence: 1705312200000-0)
XADD myapp:email_queue * user_id usr_01J2K email alice@example.com token eyJ...

# Create a consumer group (workers belong to a group)
XGROUP CREATE myapp:email_queue email_workers $ MKSTREAM

# Worker reads next undelivered message (> means "new")
XREADGROUP GROUP email_workers worker-1 COUNT 1 BLOCK 5000 STREAMS myapp:email_queue >

# After successful processing, ACK the message by ID
XACK myapp:email_queue email_workers 1705312200000-0

# Check pending (delivered but not ACKed) — these are in-flight tasks
XPENDING myapp:email_queue email_workers - + 10
