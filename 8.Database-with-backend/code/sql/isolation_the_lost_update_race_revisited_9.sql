BEGIN;                                              -- start the transaction
  UPDATE accounts SET balance = balance - 500 WHERE id = $1;  -- debit A
  UPDATE accounts SET balance = balance + 500 WHERE id = $2;  -- credit B
COMMIT;                                             -- both are now permanent
-- if anything fails between BEGIN and COMMIT → ROLLBACK undoes it all
