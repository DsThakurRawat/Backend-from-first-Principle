func updateDoc(w http.ResponseWriter, r *http.Request) {
    doc := db.Get(r.PathValue("id"))
    want := r.Header.Get("If-Match")          // the ETag the client last saw
    if want == "" {
        http.Error(w, "If-Match required", http.StatusBadRequest)
        return
    }
    if want != doc.ETag {                     // someone changed it first -> conflict
        http.Error(w, "version conflict", http.StatusPreconditionFailed) // 412
        return
    }
    doc.Apply(r.Body)
    doc.ETag = newETag()                      // bump the version
    db.Save(doc)
    w.Header().Set("ETag", doc.ETag)
    w.WriteHeader(http.StatusOK)
}
