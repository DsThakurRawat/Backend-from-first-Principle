import express, { Request, Response } from 'express'

interface Note {
  id: number
  title: string
  done: boolean
}

const app = express()
app.use(express.json())            // parses the body; malformed JSON -> 400 automatically

app.post('/api/v1/notes', (req: Request, res: Response<Note | { error: string }>) => {
  const { title, done = false } = req.body ?? {}
  if (typeof title !== 'string') {
    return res.status(400).json({ error: 'invalid JSON' })
  }
  res.set('Content-Type', 'application/json')  // 1. headers FIRST
  res.status(201)                              // 2. status
  res.json({ id: 42, title, done })            // 3. body LAST
})

app.listen(8080)
