package config

import (
    "fmt"
    "os"
    "strings"
)

type Config struct {
    DatabaseURL    string
    OpenAIKey      string
    JWTSecret      string
    ResendAPIKey   string
}

// MustLoad panics if any required variable is missing.
// Call this once in main() before http.ListenAndServe.
func MustLoad() Config {
    required := []string{
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "JWT_SECRET",
        "RESEND_API_KEY",
    }

    var missing []string
    for _, key := range required {
        if os.Getenv(key) == "" {
            missing = append(missing, key)
        }
    }
    if len(missing) > 0 {
        // Crash immediately — loud and clear
        panic(fmt.Sprintf("[FATAL] missing required env vars: %s",
            strings.Join(missing, ", ")))
    }

    return Config{
        DatabaseURL:  os.Getenv("DATABASE_URL"),
        OpenAIKey:    os.Getenv("OPENAI_API_KEY"),
        JWTSecret:    os.Getenv("JWT_SECRET"),
        ResendAPIKey: os.Getenv("RESEND_API_KEY"),
    }
}

// main.go
func main() {
    cfg := config.MustLoad()  // panics here if config invalid
    server := newServer(cfg)
    log.Fatal(server.ListenAndServe())
}
