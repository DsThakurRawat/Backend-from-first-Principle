import time

DUMMY_HASH = bcrypt.hashpw(b"x", bcrypt.gensalt())
FLOOR = 0.25  # seconds — equalize every path

def authenticate(email: str, pw: str):
    start = time.perf_counter()
    try:
        user = lookup_by_email(email)
        if user is None:
            # run a dummy hash so timing matches the valid path
            bcrypt.checkpw(pw.encode(), DUMMY_HASH)
            return None, "authentication failed"
        if not bcrypt.checkpw(pw.encode(), user["hash"]):  # constant-time
            return None, "authentication failed"
        return user, None  # success: issue session / JWT
    finally:
        # pad so all outcomes take ~the same wall-clock time
        elapsed = time.perf_counter() - start
        if elapsed < FLOOR:
            time.sleep(FLOOR - elapsed)
