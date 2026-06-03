srv := &http.Server{
    Addr:              ":8080",
    Handler:           mux,
    ReadTimeout:       5 * time.Second,
    WriteTimeout:      10 * time.Second,
    IdleTimeout:       60 * time.Second, // how long to hold an idle keep-alive conn
    ReadHeaderTimeout: 2 * time.Second,  // mitigates Slowloris (slow-header attacks)
}
srv.ListenAndServe()
// srv.SetKeepAlivesEnabled(false) // force Connection: close if ever needed
