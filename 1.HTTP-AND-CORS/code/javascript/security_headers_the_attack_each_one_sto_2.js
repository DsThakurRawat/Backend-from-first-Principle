function securityHeaders(req, res, next) {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.set('Content-Security-Policy', "default-src 'self'")
  res.set('X-Frame-Options', 'DENY')
  res.set('X-Content-Type-Options', 'nosniff')
  next() // headers MUST be set before the handler writes the body (see sec 3)
}

app.use(securityHeaders)
// In production `helmet()` sets these, and more, for you.
