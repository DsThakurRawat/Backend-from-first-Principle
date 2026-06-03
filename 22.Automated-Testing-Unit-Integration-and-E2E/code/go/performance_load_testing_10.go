// Benchmarks live beside tests; the tool tunes b.N until timing is stable.
func BenchmarkParseEvent(b *testing.B) {
    payload := []byte(`{"type":"click","ts":1717000000}`)
    b.ReportAllocs()                 // also report allocations/op
    for i := 0; i < b.N; i++ {       // the loop the framework times
        _, _ = ParseEvent(payload)
    }
}

// Run:  go test -bench=. -benchmem
//   BenchmarkParseEvent-8   3142051   382 ns/op   96 B/op   2 allocs/op
// Compare runs with `benchstat` to catch performance REGRESSIONS over time.
