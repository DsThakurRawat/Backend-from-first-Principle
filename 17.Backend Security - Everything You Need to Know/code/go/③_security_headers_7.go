import "log/slog"

func setupLogger() {
    level := slog.LevelInfo  // default: production
    if os.Getenv("APP_ENV") == "development" {
        level = slog.LevelDebug
    }
    slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout,
        &slog.HandlerOptions{Level: level})))
}
