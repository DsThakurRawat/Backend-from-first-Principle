package main

// importing two packages:
// "fmt" — for printing output to the console
// "strings" — for string operations like Split, Cut, HasPrefix
import ("fmt"; "strings")

// ==================== INTERFACE (ABSTRACTION) ====================

// Handler is an INTERFACE — a contract/promise
// It says: "any type that has a method called Handle
// which takes a Request and returns a Response — IS a Handler"
// 
// The Router will ONLY talk to this interface
// It doesn't care if it's GetUser, ListBooks, or anything else
// As long as it has Handle(req Request) Response → it's a Handler
type Handler interface {
    Handle(req Request) Response
}

// ==================== DATA STRUCTURES ====================

// Request represents an incoming HTTP request from a client
// Think of it as: "what the browser/client is asking for"
type Request struct {
    Method string            // "GET", "POST", "DELETE", etc.
    Path   string            // "/api/users/123"
    Params map[string]string // path params → :id becomes {"id": "123"}
    Query  map[string]string // query params → ?page=2 becomes {"page": "2"}
}

// Response represents what the server sends back to the client
type Response struct {
    Status int    // HTTP status code → 200 (OK), 404 (Not Found), etc.
    Body   string // the actual data sent back → "user id = 123"
}

// ==================== ROUTER (ENCAPSULATION) ====================

// Router is the main brain — it stores all registered routes
// and matches incoming requests to the right handler
type Router struct {
    // "routes" is LOWERCASE → private/unexported
    // nobody outside this package can directly access or modify it
    // it's a map where:
    //   key   = "GET /api/users/:id"  (method + path combined)
    //   value = the Handler that should run for this route
    routes map[string]Handler
}

// NewRouter is a CONSTRUCTOR — it creates and returns a new Router
// We need this because the map inside must be initialized with make()
// Without make(), the map would be nil and crash on first use
//
// Returns a POINTER (*Router) so all methods work on the same Router
// instance, not a copy of it
func NewRouter() *Router {
    return &Router{routes: make(map[string]Handler)}
    //              ^^^^^^                ^^^^^^^^
    //         creates Router         initializes empty map
    //     &Router = returns pointer   so routes is ready to use
}

// ==================== REGISTER (adding routes) ====================

// Register is a METHOD on Router (notice the "(r *Router)" receiver)
// It adds a new route to the routing table
//
// Parameters:
//   method  = "GET", "POST", "DELETE", etc.
//   pattern = "/api/users/:id"  (the URL pattern to match)
//   h       = the Handler that should run when this route matches
//
// It's PUBLIC (capital R) so outside code can call r.Register(...)
func (r *Router) Register(method, pattern string, h Handler) {
    // combines method + pattern into one string as the map key
    // example: "GET" + " " + "/api/users/:id" = "GET /api/users/:id"
    // then stores the handler as the value
    r.routes[method+" "+pattern] = h
}

// ==================== DISPATCH (finding & running the right handler) ====================

// Dispatch is the CORE of routing — it receives a request and:
// 1. loops through all registered routes
// 2. finds which one matches the request's method + path
// 3. calls that handler's Handle() method
// 4. returns the response
//
// This is where POLYMORPHISM happens — h.Handle(req) could run
// GetUser.Handle() or ListBooks.Handle() depending on which handler
// was stored for that route. Same call, different behavior.
func (r *Router) Dispatch(req Request) Response {

    // loop through every registered route in the map
    // key = "GET /api/users/:id"
    // h   = the Handler stored for that route
    for key, h := range r.routes {

        // strings.Cut splits "GET /api/users/:id" into:
        //   method  = "GET"
        //   pattern = "/api/users/:id"
        //   _       = true (we ignore the boolean, just means it found " ")
        method, pattern, _ := strings.Cut(key, " ")

        // TWO conditions must be true:
        // 1. HTTP method matches (GET == GET)
        // 2. URL pattern matches the actual path (/api/users/:id matches /api/users/123)
        if method == req.Method && match(pattern, req.Path, &req) {
            // FOUND A MATCH — call the handler and return its response
            // h.Handle(req) → this is POLYMORPHISM
            // h could be GetUser, ListBooks, or any future handler
            // Go figures out which Handle() to run at runtime
            return h.Handle(req)
        }
    }

    // if NO route matched after checking all of them → 404
    // this is the CATCH-ALL fallback
    return Response{404, "route not found"}
}

// ==================== PATTERN MATCHING (the URL comparison engine) ====================

