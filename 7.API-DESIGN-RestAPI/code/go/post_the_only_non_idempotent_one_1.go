func UpdateOrganization(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	org := store.Get(id)
	if org == nil {
		writeJSON(w, 404, errBody("organization not found"))
		return
	}
	// optimistic concurrency: reject stale writes
	if m := r.Header.Get("If-Match"); m != "" && m != org.ETag {
		writeJSON(w, 412, errBody("resource changed; re-fetch and retry"))
		return
	}
	var patch map[string]any
	json.NewDecoder(r.Body).Decode(&patch) // only the fields to change
	updated := store.Patch(id, patch)        // merge, don't replace
	w.Header().Set("ETag", updated.ETag)
	writeJSON(w, 200, updated)               // 200 + updated entity
}
