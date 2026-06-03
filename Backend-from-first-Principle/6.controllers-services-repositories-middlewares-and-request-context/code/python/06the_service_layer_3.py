class BookService:
    def __init__(self, repo, mailer):
        self.repo = repo
        self.mailer = mailer

    # No request, no response, no status codes — just logic.
    def list_books(self, sort: str) -> list:
        # Orchestration: ask the repository for what it needs.
        books = self.repo.find_all_books(sort)
        # Could merge other repo calls, enrich, notify, etc.
        return books

    # A purely-logic service that never touches the DB:
    def notify_owner(self, email: str) -> None:
        self.mailer.send(email, "Your book was added")
