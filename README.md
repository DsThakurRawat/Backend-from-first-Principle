# Backend from First Principles

Welcome to the **Backend from First Principles** documentation repository! 

This repository contains a comprehensive collection of notes, code snippets, and explanations covering fundamental and advanced concepts in backend engineering. The goal of this series is to break down complex backend topics into understandable, foundational principles.

## Table of Contents

The documentation is organized into the following topics:

1. **HTTP and CORS** - Understanding the web's foundational protocol and Cross-Origin Resource Sharing.
2. **Routing in Backend** - How requests are directed to the appropriate handlers.
3. **Serialization and Deserialization** - Converting data structures to/from formats like JSON and Protobuf.
4. **Authentication and Authorization** - Securing applications and managing user access.
5. **Validations and Transformations** - Ensuring data integrity and sanitization.
6. **Controllers, Services, Repositories, and Middlewares** - Exploring the layered architectural pattern and request context.
7. **API Design (REST API)** - Best practices for designing intuitive and scalable RESTful APIs.
8. **Databases** - Core concepts of database integration in backend systems.
9. **Caching** - The secret behind blazingly fast applications (Redis, Memcached, etc.).
10. **Task Queues and Background Jobs** - Managing asynchronous workloads.
11. **Full-Text Search** - Building fast search functionality using Elasticsearch.
12. **Error Handling and Fault-Tolerant Systems** - Building resilient applications that handle failures gracefully.
13. **gRPC and Inter-Service Communication** - Efficient communication protocols for microservices.
14. **Production-Grade Configuration Management** - Managing environment variables and configurations securely.
15. **Logging, Monitoring, and Observability** - Keeping track of system health and debugging issues in production.
16. **Graceful Shutdown** - Safely terminating applications without losing data or interrupting requests.
17. **Backend Security** - Everything you need to know to secure your backend (SQL injection, XSS, CSRF, etc.).
18. **Backend Scaling and Performance Engineering (Part 1)** - Strategies for scaling applications vertically and horizontally.
19. **Backend Scaling and Performance Engineering (Part 2)** - Advanced scaling techniques.
20. **Concurrency & Parallelism** - Understanding IO-bound vs CPU-bound tasks and how to optimize them.
21. **Containerization, Deployment, Docker, Kubernetes, and CI/CD** - Packaging and shipping applications consistently.
22. **Automated Testing** - Writing effective Unit, Integration, and End-to-End (E2E) tests.
23. **Message Brokers and Event Streaming** - Using tools like Kafka for event-driven architectures.
24. **WebSockets and Real-Time Communication** - Building real-time features using WebSockets.

## Getting Started

Feel free to browse through the directories to explore specific topics. Each directory contains detailed markdown notes, code examples, and practical implementations.

## Contributing & Community

**Backend from First Principles** is created and maintained by **[@DsThakurRawat](https://github.com/DsThakurRawat)** as an open engineering reference for everyone.

Contributions are warmly welcomed! You can help by:
- Adding code implementations in other languages (Rust, Java, C++, etc.)
- Improving explanations, adding architectural diagrams, or clarifying edge cases
- Fixing typos, broken links, or syntax issues

Feel free to open an **[Issue](https://github.com/DsThakurRawat/Backend-from-first-Principle/issues)** or submit a **[Pull Request](https://github.com/DsThakurRawat/Backend-from-first-Principle/pulls)**!

### Code Examples & Language Support

Chapters that ship runnable code cover **Go** and **Python**. **JavaScript** and **TypeScript**
(Node 20+) are being added chapter by chapter, starting with Chapter 1; the JS/TS examples use
Express, and Vitest / `node:test` in the testing chapter.

Each chapter directory holds two things:

```
<chapter>/
  html_notes/notes.html    # the chapter itself, including its code blocks
  code/<language>/         # the same snippets extracted as standalone files
```

The panel in the notes and its file under `code/<language>/` hold the **same** snippet, and the
two must be kept in sync. A snippet is deliberately an excerpt, not a whole program: it shows
the one idea under discussion, exactly as the Go and Python versions do.

**How the chapters present multiple languages.** There is no single house style — the chapters
were written at different times — so match whatever the block you are extending already uses:

| Presentation | Chapters | Markup |
|---|---|---|
| Tabbed panels | 1, 13, 21, 22, 23, 24 | `.codeblock[data-cb]` + `.code-panel[data-panel]` |
| Tabbed, hand-highlighted | 6 | `<pre data-group="gN" data-lang="…">` + `<span class="k\|c\|s\|f\|n">` |
| Tabbed, page-local highlighter | 7, 8 | `<pre class="code-body" data-lang="…">` |
| Side-by-side grid | 4, 5 | `.codepair` / `.codeduo`, one card per language |
| Stacked, filename header | 9, 14, 16 | `.code-file` header + `<pre><code>` |
| Stacked, label span | 11, 12, 17 | `<pre><span class="lang-label">…</span>` |
| Stacked, trailing label | 10, 18, 19, 20 | `<span class="code-label">` / `<span class="lang-tag">` |
| A section per language | 2, 3 | its own `<section>`, `<h2>` and TOC entry |

**To add a language to a code block:**

1. Add the panel, card, or block in `html_notes/notes.html`, in the chapter's own idiom.
   The tabbed chapters need a matching tab button; the stacked ones read Go → Python →
   JavaScript → TypeScript, so append after the last existing language. Where a chapter's
   headings name the language ("Timing middleware in Go"), add a heading for the new one too.
   Every idiom except the tabbed and `.code-file` ones expects pre-highlighted `<span>` tokens,
   so copy the class names from the neighbouring block, they differ per chapter.
2. Save the identical snippet to `<chapter>/code/<language>/<same-basename>.<ext>`, reusing the
   basename of the Go/Python sibling so the versions of one example sort together. (Blocks that
   are shell or Dockerfile rather than source, such as chapter 21, live only in the notes.)
3. For a tabbed chapter, register the language once in the shared plumbing:
   - `assets/enhancements.js` -> add an entry to `RUNTIMES` so the panel gets a **Run** button
     ([Piston](https://github.com/engineer-man/piston) executes it; `language` and `version` must
     match a Piston runtime)
   - the chapter's `<style>` -> a `.lang-<id>` colour for the tab dot
   - chapters 7 & 8 -> add the keywords to that page's `KW` table and, if needed, its comment prefix

Please keep the new snippet a faithful translation of the existing ones: same scenario, same
teaching points, same comments, expressed idiomatically in the target language rather than
transliterated.

---

*"Learn the fundamentals, and the frameworks become obvious."*

Curated with dedication by [@DsThakurRawat](https://github.com/DsThakurRawat)
