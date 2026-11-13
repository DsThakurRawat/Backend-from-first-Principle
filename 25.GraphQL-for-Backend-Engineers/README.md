# Chapter 25 / GraphQL: the data query language

## 01. Core principles of GraphQL

If REST is like ordering from a set menu at a restaurant, where you get the exact meal the chef designed, GraphQL is a buffet where you hand the chef a precise list of exactly what you want on your plate.

Created by Facebook in 2012 to solve mobile network inefficiencies, GraphQL is an application-layer query language and execution engine. In a REST architecture, the server defines the shape of the data returned by an endpoint. In GraphQL, the server exposes a "graph" of all available data, and the **client** dictates the exact shape of the response it needs.

### The single endpoint architecture

Unlike REST, which spreads resources across dozens of URLs (`/users`, `/users/123/posts`, `/comments`), a GraphQL API typically exposes exactly **one** endpoint (e.g., `POST /graphql`). Reads, creates, and updates all go through this single URL.

---

## 02. The problems GraphQL solves

GraphQL was built to fix two specific inefficiencies of REST APIs, especially on slow mobile networks:

### 1. Over-fetching

Imagine you are building a profile screen that only needs a user's `name` and `avatar_url`.
In REST, calling `GET /users/123` might return a large JSON object containing their address, email, preferences, and metadata. You download data you immediately discard.

GraphQL fixes this by letting you ask for exactly what you need:
`query { user(id: 123) { name avatar_url } }` returns exactly those two fields, nothing more.

### 2. Under-fetching (client-side N+1)

Imagine you need to load a user, their top 3 recent posts, and the names of the authors of the comments on those posts.
In REST, this might require:
1. `GET /users/123` (1 request)
2. `GET /users/123/posts` (1 request)
3. `GET /posts/X/comments` (3 requests, one per post)

GraphQL fetches nested relationships in a single round-trip:

```graphql
query {
  user(id: 123) {
    name
    posts(limit: 3) {
      title
      comments {
        author { name }
      }
    }
  }
}
```

---

## 03. The schema definition language (SDL)

GraphQL is strongly typed. Before a client can query anything, the server must define a rigid contract called the schema. The schema is the source of truth, which is what makes tooling like automatic documentation and autocomplete possible.

```graphql
# 1. Object Types
type User {
  id: ID!         # The '!' means this field is non-nullable (required)
  name: String!
  email: String
  posts: [Post!]! # An array of Post objects
}

type Post {
  id: ID!
  title: String!
  author: User!
}

# 2. The Root Operations
type Query {
  getUser(id: ID!): User
  allPosts: [Post!]!
}

type Mutation {
  createPost(title: String!, authorId: ID!): Post!
}
```

### The three root types

Every GraphQL schema revolves around three entry points:

1. **Query**: for reading data (idempotent, safe, comparable to HTTP GET).
2. **Mutation**: for modifying data (comparable to HTTP POST/PUT/DELETE).
3. **Subscription**: for opening long-lived connections (usually WebSockets) to stream real-time updates from the server to the client.

---

## 04. Under the hood: resolvers

If the schema is the blueprint, resolvers are the construction workers.

When a query arrives, GraphQL parses it into an abstract syntax tree (AST), then walks down that tree field by field, invoking a function for each field to fetch the actual data. Those functions are resolvers.

```javascript
// A simple NodeJS / Apollo resolver map
const resolvers = {
  Query: {
    // Fetches the root user
    getUser: async (parent, args, context) => {
      return await db.users.findById(args.id);
    }
  },
  User: {
    // Fetches posts specifically for a given user
    posts: async (parent, args, context) => {
      // 'parent' contains the resolved User object from the step above
      return await db.posts.findByAuthorId(parent.id);
    }
  }
};
```

---

## 05. The backend nightmare: the N+1 problem

Because GraphQL resolves data field by field, a deeply nested query can trigger an avalanche of database queries. This is the most common backend pitfall in GraphQL.

If a client queries a list of 50 posts and asks for the author of each:

```graphql
query {
  allPosts {
    title
    author { name }
  }
}
```

What the GraphQL engine does:

1. Resolves `allPosts` → runs 1 DB query: `SELECT * FROM posts`. Returns 50 posts.
2. Resolves the `author` field for the first post → `SELECT * FROM users WHERE id = X`
3. Resolves the `author` field for the second post → `SELECT * FROM users WHERE id = Y`, and so on.

That's 51 database queries (1 for the posts plus 50 for the authors) for a single HTTP request. At any real load, this will crush your database.

### The solution: DataLoader

Backend engineers solve this with a pattern called DataLoader. DataLoader intercepts the individual resolver requests, pauses for a few milliseconds, batches all the IDs together, and fires a single database query using a SQL `IN` clause.

* Without DataLoader: 50 queries → `SELECT * FROM users WHERE id = ?`
* With DataLoader: 1 query → `SELECT * FROM users WHERE id IN (1, 2, 3... 50)`

---

## 06. The trade-offs (why REST isn't dead)

GraphQL is powerful, but it comes with real architectural trade-offs:

1. **Breaks HTTP caching.** Because almost all GraphQL requests go through `POST` to a single `/graphql` endpoint, you can't use standard HTTP caching mechanisms (CDNs, Varnish) out of the box. Caching has to happen at the application layer or on the client (e.g., Apollo Client).
2. **Security and query complexity.** Since the client dictates the query, a malicious user can request a deeply nested graph (`User -> Posts -> Comments -> Author -> Posts...`) to consume server CPU and memory as a denial-of-service attack. Backend engineers need to implement query depth limiting and query complexity analysis to prevent this.
3. **File uploads.** Uploading binary files (like images) in GraphQL is clunkier than a standard REST `multipart/form-data` request, and often requires out-of-band upload endpoints.

As a rule of thumb: use REST for simple, resource-based microservices, server-to-server communication, or public APIs where strict caching and rate-limiting matter most. Use GraphQL for complex client-facing applications (web/mobile) where UI data needs are highly relational and change often.
