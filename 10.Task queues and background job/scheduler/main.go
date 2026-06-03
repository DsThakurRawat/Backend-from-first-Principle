// scheduler/main.go — Cron-style recurring tasks
package main

import (
    "log"
    "github.com/hibiken/asynq"
)

func main() {
    scheduler := asynq.NewScheduler(
        asynq.RedisClientOpt{Addr: "localhost:6379"},
        nil,
    )

    // Send weekly report every Sunday at midnight
    scheduler.Register("0 0 * * 0",
        asynq.NewTask("report:weekly", nil))

    // Cleanup orphan sessions every 1st of the month
    scheduler.Register("0 3 1 * *",
        asynq.NewTask("sessions:cleanup", nil))

    if err := scheduler.Run(); err != nil {
        log.Fatal(err)
    }
}
