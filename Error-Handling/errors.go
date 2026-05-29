package errorhandling

// ============================================================
//  GO ERROR HANDLING — COMPLETE GUIDE
// ============================================================
//
// In C++/Java, you use try-catch-throw:
//   try {
//       riskyFunction();
//   } catch (exception& e) {
//       cout << e.what();
//   }
//
// Go does NOT have try/catch/throw/exceptions.
// Instead, Go treats errors as REGULAR VALUES.
// Functions return an error as the LAST return value.
// The caller MUST check it manually with if err != nil { ... }
//
// Why? Go's philosophy: "Errors are not exceptional. Handle them explicitly."
//
// ============================================================

import (
	"errors"
	"fmt"
	"math"
	"strconv"
)

// ============================================================
// SCENARIO 1: Basic Error Return Pattern
// ============================================================
// The #1 most common pattern in ALL of Go.
// A function returns (result, error).
// If something goes wrong → return the zero value + an error.
// If everything is fine   → return the result + nil (nil means "no error").
//
// C++ equivalent:
//   double divide(double a, double b) {
//       if (b == 0) throw runtime_error("division by zero");
//       return a / b;
//   }
//
// In Go, there is NO throw. You RETURN the error instead.
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		// fmt.Errorf creates a new error with a formatted message
		// This is like: throw runtime_error("cannot divide by zero")
		return 0, fmt.Errorf("cannot divide %.2f by zero", a)
	}
	return a / b, nil // nil = no error = everything went fine
}

// How the CALLER uses this:
//
//   result, err := errorhandling.Divide(10, 0)
//   if err != nil {           // ← ALWAYS check this!
//       fmt.Println("Error:", err)
//       return
//   }
//   fmt.Println("Result:", result)
//
// This if err != nil pattern is THE most common pattern in Go.
// You will see it EVERYWHERE — every 3-4 lines in production Go code.

// ============================================================
// SCENARIO 2: The error Interface (It's Polymorphism!)
// ============================================================
// Here's the secret: `error` is just an INTERFACE with ONE method:
//
//   type error interface {
//       Error() string
//   }
//
// Any struct that has an Error() string method IS an error.
// This is the EXACT same polymorphism you learned in geometry/payment!
//
// Shape interface   → needs Area() and Perimeter()
// error interface   → needs Error()
//
// Just like Circle satisfies Shape by having Area()/Perimeter(),
// ANY struct satisfies error by having Error().

// ============================================================
// SCENARIO 3: Custom Error Types (Your Own Error Structs)
// ============================================================
// You can create your OWN error types — just like you created
// Circle and Rectangle to satisfy the Shape interface.
//
// Why? To carry EXTRA INFORMATION about what went wrong.
// A plain string error just says "something failed".
// A custom error can tell you WHAT failed, WHY, and give you data.

// ValidationError — a custom error for invalid input
// This struct satisfies the `error` interface because it has Error() string
type ValidationError struct {
	Field   string // Which field failed validation (e.g., "email", "age")
	Message string // What went wrong (e.g., "cannot be empty")
}

// Error() makes ValidationError satisfy the `error` interface
// This is POLYMORPHISM — same as Circle.Area() satisfying Shape
func (v *ValidationError) Error() string {
	return fmt.Sprintf("validation failed on '%s': %s", v.Field, v.Message)
}

// InsufficientFundsError — another custom error with numeric data
type InsufficientFundsError struct {
	Requested float64 // How much they tried to withdraw
	Available float64 // How much they actually have
	Shortfall float64 // How much they're short by
}

// Error() makes InsufficientFundsError satisfy the `error` interface
func (e *InsufficientFundsError) Error() string {
	return fmt.Sprintf(
		"insufficient funds: requested $%.2f but only $%.2f available (short by $%.2f)",
		e.Requested, e.Available, e.Shortfall,
	)
}

