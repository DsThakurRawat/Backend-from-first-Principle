import os, hmac, hashlib
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

PEPPER = os.environ["PASSWORD_PEPPER"].encode()  # secret, NOT in DB

# cost parameters — tune so one hash ~250ms
ph = PasswordHasher(
    time_cost=3,            # iterations
    memory_cost=64 * 1024,  # 64 MB, memory-hard
    parallelism=4,
    hash_len=32,
    salt_len=16,            # random salt baked into the output
)

def peppered(pw: str) -> bytes:
    return hmac.new(PEPPER, pw.encode(), hashlib.sha256).digest()

# argon2-cffi embeds salt + params inside the returned string
def hash_argon(pw: str) -> str:
    return ph.hash(peppered(pw))

def verify_argon(encoded: str, pw: str) -> bool:
    try:
        ph.verify(encoded, peppered(pw))   # constant-time internally
    except VerifyMismatchError:
        return False
    # transparently upgrade old hashes when cost is raised
    if ph.check_needs_rehash(encoded):
        rehash_and_store(hash_argon(pw))
    return True
