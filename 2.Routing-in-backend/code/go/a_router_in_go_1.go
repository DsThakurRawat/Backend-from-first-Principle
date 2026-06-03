package main

import ("fmt"; "strings")

// ABSTRACTION: Handler is an interface — it names a capability
// ("be able to Handle a request") without saying how. Any type
// with a Handle method IS-A Handler. The router depends only on
// this contract, never on a concrete type.
type Handler interface {
    Handle(req Request) Response
}

type Request struct {
    Method string
    Path   string
    Params map[string]string // extracted path params (:id)
    Query  map[string]string // query params (?page=2)
}
type Response struct { Status int; Body string }

// ENCAPSULATION: "routes" is lowercase => unexported => private to
// the package. Outsiders cannot touch the table directly; they go
// through the methods we expose (Register / Dispatch).
type Router struct {
    routes map[string]Handler // key = "METHOD /route"
}

func NewRouter() *Router {
    return &Router{routes: make(map[string]Handler)}
}

// Register binds method + route -> handler (the dispatch table).
func (r *Router) Register(method, pattern string, h Handler) {
    r.routes[method+" "+pattern] = h // method + path = the unique key
}

// POLYMORPHISM: Dispatch calls h.Handle(req) without knowing which
// concrete type h is. Same call, different behaviour per handler.
func (r *Router) Dispatch(req Request) Response {
    for key, h := range r.routes {
        method, pattern, _ := strings.Cut(key, " ")
        if method == req.Method && match(pattern, req.Path, &req) {
            return h.Handle(req) // polymorphic dispatch
        }
    }
    return Response{404, "route not found"} // catch-all fallback
}

// match compares "/users/:id" against "/users/123", filling Params.
func match(pattern, path string, req *Request) bool {
    p, q := strings.Split(pattern, "/"), strings.Split(path, "/")
    if len(p) != len(q) { return false }
    for i := range p {
        if strings.HasPrefix(p[i], ":") { // dynamic segment
            req.Params[p[i][1:]] = q[i] // bind :id => "123"
        } else if p[i] != q[i] { // static segment must match exactly
            return false
        }
    }
    return true
}

// "INHERITANCE" via COMPOSITION: BaseHandler holds shared logic;
// concrete handlers EMBED it and reuse its methods.
type BaseHandler struct{ Name string }

func (b BaseHandler) log(req Request) {
    fmt.Printf("[%s] %s %s\n", b.Name, req.Method, req.Path)
}

// GetUser embeds BaseHandler (composition) and satisfies Handler.
type GetUser struct{ BaseHandler }
func (h GetUser) Handle(req Request) Response {
    h.log(req) // reused (inherited) behaviour
    return Response{200, "user id = " + req.Params["id"]}
}

type ListBooks struct{ BaseHandler }
func (h ListBooks) Handle(req Request) Response {
    h.log(req)
    page := req.Query["page"] // query param drives pagination
    if page == "" { page = "1" }
    return Response{200, "books page " + page}
}

func main() {
    r := NewRouter()
    r.Register("GET", "/api/users/:id", GetUser{BaseHandler{"users"}})
    r.Register("GET", "/api/books",     ListBooks{BaseHandler{"books"}})

    req := Request{Method: "GET", Path: "/api/users/123",
        Params: map[string]string{}, Query: map[string]string{}}
    fmt.Println(r.Dispatch(req).Body) // => user id = 123
}
