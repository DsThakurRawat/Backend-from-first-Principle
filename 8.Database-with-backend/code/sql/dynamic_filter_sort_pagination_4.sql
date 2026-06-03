SELECT u.*, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = $1;        -- $1 is a parameter slot; the value is sent separately
