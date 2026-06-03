func handleGetUser(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")

    // This BLOCKS the goroutine — but not the OS thread.
    // The Go scheduler parks this goroutine and runs another.
    user, err := db.QueryRow(
        "SELECT name, email FROM users WHERE id = $1",
        userID,
    )
    if err != nil {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }

    // Goroutine resumes here after DB responds
    json.NewEncoder(w).Encode(user)
}
