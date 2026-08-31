import compression from 'compression'

// gzip responses for capable clients, but only above a size threshold
// (compressing tiny payloads costs more CPU than it saves bytes).
// The middleware negotiates Accept-Encoding and sets Vary: Accept-Encoding for you.
app.use(compression({ threshold: 1000 }))

app.get('/greeting', (req, res) => {
  const lang = (req.get('Accept-Language') ?? 'en').startsWith('es') ? 'es' : 'en'
  res.json({ en: 'Hello', es: 'Hola' }[lang])
})
