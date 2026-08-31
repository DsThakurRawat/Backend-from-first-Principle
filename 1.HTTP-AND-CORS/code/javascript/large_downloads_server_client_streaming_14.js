import multer from 'multer'
import { setTimeout as sleep } from 'node:timers/promises'

// 1. Receive a multipart upload
const upload = multer({ limits: { fileSize: 32 * 1024 * 1024 } }) // 32 MB cap

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no file' })
  }
  res.json({ received: req.file.originalname, size: req.file.size })
})

// 2. Stream a response in chunks (Server-Sent Events)
app.get('/stream', async (req, res) => {
  res.set('Content-Type', 'text/event-stream')
  res.set('Connection', 'keep-alive')
  for (let i = 0; i < 5; i++) {
    res.write(`data: chunk ${i}\n\n`) // each write is flushed to the client
    await sleep(1000)
  }
  res.end()
})
