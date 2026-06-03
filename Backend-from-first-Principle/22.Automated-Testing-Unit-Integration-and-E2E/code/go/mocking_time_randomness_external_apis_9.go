// 1) Injected clock — deterministic time.
type Clock interface{ Now() time.Time }
type fixedClock struct{ t time.Time }
func (f fixedClock) Now() time.Time { return f.t }

func TestTokenExpiry(t *testing.T) {
    clk := fixedClock{t: time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)} // frozen
    tok := NewToken(clk, time.Hour)
    if tok.ExpiresAt != clk.Now().Add(time.Hour) {
        t.Error("expiry not computed from the injected clock")
    }
}

// 2) Stub an external HTTP API with httptest.Server — no real network.
func TestFetchRate(t *testing.T) {
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
        w.Write([]byte(`{"usd_inr": 83.2}`)) // canned response
    }))
    defer srv.Close()

    client := NewRatesClient(srv.URL) // point the client at the fake server's URL
    rate, _ := client.USDINR()
    if rate != 83.2 { t.Errorf("got %v", rate) }
}
