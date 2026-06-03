// File naming convention: foo.go is tested by foo_test.go in the same package.
// Test functions are func TestXxx(t *testing.T) — the `go test` tool finds them.
func TestDiscount_AppliesPercentage(t *testing.T) {
    // Arrange — set up inputs (and any doubles)
    cart := Cart{Subtotal: 200}
    coupon := Coupon{Percent: 10}

    // Act — the ONE operation under test
    total := ApplyDiscount(cart, coupon)

    // Assert — state the expectation; a good message explains the failure
    if total != 180 {
        t.Errorf("ApplyDiscount(200, 10%%) = %d; want 180", total)
    }
}
