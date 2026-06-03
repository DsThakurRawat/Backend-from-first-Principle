func RequireRole(role string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            user, ok := r.Context().Value("user").(User)
            if !ok || user.Role != role {
                http.Error(w, "forbidden", http.StatusForbidden)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// Router setup
r.With(RequireAuth, RequireRole("admin")).
  Get("/admin/invoices", adminInvoicesHandler)
