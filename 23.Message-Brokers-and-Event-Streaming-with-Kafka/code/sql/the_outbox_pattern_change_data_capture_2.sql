BEGIN;

-- 1) the actual business change
INSERT INTO orders (id, customer_id, amount, status)
VALUES ('order-42', 'cust-7', 1999, 'PLACED');

-- 2) the event to publish, written in the SAME transaction → atomic with (1)
INSERT INTO outbox (id, aggregate, event_type, payload, created_at)
VALUES (gen_random_uuid(), 'order-42', 'OrderPlaced',
        '{"id":"order-42","amount":1999}', now());

COMMIT;   -- both succeed together, or neither does — no dual-write gap

-- A relay (or Debezium CDC on the transaction log) then reads new `outbox`
-- rows and produces them to Kafka, marking each published. Retries are safe
-- because downstream consumers are idempotent (§9).