// match compares a route pattern against an actual URL path
// and extracts dynamic parameters
//
// Example:
//   pattern = "/api/users/:id"
//   path    = "/api/users/123"
//   result  = true, and req.Params["id"] = "123"
//
// This function is LOWERCASE → private. Only the Router uses it internally.
// Outsiders never call this directly.
//
// Takes a POINTER to req (*Request) because it needs to MODIFY
// req.Params — if we passed by value, changes would be lost
func match(pattern, path string, req *Request) bool {

    // Split both the pattern and actual path by "/"
    //
    // pattern "/api/users/:id" → ["", "api", "users", ":id"]
    // path    "/api/users/123" → ["", "api", "users", "123"]
    p, q := strings.Split(pattern, "/"), strings.Split(path, "/")

    // if they have different number of segments, they can't match
    // "/api/users/:id" (4 parts) won't match "/api" (2 parts)
    if len(p) != len(q) { return false }

    // compare each segment one by one
    for i := range p {

        // if segment starts with ":" → it's a DYNAMIC parameter
        // ":id" means "capture whatever is in this position"
        if strings.HasPrefix(p[i], ":") {
            // p[i] = ":id"
            // p[i][1:] = "id"  (slice off the colon)
            // q[i] = "123"     (the actual value from the URL)
            // so req.Params["id"] = "123"
            req.Params[p[i][1:]] = q[i]

        } else if p[i] != q[i] {
            // it's a STATIC segment — must match exactly
            // "api" == "api" ✅ continue
            // "users" == "books" ❌ return false, not a match
            return false
        }
    }

    // all segments matched — this route is the one!
    return true
}

// ==================== BASE HANDLER (COMPOSITION / "INHERITANCE") ====================

// BaseHandler holds shared logic that MULTIPLE handlers need
// Instead of copy-pasting the same code in every handler,
// you write it once here and EMBED it
type BaseHandler struct {
    Name string // a label for logging, like "users" or "books"
}

// log is a METHOD on BaseHandler — it prints request info
// It's LOWERCASE → private. Only used internally by handlers.
func (b BaseHandler) log(req Request) {
    // prints: [users] GET /api/users/123
    //         [books] GET /api/books
    fmt.Printf("[%s] %s %s\n", b.Name, req.Method, req.Path)
}

// ==================== CONCRETE HANDLERS ====================

// GetUser handles requests like GET /api/users/123
// It EMBEDS BaseHandler — meaning it gets BaseHandler's fields (Name)
// and methods (log) FOR FREE without rewriting them
//
// type GetUser struct{ BaseHandler }
// ↑ This is Go's version of inheritance
// In Java:   class GetUser extends BaseHandler
// In Python: class GetUser(BaseHandler)
// In Go:     just put BaseHandler inside the struct
type GetUser struct{ BaseHandler }

// Handle is the method that satisfies the Handler INTERFACE
// Because GetUser has Handle(req Request) Response,
// Go says "GetUser IS-A Handler" — it can be stored in the routes map
func (h GetUser) Handle(req Request) Response {
    // h.log(req) → this calls BaseHandler's log() method
    // GetUser didn't write log() — it got it from BaseHandler via embedding
    // This is REUSED/INHERITED behavior
    h.log(req) // prints: [users] GET /api/users/123

    // req.Params["id"] was filled by the match() function earlier
    // if path was /api/users/123, then req.Params["id"] = "123"
    return Response{200, "user id = " + req.Params["id"]}
}

// ListBooks handles requests like GET /api/books?page=2
// Also embeds BaseHandler for the same shared log() method
type ListBooks struct{ BaseHandler }

func (h ListBooks) Handle(req Request) Response {
    // same inherited log() from BaseHandler
    h.log(req) // prints: [books] GET /api/books

    // reads the "page" query parameter from the request
    // if URL was /api/books?page=3, then req.Query["page"] = "3"
    page := req.Query["page"]

    // if no page param was provided, default to page 1
    if page == "" { page = "1" }

    return Response{200, "books page " + page}
}

// ==================== MAIN (putting it all together) ====================

func main() {

    // STEP 1: Create a new Router (empty routing table)
    r := NewRouter()

    // STEP 2: Register routes — tell the router which handler
    //         should run for which method + URL pattern
    //
    // Route 1: GET /api/users/:id → handled by GetUser
    //   GetUser{BaseHandler{"users"}} creates a GetUser instance
    //   with BaseHandler inside it, Name set to "users"
    r.Register("GET", "/api/users/:id", GetUser{BaseHandler{"users"}})

    // Route 2: GET /api/books → handled by ListBooks
    //   ListBooks{BaseHandler{"books"}} creates a ListBooks instance
    //   with BaseHandler inside it, Name set to "books"
    r.Register("GET", "/api/books", ListBooks{BaseHandler{"books"}})

    // STEP 3: Simulate an incoming request
    // In real life, this comes from the browser/client
    // Here we're creating it manually for testing
    req := Request{
        Method: "GET",                    // HTTP method
        Path:   "/api/users/123",         // the URL path
        Params: map[string]string{},      // empty — will be filled by match()
        Query:  map[string]string{},      // empty — no query params for this request
    }

    // STEP 4: Dispatch the request through the router
    // Here's what happens inside:
    //   1. Router loops through registered routes
    //   2. Finds "GET /api/users/:id" matches "GET /api/users/123"
    //   3. match() extracts :id = "123" into req.Params["id"]
    //   4. Calls GetUser.Handle(req) → polymorphism
    //   5. GetUser.Handle() calls h.log(req) → prints "[users] GET /api/users/123"
    //   6. Returns Response{200, "user id = 123"}
    //   7. .Body extracts just the body string
    fmt.Println(r.Dispatch(req).Body) // prints: user id = 123
}

/*



main() creates Router
  → Register() stores routes in private map
    → Dispatch() loops through routes, calls match()
      → match() compares URL segments, extracts :id params
        → h.Handle(req) runs the right handler (polymorphism)
          → handler calls h.log() from BaseHandler (composition)
            → returns Response back to main()


*/