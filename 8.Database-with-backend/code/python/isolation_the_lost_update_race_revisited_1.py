conn = pool.getconn()
try:
    with conn:                       # commits on success, ROLLBACKs on any exception
        with conn.cursor() as cur:
            cur.execute("UPDATE accounts SET balance = balance - 500 WHERE id = %s", (a,))
            cur.execute("UPDATE accounts SET balance = balance + 500 WHERE id = %s", (b,))
    # reaching here means both writes committed atomically
finally:
    pool.putconn(conn)
