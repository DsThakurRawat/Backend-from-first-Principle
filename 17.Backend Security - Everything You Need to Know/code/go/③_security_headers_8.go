import "github.com/go-chi/chi/v5/middleware"

r.Use(middleware.SetHeader("X-Frame-Options", "DENY"))
r.Use(middleware.SetHeader("X-Content-Type-Options", "nosniff"))
r.Use(middleware.SetHeader("Referrer-Policy", "strict-origin-when-cross-origin"))
r.Use(middleware.SetHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"))
r.Use(middleware.SetHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'"))
