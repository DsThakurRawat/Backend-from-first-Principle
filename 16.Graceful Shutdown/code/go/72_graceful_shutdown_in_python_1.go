package main

import (
    "context"
    "errors"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    // --- Startup phase: acquire resources in order ---
    db := connectDatabase()           // 1. acquire DB (TCP pool)
    jobs := startBackgroundJobs()     // 2. acquire Redis-backed worker

    srv := &http.Server{Addr: ":8080", Handler: router()}

    // Register a handler that waits for SIGINT (Ctrl+C) or SIGTERM (PM2/k8s).
    // We handle BOTH the same way — the intention is identical: shut down.
    ctx, stop := signal.NotifyContext(context.Background(),
        os.Interrupt, syscall.SIGTERM)
    defer stop()

    // Run the server in a goroutine so main can wait for the signal.
    go func() {
        log.Println("server started, ready to accept requests")
        if err := srv.ListenAndServe(); err != nil &&
            !errors.Is(err, http.ErrServerClosed) {
            log.Fatalf("listen error: %v", err)
        }
    }()

    // Block here until a signal arrives (the "living" phase).
    <-ctx.Done()
    log.Println("signal received — starting graceful shutdown")

    // Hard limit: give in-flight work up to 30 seconds, then force stop.
    shutdownCtx, cancel := context.WithTimeout(
        context.Background(), 30*time.Second)
    defer cancel()

    gracefulShutdown(shutdownCtx, srv, db, jobs)
    log.Println("server exited properly")
}

// gracefulShutdown releases resources in REVERSE order of acquisition.
// Acquired: DB -> jobs -> HTTP server. Released: HTTP -> jobs -> DB.
func gracefulShutdown(
    ctx context.Context,
    srv *http.Server,
    db *Database,
    jobs *JobServer,
) {
    // 1. CONNECTION DRAINING: srv.Shutdown stops accepting NEW
    //    connections and waits for in-flight requests to finish
    //    (or until the 30s ctx deadline forces it).
    log.Println("draining HTTP connections...")
    if err := srv.Shutdown(ctx); err != nil {
        log.Printf("forced HTTP shutdown: %v", err)
    }

    // 2. Stop the background job server (closes Redis connections,
    //    waits for workers to finish current jobs).
    log.Println("stopping background job server...")
    jobs.Shutdown()

    // 3. Close the database LAST — finish/commit open transactions,
    //    then close all pooled TCP connections one by one.
    log.Println("closing database connection...")
    if err := db.Close(); err != nil {
        log.Printf("db close error: %v", err)
    }
}
