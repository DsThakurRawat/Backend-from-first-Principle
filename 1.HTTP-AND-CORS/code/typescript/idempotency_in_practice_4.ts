import { Request, Response } from 'express'

interface Charge { id: string; amount: number }

const seen = new Map<string, Charge>() // use Redis with a TTL in production

app.post('/payments', async (req: Request, res: Response) => {
  const key = req.get('Idempotency-Key')
  if (!key) {
    return res.status(400).json({ error: 'missing Idempotency-Key' })
  }
  const cached = seen.get(key)
  if (cached) {                            // replay: return the stored result
    return res.status(200).json(cached)
  }
  const result = await charge(req.body)    // the real, non-idempotent work
  seen.set(key, result)                    // remember it BEFORE responding
  res.status(201).json(result)
})
