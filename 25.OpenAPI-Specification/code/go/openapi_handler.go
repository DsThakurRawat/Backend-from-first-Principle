// Package main implements a minimal HTTP server that serves a static
// OpenAPI specification and demonstrates the design-first approach.
//
// The spec is written first (openapi.yaml), and the server simply serves it.
// Run:
//     go run openapi_handler.go
// Then visit:
//     http://localhost:4000/openapi.json  → The raw OpenAPI spec
//     http://localhost:4000/docs          → Swagger UI (serve your own HTML)
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

// openapiSpec holds the parsed OpenAPI specification.
type openapiSpec struct {
	OpenAPI  string                 `json:"openapi"`
	Info     specInfo               `json:"info"`
	Servers  []specServer           `json:"servers"`
	Paths    map[string]specPath    `json:"paths"`
	Components specComponents       `json:"components"`
	Security []map[string][]string `json:"security"`
}

type specInfo struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Version     string `json:"version"`
}

type specServer struct {
	URL         string `json:"url"`
	Description string `json:"description"`
}

type specPath struct {
	Get *specOperation `json:"get,omitempty"`
	Post *specOperation `json:"post,omitempty"`
}

type specOperation struct {
	OperationID string `json:"operationId"`
	Summary     string `json:"summary"`
	Tags        []string `json:"tags"`
	Parameters  []specParameter `json:"parameters,omitempty"`
	Responses   map[string]specResponse `json:"responses"`
}

type specParameter struct {
	Name     string `json:"name"`
	In       string `json:"in"`
	Required bool   `json:"required"`
	Schema   specSchema `json:"schema"`
}

type specSchema struct {
	Type     string `json:"type"`
	Minimum  *int   `json:"minimum,omitempty"`
	Default  any    `json:"default,omitempty"`
	Enum     []any  `json:"enum,omitempty"`
	Example  any    `json:"example,omitempty"`
}

type specResponse struct {
	Description string `json:"description"`
}

type specComponents struct {
	Schemas map[string]specSchema `json:"schemas"`
	SecuritySchemes map[string]specSecurityScheme `json:"securitySchemes"`
}

type specSecurityScheme struct {
	Type     string          `json:"type"`
	In       string          `json:"in,omitempty"`
	Name     string          `json:"name,omitempty"`
	Scheme   string          `json:"scheme,omitempty"`
	BearerFormat string       `json:"bearerFormat,omitempty"`
}

// loadSpec reads the OpenAPI YAML/JSON file from disk.
func loadSpec(path string) (openapiSpec, error) {
	var spec openapiSpec
	data, err := os.ReadFile(path)
	if err != nil {
		return spec, fmt.Errorf("failed to read spec file: %w", err)
	}
	if err := json.Unmarshal(data, &spec); err != nil {
		return spec, fmt.Errorf("failed to parse spec: %w", err)
	}
	return spec, nil
}

func main() {
	spec, err := loadSpec("openapi.json")
	if err != nil {
		log.Fatalf("openapi_handler: %v", err)
	}

	http.HandleFunc("/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(spec)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	fmt.Printf("OpenAPI server serving spec on :%s\n", port)
	fmt.Printf("  Spec:  http://localhost:%s/openapi.json\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
