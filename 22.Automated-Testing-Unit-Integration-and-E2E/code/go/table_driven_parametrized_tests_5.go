func TestApplyDiscount(t *testing.T) {
    // The TABLE: each row is one case with a name.
    cases := []struct {
        name     string
        subtotal int
        percent  int
        want     int
    }{
        {"ten percent off 200", 200, 10, 180},
        {"zero discount",       100, 0,  100},
        {"full discount",       100, 100, 0},
        {"rounds down",          99, 10,  90}, // boundary/edge case
    }
    for _, c := range cases {
        // t.Run makes each row a named subtest — failures report the case name.
        t.Run(c.name, func(t *testing.T) {
            got := ApplyDiscount(Cart{Subtotal: c.subtotal}, Coupon{Percent: c.percent})
            if got != c.want {
                t.Errorf("got %d, want %d", got, c.want)
            }
        })
    }
}
// `go test -run TestApplyDiscount/rounds_down` runs just one case.
