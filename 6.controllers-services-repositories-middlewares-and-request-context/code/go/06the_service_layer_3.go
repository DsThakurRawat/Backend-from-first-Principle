// Notice: no http.Request, no ResponseWriter, no status codes.
// You cannot tell from this signature that it serves an API.
func (s *BookService) ListBooks(ctx context.Context, sort string) ([]Book, error) {
    // Orchestration: call the repository for the data it needs.
    books, err := s.repo.FindAllBooks(ctx, sort)
    if err != nil {
        return nil, err // bubble the error up; the handler decides the code
    }
    // Could also: enrich, merge other repo calls, send notifications...
    return books, nil
}

// A service that needs no database at all is perfectly valid:
func (s *BookService) NotifyOwner(email string) error {
    return s.mailer.Send(email, "Your book was added")
}
