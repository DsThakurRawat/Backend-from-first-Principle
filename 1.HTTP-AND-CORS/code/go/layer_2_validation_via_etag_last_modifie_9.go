func getResource(w http.ResponseWriter, r *http.Request) {
    body := loadResource()
    sum := sha256.Sum256(body)
    etag := `"` + hex.EncodeToString(sum[:8]) + `"`  // fingerprint of the content

    if r.Header.Get("If-None-Match") == etag {  // client already has this exact version
        w.WriteHeader(http.StatusNotModified)   // 304, no body — payload saved
        return
    }
    w.Header().Set("ETag", etag)
    w.Header().Set("Cache-Control", "max-age=10")
    w.Write(body)                               // 200 + body
}