// WithdrawFromAccount demonstrates returning a CUSTOM error type
// instead of a plain string error.
//
// The caller can then inspect the error to get detailed info
// (like how much money they're short by).
func WithdrawFromAccount(balance, amount float64) (float64, error) {
	if amount <= 0 {
		// Return a ValidationError — caller can inspect Field and Message
		return balance, &ValidationError{
			Field:   "amount",
			Message: "withdrawal amount must be positive",
		}
	}
	if amount > balance {
		// Return an InsufficientFundsError — caller can inspect exact numbers
		return balance, &InsufficientFundsError{
			Requested: amount,
			Available: balance,
			Shortfall: amount - balance,
		}
	}
	return balance - amount, nil // Success — no error
}

// ============================================================
// SCENARIO 4: Sentinel Errors (Pre-defined Error Constants)
// ============================================================
// Sometimes you define errors as PACKAGE-LEVEL variables.
// These are called "sentinel errors" — they act as known error markers.
//
// You compare against them using errors.Is()
//
// Convention: sentinel errors start with "Err" prefix.
//
// Real-world examples from Go's standard library:
//   io.EOF          — end of file reached
//   sql.ErrNoRows   — query returned no results
//   os.ErrNotExist  — file doesn't exist

// Define sentinel errors for our package
var (
	ErrNotFound     = errors.New("item not found")         // like a 404
	ErrUnauthorized = errors.New("unauthorized access")    // like a 401
	ErrInternal     = errors.New("internal server error")  // like a 500
)

// FindUser demonstrates sentinel errors.
// The caller uses errors.Is() to check WHICH specific error occurred.
func FindUser(id int) (string, error) {
	if id <= 0 {
		// Return sentinel error — caller checks with errors.Is(err, ErrNotFound)
		return "", ErrNotFound
	}
	if id == 999 {
		return "", ErrUnauthorized
	}
	// Simulate finding a user
	return fmt.Sprintf("User_%d", id), nil
}

// How the CALLER uses errors.Is():
//
//   user, err := errorhandling.FindUser(-1)
//   if err != nil {
//       if errors.Is(err, errorhandling.ErrNotFound) {
//           fmt.Println("User does not exist!")  // handle 404
//       } else if errors.Is(err, errorhandling.ErrUnauthorized) {
//           fmt.Println("You don't have permission!") // handle 401
//       }
//   }

// ============================================================
// SCENARIO 5: Error Wrapping (Adding Context with %w)
// ============================================================
// In a real backend, errors pass through MULTIPLE layers:
//   HTTP Handler → Service → Repository → Database
//
// Each layer should ADD CONTEXT to the error so you know
// the full chain of what happened.
//
// Use fmt.Errorf("context: %w", originalError) to WRAP an error.
// The %w verb PRESERVES the original error inside the new one.
//
// C++ has no equivalent — this is unique to Go.

// GetUserProfile wraps errors from FindUser with extra context.
// If FindUser fails, we wrap the error with WHERE it happened.
func GetUserProfile(id int) (string, error) {
	user, err := FindUser(id)
	if err != nil {
		// Wrap the error — adds "GetUserProfile" context while keeping original error
		// The %w verb is critical — it allows errors.Is() to still work!
		return "", fmt.Errorf("GetUserProfile(id=%d): %w", id, err)
	}
	return fmt.Sprintf("Profile of %s", user), nil
}

// HandleRequest wraps AGAIN — building a full error chain.
func HandleRequest(userID int) error {
	_, err := GetUserProfile(userID)
	if err != nil {
		// Wrap AGAIN — now the error chain is:
		// "HandleRequest: GetUserProfile(id=-1): item not found"
		return fmt.Errorf("HandleRequest: %w", err)
	}
	return nil
}

// How the CALLER uses wrapped errors:
//
//   err := errorhandling.HandleRequest(-1)
//   fmt.Println(err)
//   // Output: "HandleRequest: GetUserProfile(id=-1): item not found"
//
//   // Even after wrapping, errors.Is() STILL finds the original error!
//   if errors.Is(err, errorhandling.ErrNotFound) {
//       fmt.Println("Root cause: user not found") // ✅ This works!
//   }

