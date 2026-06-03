func RegisterOrgRoutes(mux *http.ServeMux) {
	// list + create share the collection URL, split by method
	mux.HandleFunc("GET /v1/organizations", ListOrganizations)
	mux.HandleFunc("POST /v1/organizations", CreateOrganization)

	// get-one / update / delete share /:id, split by method
	mux.HandleFunc("GET /v1/organizations/{id}", GetOrganization)
	mux.HandleFunc("PATCH /v1/organizations/{id}", UpdateOrganization)
	mux.HandleFunc("DELETE /v1/organizations/{id}", DeleteOrganization)

	// custom action: verb at the end of a specific resource
	mux.HandleFunc("POST /v1/organizations/{id}/archive", ArchiveOrganization)
}

func CreateOrganization(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name        string `json:"name"`
		Status      string `json:"status"`
		Description string `json:"description"`
	}
	json.NewDecoder(r.Body).Decode(&in)

	if in.Status == "" {
		in.Status = "active" // sane default — don't force the client to send the obvious
	}
	org := store.Insert(in.Name, in.Status, in.Description) // id, createdAt set server-side
	writeJSON(w, 201, org) // 201 Created + the new entity
}

func DeleteOrganization(w http.ResponseWriter, r *http.Request) {
	store.Delete(r.PathValue("id"))
	w.WriteHeader(204) // No Content
}

func ArchiveOrganization(w http.ResponseWriter, r *http.Request) {
	org := store.Archive(r.PathValue("id")) // flips status + cascades: projects, tasks, emails...
	writeJSON(w, 200, org) // custom action → 200, NOT 201
}
