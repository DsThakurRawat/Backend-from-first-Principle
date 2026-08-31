// res.sendFile handles Range, 206, 416 and If-Range for you,
// driven by the file's modtime and a generated ETag.
app.get('/big.zip', (req, res) => {
  res.sendFile('/srv/files/big.zip', {
    acceptRanges: true,
    headers: { 'Content-Type': 'application/zip' },
  })
})
