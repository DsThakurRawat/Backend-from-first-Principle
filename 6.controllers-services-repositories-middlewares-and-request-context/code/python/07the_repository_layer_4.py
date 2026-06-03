class BookRepo:
    def __init__(self, db):
        self.db = db

    # ONE method, ONE result shape: all books, sorted.
    def find_all_books(self, sort: str) -> list:
        # Build the query from data passed down by the service.
        query = f"SELECT id, title, author FROM books ORDER BY {sort}"
        cur = self.db.execute(query)
        return [dict(row) for row in cur.fetchall()]

    # SEPARATE method for one book. No optional toggle parameter.
    def find_book_by_id(self, book_id: int) -> dict:
        cur = self.db.execute(
            "SELECT id, title, author FROM books WHERE id = ?", (book_id,))
        return dict(cur.fetchone())
