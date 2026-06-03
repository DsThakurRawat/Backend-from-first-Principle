// 1. Receive a multipart upload
func upload(w http.ResponseWriter, r *http.Request) {
    r.ParseMultipartForm(32 << 20) // up to 32 MB in memory, overflow spills to disk
    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "no file", http.StatusBadRequest)
        return
    }
    defer file.Close()
    fmt.Fprintf(w, "received %s", header.Filename)
}

// 2. Stream a response in chunks (Server-Sent Events)
func stream(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Connection", "keep-alive")
    flusher := w.(http.Flusher) // Flush() pushes each chunk to the client immediately
    for i := 0; i < 5; i++ {
        fmt.Fprintf(w, "data: chunk %d\n\n", i)
        flusher.Flush()
        time.Sleep(time.Second)
    }
}
