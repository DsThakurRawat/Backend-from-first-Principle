-- The consumer may see the same event twice on retry/rebalance.
-- Make the write idempotent so a duplicate is a no-op:

-- (a) dedupe by a unique event id
INSERT INTO processed_events (event_id) VALUES ($1)
ON CONFLICT (event_id) DO NOTHING;        -- second delivery inserts nothing
-- ...only do the side effect if the insert affected a row.

-- (b) or make the effect itself idempotent — upsert the end state, don't increment
INSERT INTO account_balance (account_id, balance) VALUES ($1, $2)
ON CONFLICT (account_id) DO UPDATE SET balance = EXCLUDED.balance;
-- applying the same "balance = 100" twice lands on the same state.
