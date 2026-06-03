-- POST /v1/users  → returning the new row back to the client
INSERT INTO users (email, full_name, password_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- PATCH /v1/users/:id  → only the fields the client actually sent
UPDATE user_profiles
SET bio = $1, phone = $2
WHERE user_id = $3
RETURNING *;
