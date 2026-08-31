app.get('/users/:id', (req, res) => {
  if (!req.get('Authorization')) {
    return res.status(401).json({ error: 'login required' })  // 401: who are you?
  }
  const user = db.find(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'no such user' })     // 404
  }
  if (!user.visibleTo(req)) {
    return res.status(403).json({ error: 'forbidden' })         // 403: not allowed
  }
  res.json(user)                                                // 200
})
