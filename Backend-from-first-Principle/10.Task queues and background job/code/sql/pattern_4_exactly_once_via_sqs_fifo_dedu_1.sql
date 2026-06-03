-- PostgreSQL — Idempotent email log via upsert
-- If the verification_emails row already exists for this token, do nothing
INSERT INTO verification_emails (token, user_id, sent_at, provider_msg_id)
VALUES ($1, $2, NOW(), $3)
ON CONFLICT (token) DO NOTHING;

-- For updates: ON CONFLICT DO UPDATE
INSERT INTO user_status (user_id, email_verified, updated_at)
VALUES ($1, true, NOW())
ON CONFLICT (user_id) DO UPDATE
  SET email_verified = EXCLUDED.email_verified,
      updated_at = EXCLUDED.updated_at;
