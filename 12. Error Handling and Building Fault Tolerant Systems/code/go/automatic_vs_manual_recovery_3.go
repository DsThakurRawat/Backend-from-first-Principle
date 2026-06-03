func sendEmailWithRetry(to, subject, body string) error {
    maxRetries := 5
    baseDelay  := 1 * time.Second

    for attempt := 0; attempt < maxRetries; attempt++ {
        err := emailClient.Send(to, subject, body)
        if err == nil {
            return nil  // success
        }

        if !isRetryable(err) {
            return fmt.Errorf("permanent failure: %w", err)
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        wait := baseDelay * time.Duration(1<<attempt)
        // Add jitter (±20%) to prevent thundering herd
        jitter := time.Duration(rand.Int63n(int64(wait / 5)))
        time.Sleep(wait + jitter)

        log.Warn("email send failed, retrying",
            "attempt", attempt+1,
            "wait_ms", wait.Milliseconds(),
            "error", err)
    }
    return fmt.Errorf("all %d retries exhausted", maxRetries)
}

func isRetryable(err error) bool {
    // Retry on 429, 503, network errors; not on 400, 401, 422
    var httpErr *HTTPError
    if errors.As(err, &httpErr) {
        return httpErr.StatusCode == 429 || httpErr.StatusCode >= 500
    }
    return true  // network errors are always retryable
}
