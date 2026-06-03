package main

import (
    "encoding/json"
    "io"
    "net/http"
)

type Note struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
    Done  bool   `json:"done"`
}

func createNote(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)      // 1. read request body
    defer r.Body.Close()

    var in Note
    if err := json.Unmarshal(body, ∈); err != nil {
        http.Error(w, "invalid JSON", http.StatusBadRequest)
        return
    }
    w.Header().Set("Content-Type", "application/json") // 2. headers FIRST
    w.WriteHeader(http.StatusCreated)                  // 3. status
    in.ID = 42
    json.NewEncoder(w).Encode(in)                      // 4. body LAST
}

func main() {
    http.HandleFunc("POST /api/v1/notes", createNote)  // Go 1.22 method routing
    http.ListenAndServe(":8080", nil)
}
