func getUser(w http.ResponseWriter, r *http.Request) {
    if r.Header.Get("Authorization") == "" {
        http.Error(w, "login required", http.StatusUnauthorized) // 401: who are you?
        return
    }
    user, err := db.Find(r.PathValue("id"))
    if err == ErrNotFound {
        http.Error(w, "no such user", http.StatusNotFound)       // 404
        return
    }
    if !user.VisibleTo(r) {
        http.Error(w, "forbidden", http.StatusForbidden)         // 403: not allowed
        return
    }
    json.NewEncoder(w).Encode(user)                              // 200
}
