package config

import (
    "fmt"
    "log"
    "os"
    "strconv"

    "github.com/go-playground/validator/v10"
    "github.com/joho/godotenv"
)

// Config holds all runtime application settings.
// The `validate` tags enforce rules at startup — this is the
// single most important safeguard for config management.
type Config struct {
    // Application settings
    Port     int    `validate:"required,min=1,max=65535"`
    LogLevel string `validate:"required,oneof=debug info warn error"`
    Env      string `validate:"required,oneof=development staging production"`

    // Database config (sensitive)
    DBHost     string `validate:"required"`
    DBPort     int    `validate:"required"`
    DBUser     string `validate:"required"`
    DBPassword string `validate:"required"`
    DBName     string `validate:"required"`
    DBPoolSize int    `validate:"required,min=1"`

    // External services (sensitive)
    StripeAPIKey string `validate:"required"`

    // Feature flags (optional, default false)
    NewCheckoutEnabled bool
}

// DatabaseURL constructs the connection URL from the parts.
func (c *Config) DatabaseURL() string {
    return fmt.Sprintf(
        "postgres://%s:%s@%s:%d/%s",
        c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName,
    )
}

// Load reads env vars, applies defaults, then VALIDATES before returning.
// Called once at startup — fail loudly here, never silently in production.
func Load() (*Config, error) {
    // In local dev, load .env into the OS environment.
    // In production this is a no-op (vars already injected by the platform).
    _ = godotenv.Load()

    cfg := &Config{
        Port:               getEnvInt("PORT", 8080),        // default 8080
        LogLevel:           getEnv("LOG_LEVEL", "info"),    // default info
        Env:                getEnv("APP_ENV", "development"),
        DBHost:             os.Getenv("DB_HOST"),
        DBPort:             getEnvInt("DB_PORT", 5432),
        DBUser:             os.Getenv("DB_USER"),
        DBPassword:         os.Getenv("DB_PASSWORD"),
        DBName:             os.Getenv("DB_NAME"),
        DBPoolSize:         getEnvInt("DB_POOL_SIZE", 10),  // dev=10, prod=50
        StripeAPIKey:       os.Getenv("STRIPE_API_KEY"),
        NewCheckoutEnabled: getEnv("NEW_CHECKOUT", "false") == "true",
    }

    // THE critical step — validate everything before the app boots
    if err := validator.New().Struct(cfg); err != nil {
        return nil, fmt.Errorf("config validation failed: %w", err)
    }

    return cfg, nil
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}

func getEnvInt(key string, fallback int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            return n
        }
    }
    return fallback
}

// Usage in main.go:
//   cfg, err := config.Load()
//   if err != nil { log.Fatal(err) }  // crash early, crash loud
