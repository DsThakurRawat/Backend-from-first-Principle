package validate

import (
    "errors"
    "regexp"
)

// optional + then 7-15 digits (country code + national no.)
var phoneRe = regexp.MustCompile(`^\+?[0-9]{7,15}$`)

type Contact struct {
    Email string `validate:"required,email"`            // local @ domain.tld
    Phone string `validate:"required"`                  // checked below
    Date  string `validate:"required,datetime=2006-01-02"` // YYYY-MM-DD
}

// checkSyntax handles the phone pattern (validator's
// built-ins cover email + date structure already).
func (c Contact) checkSyntax() error {
    if !phoneRe.MatchString(c.Phone) {
        return errors.New("phone: invalid phone number format")
    }
    return nil
}

// "randomstring"            -> email: invalid email format
// phone sent as JSON number -> received a number, want string
// "2025-13-40"              -> date: does not match YYYY-MM-DD
