package books

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strings"

    "github.com/go-playground/validator/v10"
)

// one shared, reusable validator (the pipeline engine)
var validate = validator.New()

// CreateBook is the SCHEMA. The tags declare every rule:
//   required      -> existence check
//   the Go type   -> type check (string)
//   min=5,max=100 -> constraint check
type CreateBook struct {
    Name string `json:"name" validate:"required,min=5,max=100"`
}

// runPipeline decodes then validates; returns 400-ready messages.
func runPipeline(r *http.Request) (*CreateBook, []string) {
    var body CreateBook

    // 1. TYPE CHECK during decode: a JSON number for `name`
    //    cannot unmarshal into a Go string -> caught here.
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        return nil, []string{"name: expected a string"}
    }
    // 2. EXISTENCE + CONSTRAINT checks in one pass.
    if err := validate.Struct(body); err != nil {
        return nil, formatErrors(err)
    }
    return &body, nil
}

// formatErrors turns validator output into human messages.
func formatErrors(err error) []string {
    var msgs []string
    for _, e := range err.(validator.ValidationErrors) {
        f := strings.ToLower(e.Field())
        switch e.Tag() {
        case "required":
            msgs = append(msgs, fmt.Sprintf("%s: is required", f))
        case "min":
            msgs = append(msgs, fmt.Sprintf("%s: min %s chars", f, e.Param()))
        case "max":
            msgs = append(msgs, fmt.Sprintf("%s: max %s chars", f, e.Param()))
        default:
            msgs = append(msgs, fmt.Sprintf("%s: failed %s", f, e.Tag()))
        }
    }
    return msgs
}
