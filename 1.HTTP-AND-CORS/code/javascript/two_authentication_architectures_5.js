import cookieParser from 'cookie-parser'

app.use(cookieParser())

// Set a secure session cookie after login (stateful)
app.post('/login', (req, res) => {
  const sid = newSessionID()
  sessions.set(sid, userId)          // server-side session store (use Redis)
  res.cookie('session', sid, {
    httpOnly: true,                  // JS can't read it
    secure: true,                    // HTTPS only
    sameSite: 'strict',              // CSRF defense
    maxAge: 3600 * 1000,             // Express takes milliseconds
    path: '/',
  })
  res.sendStatus(204)
})

// Bearer-token auth middleware (stateless)
function requireToken(req, res, next) {
  const auth = req.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ') || !validJWT(auth.slice(7))) {
    res.set('WWW-Authenticate', 'Bearer')
    return res.status(401).json({ error: 'unauthorized' }) // 401
  }
  next()
}

app.get('/me', requireToken, (req, res) => res.json({ ok: true }))
