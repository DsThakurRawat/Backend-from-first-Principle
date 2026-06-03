// logger/logger.go
package logger

import (
    "os"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

var Log *zap.Logger

func Init() {
    env := os.Getenv("APP_ENV")
    var cfg zap.Config

    if env == "production" {
        cfg = zap.NewProductionConfig()          // JSON output
        cfg.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
    } else {
        cfg = zap.NewDevelopmentConfig()         // coloured console
        cfg.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
        cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
    }

    Log, _ = cfg.Build(
        // Always include these fields in every log entry
        zap.Fields(
            zap.String("service", "todo-api"),
            zap.String("env", env),
        ),
    )
}
