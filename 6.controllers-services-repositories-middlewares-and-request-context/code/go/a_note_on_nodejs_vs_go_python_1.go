// CreateBookRequest is our native format — the bind target.
type CreateBookRequest struct {
    Title  string `json:"title"`
    Author string `json:"author"`
}

func CreateBookHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateBookRequest

    // Step 1 + 2: extract the body and deserialize (bind) into the struct.
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        // Deserialization failed -> the payload is malformed.
        http.Error(w, "invalid request body", http.StatusBadRequest) // 400
        return // terminate the request here; do not proceed.
    }
    // ... validation, transformation, delegation follow ...
}
