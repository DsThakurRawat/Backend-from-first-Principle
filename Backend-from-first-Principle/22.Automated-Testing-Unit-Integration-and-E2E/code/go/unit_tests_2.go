// The unit: pure logic, no I/O — trivially testable.
func IsStrongPassword(p string) bool {
    if len(p) < 8 { return false }
    var hasDigit, hasUpper bool
    for _, r := range p {
        if r >= '0' && r <= '9' { hasDigit = true }
        if r >= 'A' && r <= 'Z' { hasUpper = true }
    }
    return hasDigit && hasUpper
}

func TestIsStrongPassword(t *testing.T) {
    if IsStrongPassword("short1A") {            // 7 chars → too short
        t.Error("expected short password to be rejected")
    }
    if !IsStrongPassword("longEnough9") {        // meets all rules
        t.Error("expected valid password to be accepted")
    }
}

// Run:  go test ./...        (-v for verbose, -run TestIsStrong to filter)
