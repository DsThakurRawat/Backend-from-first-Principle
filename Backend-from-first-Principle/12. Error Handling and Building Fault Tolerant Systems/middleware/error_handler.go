package middleware

import (
    "encoding/json"
    "errors"
    "log/slog"
    "net/http"

    "github.com/jackc/pgx/v5/pgconn"
    apperr "yourapp/errors"
)

type ErrorResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

// GlobalErrorHandler wraps a handler that returns an error.
func GlobalErrorHandler(next func(http.ResponseWriter, *http.Request) error) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        err := next(w, r)
        if err == nil { return }

        var appErr *apperr.AppError

        switch {
        // Already wrapped as AppError
        case errors.As(err, &appErr):
            if appErr.Err != nil {
                slog.Error("app error", "err", appErr.Err)
            }

        // Postgres unique constraint violation → 409
        case isPgError(err, "23505"):
            appErr = apperr.Conflict("resource already exists")

        // Postgres foreign key violation → 404
        case isPgError(err, "23503"):
            appErr = apperr.NotFound("referenced resource")

        // pgx no-rows → 404
        case errors.Is(err, pgx.ErrNoRows):
            appErr = apperr.NotFound("resource")

        // Everything else → 500 (never leak internal error)
        default:
            slog.Error("unhandled error", "err", err)
            appErr = apperr.Internal(err)
        }

        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(appErr.Code)
        json.NewEncoder(w).Encode(ErrorResponse{
            Code:    appErr.Code,
            Message: appErr.Message,
            Details: appErr.Details,
        })
    }
}

func isPgError(err error, code string) bool {
    var pgErr *pgconn.PgError
    return errors.As(err, &pgErr) && pgErr.Code == code
}
