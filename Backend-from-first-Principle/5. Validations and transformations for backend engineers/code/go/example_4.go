package validate

import (
    "errors"
    "time"
)

type Profile struct {
    DateOfBirth string `validate:"required,datetime=2006-01-02"`
    // gte/lte cover the "430 is impossible" semantic bound
    Age int `validate:"required,gte=1,lte=120"`
}

// Type & syntax can't express "not in the future" —
// semantics need real logic against the real clock.
func (p Profile) checkSemantics() error {
    dob, err := time.Parse("2006-01-02", p.DateOfBirth)
    if err != nil {
        return errors.New("dateOfBirth: invalid date")
    }
    if dob.After(time.Now()) {
        return errors.New(
            "dateOfBirth: date of birth cannot be in the future")
    }
    return nil
}

// {"dateOfBirth":"2026-06-12"} -> cannot be in the future
// {"age":430}                  -> age: must be 120 or less
