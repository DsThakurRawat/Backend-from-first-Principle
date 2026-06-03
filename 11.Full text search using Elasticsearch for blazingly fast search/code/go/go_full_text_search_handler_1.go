package main

import (
    "context"
    "fmt"
    "log"
    "net/http"

    "github.com/jackc/pgx/v5/pgxpool"
)

type Product struct {
    ID          int
    Name        string
    Description string
    Rank        float64
}

func searchHandler(pool *pgxpool.Pool) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        query := r.URL.Query().Get("q")
        if query == "" {
            http.Error(w, "missing query param q", http.StatusBadRequest)
            return
        }

        // plainto_tsquery converts plain text safely (no special chars needed)
        // websearch_to_tsquery also supports AND/OR/-term syntax
        sql := `
            SELECT id, name, description,
                   ts_rank(search_vec, plainto_tsquery('english', $1)) AS rank
            FROM   products
            WHERE  search_vec @@ plainto_tsquery('english', $1)
            ORDER  BY rank DESC
            LIMIT  20
        `

        rows, err := pool.Query(context.Background(), sql, query)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        defer rows.Close()

        var results []Product
        for rows.Next() {
            var p Product
            rows.Scan(&p.ID, &p.Name, &p.Description, &p.Rank)
            results = append(results, p)
        }

        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, "found %d results\n", len(results))
    }
}

func main() {
    pool, _ := pgxpool.New(context.Background(), "postgres://...")
    http.HandleFunc("/search", searchHandler(pool))
    log.Fatal(http.ListenAndServe(":8080", nil))
}
