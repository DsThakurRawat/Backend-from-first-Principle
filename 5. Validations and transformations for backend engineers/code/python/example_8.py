from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI()


# ---- schema (the gate) ----
class CreateBook(BaseModel):
    name: str = Field(min_length=5, max_length=100)

    @field_validator("name")
    @classmethod
    def trim(cls, v: str) -> str:
        return v.strip()          # transform / normalize


class Book(BaseModel):
    id: int
    name: str


# ---- service + repository (sketched) ----
def create_book(name: str) -> Book:
    # service logic … repository INSERT … then:
    return Book(id=1, name=name)


# ---- CONTROLLER ----
# FastAPI runs the CreateBook schema (the GATE) BEFORE
# this function body. A bad payload never enters the
# function — the client gets an automatic 422/400, so
# the DB is never touched and no client mistake leaks
# out as a confusing 500.
@app.post("/api/books", status_code=201)
def create_book_endpoint(body: CreateBook) -> Book:
    # validation already passed — straight to logic
    try:
        return create_book(body.name)  # service → repo
    except Exception:
        raise HTTPException(
            status_code=500, detail="could not create book")


# run:  uvicorn main:app --reload
