SELECT
  u.*,
  to_jsonb(up.*) AS profile          -- fold the profile row into one JSON field
FROM users u
LEFT JOIN user_profiles up           -- LEFT so users without a profile still appear
  ON u.id = up.user_id               -- the foreign-key join condition
ORDER BY u.created_at DESC;          -- newest first; never rely on default order
