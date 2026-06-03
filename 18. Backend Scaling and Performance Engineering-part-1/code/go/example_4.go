func GetPostsWithAuthors(ctx context.Context, db *sql.DB) ([]PostWithAuthor, error) {
    // Query 1: fetch all posts
    posts, err := queryPosts(ctx, db)
    if err != nil {
        return nil, err
    }

    // Collect unique author IDs
    authorIDSet := make(map[int64]struct{})
    for _, p := range posts {
        authorIDSet[p.AuthorID] = struct{}{}
    }
    authorIDs := make([]int64, 0, len(authorIDSet))
    for id := range authorIDSet {
        authorIDs = append(authorIDs, id)
    }

    // Query 2: fetch ALL authors in one batch
    authors, err := queryAuthorsByIDs(ctx, db, authorIDs)
    if err != nil {
        return nil, err
    }

    // Build lookup map and merge
    authorMap := make(map[int64]Author)
    for _, a := range authors {
        authorMap[a.ID] = a
    }

    result := make([]PostWithAuthor, len(posts))
    for i, p := range posts {
        result[i] = PostWithAuthor{Post: p, Author: authorMap[p.AuthorID]}
    }
    return result, nil
}
