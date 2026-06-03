BEGIN;
  -- lock this account's row so no other transaction can change it until we're done
  SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;
  -- ... compute safely in app code ...
  UPDATE accounts SET balance = $2 WHERE id = $1;
COMMIT;
