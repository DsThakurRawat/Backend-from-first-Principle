# pytest discovers files named test_*.py and functions named test_*.
# A bare `assert` is enough — pytest rewrites it to show a rich failure diff.
def test_discount_applies_percentage():
    # Arrange — set up inputs (and any doubles)
    cart = Cart(subtotal=200)
    coupon = Coupon(percent=10)

    # Act — the ONE operation under test
    total = apply_discount(cart, coupon)

    # Assert — pytest prints actual vs expected automatically on failure
    assert total == 180
