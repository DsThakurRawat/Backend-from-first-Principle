app.put('/doc/:id', (req, res) => {
  const doc = db.get(req.params.id)
  const want = req.get('If-Match')       // the ETag the client last saw
  if (!want) {
    return res.status(400).json({ error: 'If-Match required' })
  }
  if (want !== doc.etag) {               // someone changed it first -> conflict
    return res.status(412).json({ error: 'version conflict' })  // 412
  }
  doc.apply(req.body)
  doc.etag = newETag()                   // bump the version
  db.save(doc)
  res.set('ETag', doc.etag)
  res.sendStatus(200)
})
