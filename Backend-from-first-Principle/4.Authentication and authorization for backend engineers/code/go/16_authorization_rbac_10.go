// RequireRole runs AFTER an auth middleware that set "user".
func RequireRole(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
    allowed := map[string]bool{}
    for _, r := range roles {
        allowed[r] = true
    }
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            u, _ := r.Context().Value("user").(User)
            if !allowed[u.Role] {
                http.Error(w, "forbidden", http.StatusForbidden) // 403
                return
            }
            next(w, r)
        }
    }
}

// usage: only admins reach the dead-zone handler
// mux.Handle("/admin/deadzone",
//     RequireJWT(RequireRole("admin")(deadZoneHandler)))
