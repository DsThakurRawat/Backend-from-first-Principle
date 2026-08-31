import https from 'node:https'
import { readFileSync } from 'node:fs'

// Serve HTTPS directly with a certificate + private-key pair.
https.createServer({
  cert: readFileSync('server.crt'),
  key: readFileSync('server.key'),
}, app).listen(443)

// Production note: usually you terminate TLS at a proxy/LB and run plain HTTP behind it.
