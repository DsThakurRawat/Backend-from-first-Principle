package main

import (
    "fmt"
    "math"
    "sort"
    "time"
)

// Percentile returns the p-th percentile from a slice of durations.
// p must be between 0 and 100.
func Percentile(latencies []time.Duration, p float64) time.Duration {
    if len(latencies) == 0 {
        return 0
    }
    sorted := make([]time.Duration, len(latencies))
    copy(sorted, latencies)
    sort.Slice(sorted, func(i, j int) bool {
        return sorted[i] < sorted[j]
    })

    rank := (p / 100.0) * float64(len(sorted)-1)
    idx  := int(math.Ceil(rank))
    return sorted[idx]
}

func main() {
    // Simulated latency samples
    samples := []time.Duration{
        12 * time.Millisecond, 15 * time.Millisecond,
        22 * time.Millisecond, 48 * time.Millisecond,
        95 * time.Millisecond, 110 * time.Millisecond,
        340 * time.Millisecond, 890 * time.Millisecond,
        1200 * time.Millisecond, 4800 * time.Millisecond,
    }

    fmt.Printf("P50:  %v\n", Percentile(samples, 50))
    fmt.Printf("P90:  %v\n", Percentile(samples, 90))
    fmt.Printf("P99:  %v\n", Percentile(samples, 99))
}
