func CreateBookHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateBookRequest
    json.NewDecoder(r.Body).Decode(&req)

    // Read the trusted user ID FROM THE CONTEXT, not from req.
    // The auth middleware put it there after verifying the token.
    userID := r.Context().Value("userID").(int)
    role := r.Context().Value("role").(string)

    if role != "admin" && role != "user" {
        http.Error(w, "forbidden", http.StatusForbidden)
        return
    }

    // Persist with the SERVER-VERIFIED owner id — never the client's.
    book, _ := bookService.Create(r.Context(), req, userID)
    w.WriteHeader(http.StatusCreated) // 201
    json.NewEncoder(w).Encode(book)
}
