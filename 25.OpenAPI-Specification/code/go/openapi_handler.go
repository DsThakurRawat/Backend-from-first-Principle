// Package main implements a minimal HTTP server that serves a static
// OpenAPI specification and demonstrates the design-first approach.
//
// The spec is written first (openapi.json), and the server simply serves it.
// Run:
//     go run openapi_handler.go
// Then visit:
//     http://localhost:4000/openapi.json  → The raw OpenAPI spec
//     http://localhost:4000/docs          → Swagger UI
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

const swaggerUI = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Docs</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
	SwaggerUIBundle({
		url: "/openapi.json",
		dom_id: "#swagger-ui",
		deepLinking: true,
		layout: "StandaloneLayout",
	});
</script>
</body>
</html>`

func main() {
	http.HandleFunc("/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile("openapi.json")
		if err != nil {
			http.Error(w, "Specification not found", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	http.HandleFunc("/docs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(swaggerUI))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	fmt.Printf("OpenAPI server serving spec on :%s\n", port)
	fmt.Printf("  Spec:  http://localhost:%s/openapi.json\n", port)
	fmt.Printf("  Docs:  http://localhost:%s/docs\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
