package validate

import (
    "encoding/json"
    "errors"
    "net/http"
)

// *bool so we can tell "false" apart from "missing".
type TypePayload struct {
    StringField string   `json:"stringField" validate:"required"`
    NumberField float64  `json:"numberField" validate:"required"`
    // dive = recurse INTO the slice; each element required
    ArrayField  []string `json:"arrayField" validate:"required,dive,required"`
    BoolField   *bool    `json:"boolField" validate:"required"`
}

func parseTypes(r *http.Request) (*TypePayload, error) {
    var p TypePayload
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields() // reject stray keys

    // json.Decode enforces the BASE types: a string for
    // numberField / arrayField / boolField fails to unmarshal.
    if err := dec.Decode(&p); err != nil {
        return nil, errors.New("a field has the wrong data type")
    }
    // existence + recursive element check
    if err := validate.Struct(p); err != nil {
        return nil, err
    }
    return &p, nil
}

// {"numberField":"x"} -> expected number, received string
// {"arrayField":[1,2]} -> arrayField[0]: expected string
