import cors from 'cors'

// Handles the OPTIONS preflight and all the headers for you.
app.use(cors({
  origin: 'https://example.com',   // exact origin, not *, when credentials are on
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,                   // cache the approval for 24h
}))
