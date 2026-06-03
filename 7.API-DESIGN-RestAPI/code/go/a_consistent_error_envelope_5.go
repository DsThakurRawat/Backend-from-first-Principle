type FieldError struct {
	Field string `json:"field"`
	Issue string `json:"issue"`
}

func writeError(w http.ResponseWriter, status int, code, msg string, details ...FieldError) {
	body := map[string]any{"error": map[string]any{
		"code":      code,
		"message":   msg,
		"details":   details,
		"requestId": requestIDFromCtx(),
	}}
	writeJSON(w, status, body) // SAME shape for every error in the whole API
}

// usage
writeError(w, 422, "validation_failed", "Some fields are invalid.",
	FieldError{"email", "must be a valid email"},
	FieldError{"age", "must be >= 0"},
)
