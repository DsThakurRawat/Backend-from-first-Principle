import http from 'node:http'

const server: http.Server = http.createServer(app)

server.headersTimeout = 2_000       // mitigates Slowloris (slow-header attacks)
server.requestTimeout = 5_000       // whole request must arrive within this
server.keepAliveTimeout = 60_000    // how long to hold an idle keep-alive conn
server.listen(8080)

// server.closeIdleConnections() // drop idle keep-alives, e.g. during shutdown
