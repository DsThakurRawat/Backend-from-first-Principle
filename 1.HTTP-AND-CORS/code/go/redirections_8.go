// Permanent move that must keep the method/body -> 308
func oldRoute(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/person/"+r.PathValue("id"), http.StatusPermanentRedirect) // 308
}

// Post/Redirect/Get -> 303 so a browser refresh won't re-POST the form
func submitForm(w http.ResponseWriter, r *http.Request) {
    id := save(r)
    http.Redirect(w, r, "/results/"+id, http.StatusSeeOther) // 303 (forces GET)
}
