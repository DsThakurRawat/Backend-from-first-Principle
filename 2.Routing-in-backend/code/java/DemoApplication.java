package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Map;

// ============================================================
// MAIN APPLICATION
// ============================================================

// Spring Boot entry point.
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // ========================================================
    // ABSTRACTION: Handler interface
    // ========================================================


    // In Java, an interface defines a contract. Any class that
    // implements Handler must provide the handle() method.
    //
    // You cannot instantiate an interface directly

    interface Handler {
        Response handle(Request req);
    }

    // ========================================================
    // REQUEST MODEL
    // ========================================================

    // Java record automatically provides a constructor, accessors, equals(), hashCode(), and toString().
    //
    // params = path parameters, e.g. /users/123 -> id = 123
    // query  = query parameters, e.g. /books?page=2 -> page = 2

    record Request(
            String method,
            String path,
            Map<String, String> params,
            Map<String, String> query
    ) {}

    // ========================================================
    // RESPONSE MODEL
    // ========================================================
    // This object carries the HTTP status and response content produced by a handler.

    record Response(
            int status,
            String body
    ) {}

    // ========================================================
    // INHERITANCE: BaseHandler
    // ========================================================

    // INHERITANCE:
    // BaseHandler implements Handler, meaning it agrees to follow
    // the Handler contract.
    //
    // It is abstract, so we cannot create BaseHandler directly.
    //
    // It contains shared behavior (logging) that child classes
    // can reuse instead of duplicating code.

    static abstract class BaseHandler implements Handler {

        // ENCAPSULATION:
        // private means this field can only be accessed directly
        // inside this class.
        //
        // final means its value cannot be reassigned after
        // initialization.
  
        private final String name;

        protected BaseHandler(String name) {
            this.name = name;
        }

        // Shared method inherited by all child handlers.
        // protected allows subclasses to use it.

        protected void log(Request req) {
            System.out.println(
                "[" + name + "] " +
                req.method() + " " +
                req.path()
            );
        }
    }

    // ========================================================
    // POLYMORPHISM: GetUser
    // ========================================================

    // INHERITANCE:
    // GetUser IS-A BaseHandler.
    // It automatically gets the log() method from BaseHandler.
    //
    // POLYMORPHISM:
    // GetUser provides its own implementation of handle().
    // The same handle() method name can perform different behavior
    // depending on which handler object is executing it.

    static class GetUser extends BaseHandler {

        public GetUser() {
            super("users"); // Calls the parent constructor
        }

        // @Override means we are replacing the inherited/interface
        // method implementation with our own version.

        @Override
        public Response handle(Request req) {

            // Reuse logging behavior inherited from BaseHandler.
            log(req);

            // Retrieve the dynamic path parameter.
            // For /api/users/123, id will be "123".


            String id = req.params().get("id");

            // Return a response to whoever called this handler.
            return new Response(
                200,
                "user id = " + id
            );
        }
    }

    // ========================================================
    // POLYMORPHISM: ListBooks
    // ========================================================

    // ListBooks is another child of BaseHandler.
    //
    // It inherits the SAME logging method, but implements handle()
    // differently from GetUser.
    //
    // This is polymorphism: same contract, different behavior.

    static class ListBooks extends BaseHandler {

        public ListBooks() {
            super("books");
        }

        @Override
        public Response handle(Request req) {

            // Reuse inherited logging.
            log(req);

            // Get the query parameter "page".
            //
            // If the user doesn't supply ?page=, default to "1".

            String page = req.query()
                    .getOrDefault("page", "1");

            return new Response(
                200,
                "books page " + page
            );
        }
    }

    // ========================================================
    // ROUTER: ApiController
    // ========================================================

    // @RestController:
    // Marks this class as a web controller whose methods return
    // response data instead of HTML views.
    //
    // @RequestMapping("/api"):
    // Adds a shared URL prefix to all routes in this controller.

    @RestController
    @RequestMapping("/api")
    static class ApiController {

        // ENCAPSULATION:
        // These handler references are private.
        // Other classes cannot directly access these fields.
        //
        // COMPOSITION:
        // ApiController HAS-A GetUser and HAS-A ListBooks.
        // It uses them to delegate the work rather than inheriting
        // their behavior.

        private final GetUser getUser = new GetUser();
        private final ListBooks listBooks = new ListBooks();

        // ----------------------------------------------------
        // ROUTE 1: GET /api/users/{id}
        // ----------------------------------------------------

        // @GetMapping tells Spring to route GET requests matching
        // /users/{id} to this method.
        //
        // {id} is a dynamic path parameter.
        //
        // @PathVariable extracts that value from the URL.
    
        // Spring automatically extracts the id for us.

        @GetMapping("/users/{id}")
        public ResponseEntity<Response> getUser(
                @PathVariable("id") String id) {

            // method = "GET"
            // path = "/api/users/123"
            // params = {"id": "123"}
            // query = {}

            Request req = new Request(
                "GET",
                "/api/users/" + id,
                Map.of("id", id),
                Map.of()
            );

            // POLYMORPHISM:
            // Call handle() on the GetUser object.
            // GetUser's overridden implementation executes.

            Response res = getUser.handle(req);

            // Convert our custom Response object into an actual
            // HTTP response with the corresponding status code.
            //
            // status(200) means HTTP 200 OK.
            // body(res) serializes the Response into JSON.

            return ResponseEntity
                    .status(res.status())
                    .body(res);
        }

        // ----------------------------------------------------
        // ROUTE 2: GET /api/books?page=2
        // ----------------------------------------------------

        // @GetMapping("/books"):
        // Maps GET /api/books to this method.
        //
        // @RequestParam extracts query parameters.
        //
        // defaultValue = "1" means that if page is missing,
        // Spring automatically supplies "1".
       
        @GetMapping("/books")
        public ResponseEntity<Response> getBooks(
                @RequestParam(defaultValue = "1") String page) {

            // Construct Request object.
            //
            // For /api/books?page=2:
            //
            // method = "GET"
            // path = "/api/books"
            // params = {}
            // query = {"page": "2"}

            Request req = new Request(
                "GET",
                "/api/books",
                Map.of(),
                Map.of("page", page)
            );

            // POLYMORPHISM:
            // Calls ListBooks' version of handle().
            // Even though GetUser also has handle(), its behavior
            // is different.

            Response res = listBooks.handle(req);

            // Return the HTTP response to the client.

            return ResponseEntity
                    .status(res.status())
                    .body(res);
        }
    }
}