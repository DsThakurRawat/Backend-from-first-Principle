package main

import "fmt"

func counterService(ch chan int, done chan bool) {
    counter := 0
    for {
        select {
        case delta := <-ch:
            counter += delta   // Only this goroutine modifies counter
        case done <- counter:
            return
        }
    }
}

func main() {
    ch := make(chan int, 100)     // Buffered channel
    done := make(chan bool)

    go counterService(ch, done)

    // 1000 goroutines send +1 through the channel
    for i := 0; i < 1000; i++ {
        ch <- 1
    }

    result := <-done
    fmt.Println(result) // 1000 — no race condition, no mutex needed
}
