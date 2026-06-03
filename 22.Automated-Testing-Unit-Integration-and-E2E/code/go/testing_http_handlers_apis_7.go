import (
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestCreateUser_Returns201(t *testing.T) {
    handler := NewRouter(deps)  // the REAL router + handlers (deps may use a fake repo §6)

    // Arrange: build a request and an in-memory response recorder (no network)
    body := strings.NewReader(`{"email":"a@x.com","name":"Ada"}`)
    req := httptest.NewRequest(http.MethodPost, "/api/v1/users", body)
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    // Act: drive the handler directly
    handler.ServeHTTP(rec, req)

    // Assert: on the real response — status, then body
    if rec.Code != http.StatusCreated {
        t.Fatalf("status = %d; want 201; body=%s", rec.Code, rec.Body.String())
    }
    if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "application/json") {
        t.Errorf("content-type = %q", ct)
    }
}
