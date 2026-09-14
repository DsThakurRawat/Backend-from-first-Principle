"""
OpenAPI Specification Demo — Code-First Approach

This FastAPI application demonstrates how the OpenAPI spec is generated
automatically from Python type annotations and route decorators.

Run:
    pip install fastapi uvicorn
    uvicorn openapi_server:app --reload --port 4000

Then visit:
    http://localhost:4000/docs        → Swagger UI (auto-generated)
    http://localhost:4000/openapi.json → The raw OpenAPI spec
"""

from typing import Optional, List
from fastapi import FastAPI, Query, Path, Header, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import threading

app = FastAPI(
    title="Bookstore API",
    description="""\
A demonstration API showing how OpenAPI specs are generated from code.

Version 1.0 provides endpoints for listing, creating, and retrieving books.

The full OpenAPI specification is available at `/openapi.json`
and rendered at `/docs`.\
""",
    version="1.0.0",
    contact={"name": "API Support", "email": "support@bookstore.example.com"},
)


# ── Schemas (Pydantic models define the OpenAPI schemas) ──────

class Book(BaseModel):
    """A book in the collection."""

    id: int
    title: str = Field(..., min_length=1, max_length=200, example="Designing Data-Intensive Applications")
    author: str = Field(..., min_length=1, example="Martin Kleppmann")
    isbn: Optional[str] = Field(None, format="isbn", example="978-1449373320")
    published_at: Optional[str] = Field(None, format="date-time", example="2017-08-04T00:00:00Z")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 42,
                "title": "Designing Data-Intensive Applications",
                "author": "Martin Kleppmann",
            }
        }


class CreateBook(BaseModel):
    """The payload needed to create a new book."""

    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1)
    isbn: Optional[str] = Field(None, format="isbn")

    class Config:
        json_schema_extra = {"example": {"title": "New Book", "author": "Author Name"}}


class Error(BaseModel):
    """A standardized error response."""

    code: int
    message: str
    details: Optional[dict] = None

    class Config:
        json_schema_extra = {"example": {"code": 404, "message": "Book not found"}}


class Pagination(BaseModel):
    """A paginated response wrapping a list of books."""

    data: List[Book]
    total: int


# ── In-memory store ──────────────────────────────────────────

_books: List[Book] = [
    Book(id=1, title="Clean Code", author="Robert C. Martin", isbn="978-0132350884"),
    Book(id=2, title="Designing Data-Intensive Applications", author="Martin Kleppmann"),
]
_next_id = 3
_lock = threading.Lock()


# ── Endpoints ────────────────────────────────────────────────
# FastAPI automatically generates the OpenAPI spec from these definitions.

@app.get("/books", response_model=Pagination, tags=["Books"])
def list_books(
    page: int = Query(1, ge=1, description="Page number", example=1),
    limit: int = Query(10, ge=1, le=100, description="Items per page", example=10),
):
    """List all books with pagination."""
    start = (page - 1) * limit
    end = start + limit
    return Pagination(data=_books[start:end], total=len(_books))


@app.get("/books/{book_id}", response_model=Book, tags=["Books"])
def get_book(book_id: int = Path(..., ge=1, description="The unique ID of the book")):
    """Retrieve a single book by ID."""
    for book in _books:
        if book.id == book_id:
            return book
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=Error(code=404, message="Book not found").model_dump())


@app.post("/books", response_model=Book, status_code=201, tags=["Books"])
def create_book(payload: CreateBook):
    """Create a new book."""
    global _next_id
    with _lock:
        new_book = Book(id=_next_id, **payload.model_dump())
        _next_id += 1
        _books.append(new_book)
    return new_book


@app.get("/health", tags=["System"])
def health():
    """Health check — public, no authentication required."""
    return {"status": "ok"}


# ── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)
