func ListBooksHandler(w http.ResponseWriter, r *http.Request) {
    sort := r.URL.Query().Get("sort") // "" if absent

    // VALIDATION: if present, it must be one of the allowed values.
    if sort != "" && sort != "name" && sort != "date" {
        http.Error(w, "sort must be 'name' or 'date'", http.StatusBadRequest)
        return
    }

    // TRANSFORMATION: query params are optional -> inject a default.
    if sort == "" {
        sort = "date" // downstream layers never see an empty value
    }

    books, err := bookService.ListBooks(r.Context(), sort) // delegate
    if err != nil {
        http.Error(w, "could not fetch books", http.StatusInternalServerError) // 500
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(books) // 200 with the array of books
}
