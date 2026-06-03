from fastapi import FastAPI, HTTPException
app = FastAPI()  # auto-returns 405 for unregistered methods, 422 on bad bodies

@app.get("/notes")               # safe, cacheable read (list)
def list_notes(done: bool | None = None, limit: int = 20): ...

@app.get("/notes/{id}")          # GET also serves HEAD automatically
def get_note(id: int):
    note = db.find(id)
    if note is None:
        raise HTTPException(404, "not found")   # 404
    return note                                  # 200

@app.post("/notes", status_code=201)            # create (server assigns id)
def create_note(note: Note): ...

@app.put("/notes/{id}")          # full replace (idempotent)
def put_note(id: int, note: Note): ...

@app.patch("/notes/{id}")        # partial update
def patch_note(id: int, patch: dict): ...

@app.delete("/notes/{id}", status_code=204)     # remove (idempotent)
def delete_note(id: int): ...
