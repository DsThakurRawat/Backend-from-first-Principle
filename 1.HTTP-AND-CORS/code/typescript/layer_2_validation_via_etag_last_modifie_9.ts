import { createHash } from 'node:crypto'
import { Request, Response } from 'express'

app.get('/resource', (req: Request, res: Response) => {
  const body: Buffer = loadResource()
  const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 16)}"`

  if (req.get('If-None-Match') === etag) {  // client already has this exact version
    res.status(304).end()                   // 304, no body, payload saved
    return
  }
  res.set('ETag', etag)
  res.set('Cache-Control', 'max-age=10')
  res.send(body)                            // 200 + body
})
