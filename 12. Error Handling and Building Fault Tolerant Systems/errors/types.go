package apperr

import "net/http"

// AppError is the canonical error type for this application.
type AppError struct {
    Code    int      // HTTP status code
    Message string   // Safe, user-facing message
    Details any      // Optional: field-level errors for 400s
    Err     error    // Original error — for logging only, NEVER sent to client
}

func (e *AppError) Error() string { return e.Message }

// Constructors
func NotFound(resource string) *AppError {
    return &AppError{Code: http.StatusNotFound, Message: resource + " not found"}
}
func Conflict(msg string) *AppError {
    return &AppError{Code: http.StatusConflict, Message: msg}
}
func BadRequest(msg string, details any) *AppError {
    return &AppError{Code: http.StatusBadRequest, Message: msg, Details: details}
}
func Internal(err error) *AppError {
    return &AppError{
        Code:    http.StatusInternalServerError,
        Message: "something went wrong",  // NEVER expose err.Error() here
        Err:     err,
    }
}
