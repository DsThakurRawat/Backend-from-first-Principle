// ❌ UNSAFE — never do this
slog.Error("login_failed",
    "email", user.Email,          // PII leak
    "password", req.Password,     // catastrophic
    "api_key", cfg.OpenAIKey,      // secret leak
)

// ✅ SAFE — IDs and correlation only
slog.Error("login_failed",
    "user_id", user.ID,
    "correlation_id", r.Header.Get("X-Request-ID"),
    "reason", "invalid_credentials",  // generic code, not DB message
)
