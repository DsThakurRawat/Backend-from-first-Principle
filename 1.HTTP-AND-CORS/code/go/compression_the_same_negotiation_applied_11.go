func handler(w http.ResponseWriter, r *http.Request) {
    body, _ := json.Marshal(bigPayload)
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Vary", "Accept-Encoding")   // tell caches the body varies by encoding
    if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
        w.Header().Set("Content-Encoding", "gzip")
        gz := gzip.NewWriter(w)
        defer gz.Close()
        gz.Write(body)
        return
    }
    w.Write(body) // uncompressed fallback for clients that can't decode gzip
}
