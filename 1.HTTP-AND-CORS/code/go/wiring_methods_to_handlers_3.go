mux := http.NewServeMux()

// Go 1.22+ binds method + path. An unmatched method auto-returns 405 Method Not Allowed.
mux.HandleFunc("GET    /notes",      listNotes)   // safe, cacheable read
mux.HandleFunc("GET    /notes/{id}", getNote)
mux.HandleFunc("HEAD   /notes/{id}", getNote)     // reuse GET; framework drops the body
mux.HandleFunc("POST   /notes",      createNote)  // create (server assigns id)
mux.HandleFunc("PUT    /notes/{id}", putNote)     // full replace (idempotent)
mux.HandleFunc("PATCH  /notes/{id}", patchNote)   // partial update
mux.HandleFunc("DELETE /notes/{id}", deleteNote)  // remove (idempotent)

func getNote(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")                       // built-in path params
    note, err := db.Find(id)
    if err == ErrNotFound { http.NotFound(w, r); return } // 404
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(note)               // 200
}
