package validate

import "strings"

// normalize runs AFTER validation passes and BEFORE
// the data is handed to the service layer.
func (c *Contact) normalize() {
    // lowercase + trim the email
    c.Email = strings.ToLower(strings.TrimSpace(c.Email))

    // inject the leading + if it is missing
    c.Phone = strings.TrimSpace(c.Phone)
    if !strings.HasPrefix(c.Phone, "+") {
        c.Phone = "+" + c.Phone
    }
}

// "Test@TEST.com" -> "test@test.com"
// "1234567"       -> "+1234567"
