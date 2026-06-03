# The unit: pure logic, no I/O — trivially testable.
def is_strong_password(p: str) -> bool:
    if len(p) < 8:
        return False
    return any(c.isdigit() for c in p) and any(c.isupper() for c in p)

def test_rejects_short_password():
    assert is_strong_password("short1A") is False    # 7 chars → too short

def test_accepts_valid_password():
    assert is_strong_password("longEnough9") is True  # meets all rules

# Run:  pytest            (-v verbose, -k strong to filter by name)
