-- Template on server:
SELECT * FROM users WHERE email = '' + userInput + ''

-- Happy path (Alice logs in normally):
SELECT * FROM users WHERE email = 'alice@gmail.com'
-- Returns Alice's row ✓

-- Attacker types:  ' OR '1'='1 --
SELECT * FROM users WHERE email = '' OR '1'='1' --'
-- Returns ALL users ← data leak

-- Attacker types:  '; DROP TABLE users; --
SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
-- Deletes your entire users table
