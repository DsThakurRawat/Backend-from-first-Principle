from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from urllib.parse import urlsplit, parse_qs

# ABSTRACTION: Handler is an Abstract Base Class. @abstractmethod
# forces every subclass to define handle(). You cannot create a
# Handler directly — it is a pure contract.
class Handler(ABC):
    @abstractmethod
    def handle(self, req: "Request") -> "Response": ...

@dataclass
class Request:
    method: str
    path: str
    params: dict = field(default_factory=dict)  # path params (:id)
    query: dict = field(default_factory=dict)   # query params (?page=2)

@dataclass
class Response:
    status: int
    body: str

# INHERITANCE: BaseHandler is a concrete parent holding shared
# behaviour (logging). Subclasses inherit and reuse _log().
class BaseHandler(Handler):
    def __init__(self, name): self._name = name   # protected by convention
    def _log(self, req): print(f"[{self._name}] {req.method} {req.path}")

# POLYMORPHISM: each subclass OVERRIDES handle() differently, yet
# the router calls them all identically — handler.handle(req).
class GetUser(BaseHandler):           # IS-A BaseHandler IS-A Handler
    def handle(self, req):
        self._log(req)              # inherited from parent
        return Response(200, f"user id = {req.params['id']}")

class ListBooks(BaseHandler):
    def handle(self, req):
        self._log(req)
        page = req.query.get("page", ["1"])[0]   # query param
        return Response(200, f"books page {page}")

# ENCAPSULATION: self.__routes is name-mangled to _Router__routes,
# so it is effectively private. The public surface is register()
# and dispatch(); the table stays hidden.
class Router:
    def __init__(self):
        self.__routes: dict[tuple[str, str], Handler] = {}

    def register(self, method, pattern, handler):
        self.__routes[(method, pattern)] = handler  # method + path key

    def dispatch(self, method, url):
        parts = urlsplit(url)
        query = parse_qs(parts.query)               # ?a=1&b=2 -> dict
        for (m, pattern), handler in self.__routes.items():
            params = self.__match(pattern, parts.path)
            if m == method and params is not None:
                return handler.handle(
                    Request(method, parts.path, params, query))  # polymorphic
        return Response(404, "route not found")       # catch-all

    @staticmethod
    def __match(pattern, path):
        p = pattern.strip("/").split("/")
        q = path.strip("/").split("/")
        if len(p) != len(q): return None
        params = {}
        for seg, val in zip(p, q):
            if seg.startswith(":"):       # dynamic segment
                params[seg[1:]] = val    # bind :id -> "123"
            elif seg != val:            # static must match exactly
                return None
        return params

if __name__ == "__main__":
    r = Router()
    r.register("GET", "/api/users/:id", GetUser("users"))
    r.register("GET", "/api/books",     ListBooks("books"))
    print(r.dispatch("GET", "/api/users/123").body)   # user id = 123
    print(r.dispatch("GET", "/api/books?page=2").body) # books page 2
