SELECT u.*, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.full_name ILIKE $1 || '%'   -- filter: names starting with $1 (case-insensitive)
ORDER BY u.created_at DESC           -- sort (column from an allow-list, direction chosen)
LIMIT $2 OFFSET $3;                  -- page 1 → OFFSET 0, page 2 → OFFSET (limit), ...
