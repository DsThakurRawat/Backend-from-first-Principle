import http from "node:http";
import { URL } from "node:url";

// ABSTRACTION: Handler defines the common handler contract.
// Concrete handlers implement handle().
class Handler {
  handle(req) {
    throw new Error("handle() must be implemented");
  }
}

class Request {
  constructor(method, path, params = {}, query = {}) {
    this.method = method;
    this.path = path;
    this.params = params; // extracted path params (:id)
    this.query = query; // query params (?page=2)
  }
}

class Response {
  constructor(status, body) {
    this.status = status;
    this.body = body;
  }
}

// INHERITANCE: BaseHandler contains shared behaviour.
class BaseHandler extends Handler {
  constructor(name) {
    super();
    this.name = name;
  }

  log(req) {
    console.log(`[${this.name}] ${req.method} ${req.path}`);
  }
}

// POLYMORPHISM: GetUser overrides handle() differently.
class GetUser extends BaseHandler {
  handle(req) {
    this.log(req);
    return new Response(200, `user id = ${req.params.id}`);
  }
}

class ListBooks extends BaseHandler {
  handle(req) {
    this.log(req);

    const page = req.query.page || "1";

    return new Response(200, `books page ${page}`);
  }
}

// ENCAPSULATION: routes stores the dispatch table.
// Public surface is register() and dispatch().
class Router {
  constructor() {
    this.routes = new Map();
  }

  // Register binds method + route -> handler.
  register(method, pattern, handler) {
    this.routes.set(`${method} ${pattern}`, handler);
  }

  // POLYMORPHISM: dispatch calls handler.handle()
  // without knowing which concrete handler it is.
dispatch(method, url) {
try {
const parsed = new URL(url, "http://localhost");
for (const [key, handler] of this.routes) {
const [routeMethod, pattern] = key.split(" ");
if (routeMethod !== method) continue;
const params = this.match(pattern, parsed.pathname);
if (params !== null) {
const query = Object.fromEntries(parsed.searchParams);
return handler.handle(
new Request(method, parsed.pathname, params, query),
);
}
// catch-all fallback
return new Response(404, "route not found");
} catch (error) {
return new Response(400, "bad request");
}


  // match compares "/users/:id" against "/users/123",
  // filling params.
  match(pattern, path) {
    const p = pattern.split("/").filter(Boolean);
    const q = path.split("/").filter(Boolean);

    if (p.length !== q.length) return null;

    const params = {};

    for (let i = 0; i < p.length; i++) {
      if (p[i].startsWith(":")) {
        params[p[i].slice(1)] = q[i];
      } else if (p[i] !== q[i]) {
        return null;
      }
    }

    return params;
  }
}

// MAIN
const r = new Router();

r.register("GET", "/api/users/:id", new GetUser("users"));

r.register("GET", "/api/books", new ListBooks("books"));

// HTTP SERVER
const server = http.createServer((req, res) => {
try {
const response = r.dispatch(req.method, req.url);
res.writeHead(response.status, {
"Content-Type": "text/plain",
});
res.end(response.body);
} catch (error) {
res.writeHead(500, {
"Content-Type": "text/plain",
});
res.end("Internal Server Error");
}
});


server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
