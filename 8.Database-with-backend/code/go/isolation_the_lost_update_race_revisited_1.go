tx, err := db.Begin()
if err != nil { return err }
defer tx.Rollback() // safety net: a no-op if we already committed

if _, err = tx.Exec(`UPDATE accounts SET balance = balance - 500 WHERE id = $1`, a); err != nil {
	return err // deferred Rollback fires → A is untouched
}
if _, err = tx.Exec(`UPDATE accounts SET balance = balance + 500 WHERE id = $1`, b); err != nil {
	return err // deferred Rollback fires → both reverted
}
return tx.Commit() // only here do both writes become permanent
