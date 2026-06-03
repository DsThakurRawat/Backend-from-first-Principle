// http.ServeContent handles Range, 206, 416 and If-Range for you,
// driven by the file's modtime and an optional ETag.
func download(w http.ResponseWriter, r *http.Request) {
    f, _ := os.Open("big.zip")
    defer f.Close()
    info, _ := f.Stat()
    http.ServeContent(w, r, "big.zip", info.ModTime(), f)
}
