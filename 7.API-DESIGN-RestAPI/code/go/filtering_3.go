// GET /v1/organizations?status=active&sortBy=name&sortOrder=ascending&page=1&limit=10
func ListOrganizations(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	// --- sane defaults: never crash if the client omits params ---
	page := atoiDefault(q.Get("page"), 1)
	limit := atoiDefault(q.Get("limit"), 10)
	sortBy := defaultStr(q.Get("sortBy"), "createdAt")
	sortOrder := defaultStr(q.Get("sortOrder"), "descending")

	filters := map[string]string{}
	if s := q.Get("status"); s != "" {
		filters["status"] = s // ?status=active
	}

	rows, total := store.Query(filters, sortBy, sortOrder, page, limit)
	totalPages := (total + limit - 1) / limit // ceil division

	writeJSON(w, 200, map[string]any{
		"data":       rows,
		"total":      total,
		"page":       page,
		"totalPages": totalPages,
	})
}
