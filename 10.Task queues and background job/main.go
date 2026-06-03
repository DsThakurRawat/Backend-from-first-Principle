// main.go — Wire producer and start worker server
package main

import (
    "github.com/hibiken/asynq"
    "myapp/handlers"
    "myapp/tasks"
)

func main() {
    redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}

    // ── PRODUCER ─────────────────────────────────────
    client := asynq.NewClient(redisOpt)
    defer client.Close()

    task, _ := tasks.NewSendVerificationEmailTask(
        "usr_01J2K", "alice@example.com", "eyJhbGci...",
    )
    // Enqueue — returns immediately
    info, _ := client.Enqueue(task)
    // info.ID, info.Queue, info.State can be used for monitoring

    // ── CONSUMER (worker server) ─────────────────────
    srv := asynq.NewServer(redisOpt, asynq.Config{
        Concurrency: 10, // 10 concurrent workers
        Queues: map[string]int{
            "email":    6, // higher priority
            "default":  3,
            "low":      1,
        },
    })

    mux := asynq.NewServeMux()
    mux.HandleFunc(tasks.TypeSendVerificationEmail,
        handlers.EmailHandler{}.HandleSendVerificationEmail)

    srv.Run(mux)
}
