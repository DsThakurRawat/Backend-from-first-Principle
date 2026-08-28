package main

import (
    "fmt"
    "sync"
)

func main() {
    var counter int
    var mu sync.Mutex
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()         // Acquire — other goroutines wait here
            counter++
            mu.Unlock()       // Release — next goroutine can proceed
        }()
    }

    wg.Wait()
    fmt.Println(counter) // Always 1000
}
