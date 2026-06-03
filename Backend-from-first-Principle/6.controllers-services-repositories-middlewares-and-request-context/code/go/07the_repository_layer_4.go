// ONE method, ONE shape of result: all books, sorted.
func (r *BookRepo) FindAllBooks(ctx context.Context, sort string) ([]Book, error) {
    // Build the query from the data the service handed down.
    query := fmt.Sprintf("SELECT id, title, author FROM books ORDER BY %s", sort)
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()

    var books []Book
    for rows.Next() {
        var b Book
        rows.Scan(&b.ID, &b.Title, &b.Author)
        books = append(books, b)
    }
    return books, nil
}

// A SEPARATE method for the single-book case. No optional toggles.
func (r *BookRepo) FindBookByID(ctx context.Context, id int) (Book, error) {
    var b Book
    err := r.db.QueryRowContext(ctx,
        "SELECT id, title, author FROM books WHERE id = $1", id).
        Scan(&b.ID, &b.Title, &b.Author)
    return b, err
}
