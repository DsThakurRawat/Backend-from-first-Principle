import { Request, Response } from 'express'

// Permanent move that must keep the method/body -> 308
app.all('/user/:id', (req: Request<{ id: string }>, res: Response) => {
  res.redirect(308, `/person/${req.params.id}`)
})

// Post/Redirect/Get -> 303 so a browser refresh won't re-POST the form
app.post('/submit', (req: Request, res: Response) => {
  const id = save(req.body)
  res.redirect(303, `/results/${id}`)  // 303 forces the follow-up to be a GET
})
