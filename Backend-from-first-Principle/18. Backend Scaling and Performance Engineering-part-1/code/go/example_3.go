import (
    "net/http"
    _ "net/http/pprof"  // side-effect import: registers /debug/pprof/
)

func main() {
    // Your normal app setup...
    // pprof endpoints are now accessible at /debug/pprof/
    // Collect a 30-second CPU profile:
    //   go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
    //   (pprof) web   ← opens flame graph in browser
    http.ListenAndServe(":6060", nil)
}
