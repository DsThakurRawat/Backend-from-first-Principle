package main

import (
    "context"
    "encoding/json"
    "net/http"
    "strings"

    "github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ---- schema (the gate) ----
type CreateBook struct {
    Name string `json:"name" validate:"required,min=5,max=100"`
}

type Book struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

// ---- helper ----
func writeJSON(w http.ResponseWriter, status int, b any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(b)
}

// ---- CONTROLLER: owns HTTP + the validation gate ----
func createBookHandler(w http.ResponseWriter, r *http.Request) {
    var body CreateBook

    // === GATE — runs before ANY business logic ===
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        writeJSON(w, 400, map[string]string{
            "error": "name: expected a string"})
        return // 400 — the DB is never touched
    }
    body.Name = strings.TrimSpace(body.Name) // transform
    if err := validate.Struct(body); err != nil {
        writeJSON(w, 400, map[string]string{
            "error": err.Error()})
        return // 400 Bad Request, not a confusing 500
    }

    // === only now: business logic (service → repo) ===
    book, err := createBook(r.Context(), body.Name)
    if err != nil {
        writeJSON(w, 500, map[string]string{
            "error": "could not create book"})
        return
    }
    writeJSON(w, 201, book)
}

// ---- service + repository (sketched) ----
func createBook(ctx context.Context, name string) (*Book, error) {
    // service logic … repository INSERT … then:
    return &Book{ID: 1, Name: name}, nil
}

func main() {
    http.HandleFunc("/api/books", createBookHandler)
    http.ListenAndServe(":8080", nil)
}
