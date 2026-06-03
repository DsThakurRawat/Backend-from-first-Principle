package validate

import (
    "errors"
    "net/url"
    "strconv"
)

type Pagination struct {
    Page  int
    Limit int
}

// Query params are ALWAYS strings, so we must CAST
// (transform) before we can VALIDATE the numbers.
func parsePagination(q url.Values) (*Pagination, error) {
    // TRANSFORM: force the string "2" into the int 2
    page, err := strconv.Atoi(q.Get("page"))
    if err != nil {
        return nil, errors.New("page: must be a number")
    }
    limit, err := strconv.Atoi(q.Get("limit"))
    if err != nil {
        return nil, errors.New("limit: must be a number")
    }

    // VALIDATE the now-numeric values
    if page <= 0 || page >= 500 {
        return nil, errors.New("page: must be 1..499")
    }
    if limit <= 0 || limit >= 10000 {
        return nil, errors.New("limit: must be 1..9999")
    }
    return &Pagination{Page: page, Limit: limit}, nil
}
