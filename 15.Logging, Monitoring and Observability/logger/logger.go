// logger/logger.go — Environment-aware log level
package logger

import (
    "os"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

func getLogLevel() zapcore.Level {
    env := os.Getenv("APP_ENV")
    switch env {
    case "production":
        return zapcore.InfoLevel   // production: INFO and above
    case "staging":
        return zapcore.WarnLevel   // staging: WARN and above only
    default:
        return zapcore.DebugLevel  // local dev: everything
    }
}

func New() *zap.Logger {
    env := os.Getenv("APP_ENV")
    level := getLogLevel()

    var cfg zap.Config
    if env == "production" {
        // Production: JSON format — parseable by Loki, ELK, New Relic
        cfg = zap.NewProductionConfig()
        cfg.EncoderConfig.TimeKey = "timestamp"
        cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
    } else {
        // Development: coloured console format — human-readable
        cfg = zap.NewDevelopmentConfig()
        cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
    }

    cfg.Level = zap.NewAtomicLevelAt(level)
    logger, _ := cfg.Build()
    return logger
}
