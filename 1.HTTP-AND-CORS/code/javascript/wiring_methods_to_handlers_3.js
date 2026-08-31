const app = express()

// Express matches method + path. An unmatched method falls through to the 404
// handler; add an `app.all` catch-all per route to answer 405 Method Not Allowed.
app.get('/notes', listNotes)          // safe, cacheable read
app.get('/notes/:id', getNote)        // GET also serves HEAD automatically
app.post('/notes', createNote)        // create (server assigns id)
app.put('/notes/:id', putNote)        // full replace (idempotent)
app.patch('/notes/:id', patchNote)    // partial update
app.delete('/notes/:id', deleteNote)  // remove (idempotent)

function getNote(req, res) {
  const { id } = req.params           // built-in path params
  const note = db.find(id)
  if (!note) return res.status(404).json({ error: 'not found' }) // 404
  res.set('Content-Type', 'application/json')
  res.json(note)                                                 // 200
}