// ============================================================
// SCENARIO 6: errors.As() — Unwrapping to a Specific Type
// ============================================================
// errors.Is() checks if an error IS a specific sentinel value.
// errors.As() checks if an error IS a specific TYPE (struct).
//
// Use errors.As() when you need to access the custom error's FIELDS.
//
// This is like C++ dynamic_cast — casting the error to a specific type.
//
// C++ equivalent:
//   catch (InsufficientFundsError& e) {
//       cout << e.shortfall;  // access specific field
//   }

// ProcessWithdrawal demonstrates errors.As() usage.
func ProcessWithdrawal(balance, amount float64) string {
	_, err := WithdrawFromAccount(balance, amount)
	if err != nil {
		// Try to cast the error to InsufficientFundsError
		var fundsErr *InsufficientFundsError
		if errors.As(err, &fundsErr) {
			// Cast succeeded! Now we can access the struct's fields
			return fmt.Sprintf(
				"Need $%.2f more. You're short by $%.2f",
				fundsErr.Requested, fundsErr.Shortfall,
			)
		}

		// Try to cast to ValidationError
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			return fmt.Sprintf("Bad input on field '%s': %s", valErr.Field, valErr.Message)
		}

		// Unknown error type
		return fmt.Sprintf("Unknown error: %s", err)
	}
	return "Withdrawal successful!"
}

// ============================================================
// SCENARIO 7: Multiple Return Values (Go's Signature Pattern)
// ============================================================
// Go functions commonly return (value, error).
// But they can also return MULTIPLE values + error.
// This replaces try-catch for complex operations.

// ParseAndCalculate takes a string, parses it to a number,
// and returns the square root. Multiple things can go wrong.
func ParseAndCalculate(input string) (float64, error) {
	// Step 1: Parse string to number — can fail
	num, err := strconv.ParseFloat(input, 64)
	if err != nil {
		// Wrap with context — what were we trying to do?
		return 0, fmt.Errorf("parsing '%s': %w", input, err)
	}

	// Step 2: Validate the number — can fail
	if num < 0 {
		return 0, &ValidationError{
			Field:   "input",
			Message: fmt.Sprintf("cannot calculate square root of negative number %.2f", num),
		}
	}

	// Step 3: Calculate — success
	return math.Sqrt(num), nil
}

// ============================================================
// SCENARIO 8: Ignoring Errors (The _ Pattern)
// ============================================================
// Sometimes you INTENTIONALLY don't care about an error.
// Use _ (blank identifier) to discard it.
//
// ⚠️ WARNING: This is generally BAD PRACTICE in production code.
// Only do this when you TRULY don't care about failure.
//
//   result, _ := Divide(10, 3)  // ignoring the error on purpose
//
// In code reviews, this is a red flag. Always handle errors unless
// you have a very good reason not to.

// ============================================================
// SCENARIO 9: errors.Join() — Combining Multiple Errors (Go 1.20+)
// ============================================================
// When you validate multiple fields, you might have MULTIPLE errors.
// errors.Join() lets you combine them into one.

// ValidateUser checks multiple fields and returns ALL errors at once.
func ValidateUser(name string, age int, email string) error {
	var errs []error

	if name == "" {
		errs = append(errs, &ValidationError{Field: "name", Message: "cannot be empty"})
	}
	if age < 0 || age > 150 {
		errs = append(errs, &ValidationError{Field: "age", Message: "must be between 0 and 150"})
	}
	if email == "" {
		errs = append(errs, &ValidationError{Field: "email", Message: "cannot be empty"})
	}

	if len(errs) > 0 {
		return errors.Join(errs...) // Combine all errors into one
	}
	return nil // All fields are valid
}

// How the CALLER uses this:
//
//   err := errorhandling.ValidateUser("", -5, "")
//   if err != nil {
//       fmt.Println(err)
//       // Output:
//       // validation failed on 'name': cannot be empty
//       // validation failed on 'age': must be between 0 and 150
//       // validation failed on 'email': cannot be empty
//   }
