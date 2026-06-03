import pytest

# Each tuple is one case; ids give readable names in the output.
@pytest.mark.parametrize(
    "subtotal, percent, expected",
    [
        (200, 10, 180),
        (100, 0,  100),
        (100, 100, 0),
        (99,  10, 90),     # boundary/edge case
    ],
    ids=["ten-off-200", "zero", "full", "rounds-down"],
)
def test_apply_discount(subtotal, percent, expected):
    got = apply_discount(Cart(subtotal=subtotal), Coupon(percent=percent))
    assert got == expected

# `pytest -k rounds-down` runs just one case; each shows up as its own test.
