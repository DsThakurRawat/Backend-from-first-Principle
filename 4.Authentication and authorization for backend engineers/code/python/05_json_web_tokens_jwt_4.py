# Verify with a PUBLIC key, pinning RS256 (blocks alg:none & key confusion)
def verify_rs256(token: str, public_key) -> dict:
    return jwt.decode(token, public_key, algorithms=["RS256"])  # whitelist

# Rotate a refresh token; detect reuse of an already-spent one.
def refresh(rdb, presented: str) -> str:
    family = rdb.get(f"rt:{presented}")
    if family is None:
        # not a live token — was it previously spent? -> theft
        fam = rdb.get(f"spent:{presented}")
        if fam is not None:
            rdb.delete(f"family:{fam.decode()}")    # revoke the whole family
            raise PermissionError("refresh reuse detected")
        raise PermissionError("invalid refresh token")
    rdb.delete(f"rt:{presented}")                   # consume the live token
    rdb.setex(f"spent:{presented}", 14 * 24 * 3600, family)  # remember it
    new_refresh = secrets.token_hex(32)
    rdb.setex(f"rt:{new_refresh}", 14 * 24 * 3600, family)
    return new_refresh
