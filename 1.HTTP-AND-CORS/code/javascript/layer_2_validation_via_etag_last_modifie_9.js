import { createHash } from 'node:crypto'

app.get('/resource', (req, res) => {
  const body = loadResource()
  const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 16)}"`

  if (req.get('If-None-Match') === etag) {  // client already has this exact version
    return res.status(304).end()            // 304, no body, payload saved
  }
  res.set('ETag', etag)
  res.set('Cache-Control', 'max-age=10')
  res.send(body)                            // 200 + body
})
