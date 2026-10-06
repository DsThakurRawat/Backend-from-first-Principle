package main

import (
	"log"
	"net/http"
	"os"

	shortener "example.com/urlshortener"
)

func main() {
	redisAddr := envOrDefault("REDIS_ADDR", "localhost:6379")
	httpAddr := envOrDefault("HTTP_ADDR", ":8080")
	baseURL := envOrDefault("BASE_URL", "http://localhost:8080")

	service := shortener.NewURLShortener(redisAddr, baseURL)
	log.Printf("starting URL shortener on %s", httpAddr)
	log.Fatal(http.ListenAndServe(httpAddr, shortener.NewRouter(service)))
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
