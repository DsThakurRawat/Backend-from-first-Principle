ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;   -- null = alive

-- "delete" = mark, don't remove
UPDATE users SET deleted_at = now() WHERE id = $1;

-- every read must exclude the dead rows
SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC;

-- gotcha: a plain UNIQUE now blocks reusing a soft-deleted email.
-- a PARTIAL unique index fixes it — uniqueness only among LIVE rows:
CREATE UNIQUE INDEX uniq_active_email
  ON users (email) WHERE deleted_at IS NULL;
