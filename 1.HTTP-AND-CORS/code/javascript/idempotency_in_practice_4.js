const seen = new Map() // key -> stored result. Use Redis with a TTL in production.

app.post('/payments', async (req, res) => {
  const key = req.get('Idempotency-Key')
  if (!key) {
    return res.status(400).json({ error: 'missing Idempotency-Key' })
  }
  if (seen.has(key)) {                     // replay: return the stored result
    return res.status(200).json(seen.get(key))
  }
  const result = await charge(req.body)    // the real, non-idempotent work
  seen.set(key, result)                    // remember it BEFORE responding
  res.status(201).json(result)
})
