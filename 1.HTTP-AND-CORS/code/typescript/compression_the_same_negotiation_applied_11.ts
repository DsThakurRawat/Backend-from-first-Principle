import compression from 'compression'
import { Request, Response } from 'express'

// gzip responses for capable clients, but only above a size threshold
// (compressing tiny payloads costs more CPU than it saves bytes).
// The middleware negotiates Accept-Encoding and sets Vary: Accept-Encoding for you.
app.use(compression({ threshold: 1000 }))

app.get('/greeting', (req: Request, res: Response) => {
  const lang: 'en' | 'es' =
    (req.get('Accept-Language') ?? 'en').startsWith('es') ? 'es' : 'en'
  res.json({ en: 'Hello', es: 'Hola' }[lang])
})
