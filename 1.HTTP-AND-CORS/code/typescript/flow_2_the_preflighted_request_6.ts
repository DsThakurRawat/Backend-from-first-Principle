import cors, { CorsOptions } from 'cors'

// Handles the OPTIONS preflight and all the headers for you.
const options: CorsOptions = {
  origin: 'https://example.com',   // exact origin, not *, when credentials are on
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,                   // cache the approval for 24h
}

app.use(cors(options))
