import structlog

log = structlog.get_logger()

# Good — structured, queryable, no sensitive data
log.error(
    "payment_failed",
    user_id="u_9a3f",          # ID, not email
    correlation_id="req_abc123",
    provider="stripe",
    error_code="card_declined",
    amount_cents=4999,
)

# BAD — never log PII or secrets
# log.error("payment_failed", email="alice@example.com", card="4242...")
