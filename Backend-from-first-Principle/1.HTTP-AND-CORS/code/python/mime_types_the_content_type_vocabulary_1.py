from fastapi import FastAPI, Response, status
from pydantic import BaseModel

app = FastAPI()

class Note(BaseModel):
    title: str
    done: bool = False

@app.post("/api/v1/notes", status_code=status.HTTP_201_CREATED)
def create_note(note: Note, response: Response):
    # FastAPI parses + validates the JSON body; a malformed body -> 422 automatically.
    response.headers["Content-Type"] = "application/json"
    return {"id": 42, **note.model_dump()}

# run: uvicorn main:app --port 8080
