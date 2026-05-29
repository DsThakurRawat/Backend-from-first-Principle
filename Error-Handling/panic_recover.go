package errorhandling

// ============================================================
//  PANIC, DEFER, AND RECOVER — THE EMERGENCY SYSTEM
// ============================================================
//
// Go has TWO error handling systems:
//
// 1. NORMAL errors → return (value, error) pattern  [errors.go]
//    Used for expected things that can go wrong (file not found, bad input, etc.)
//
// 2. PANIC/RECOVER → for UNEXPECTED, CATASTROPHIC failures
//    Used for bugs, programmer mistakes, things that "should never happen"
//
// Think of it like:
//   Normal error  = "The user typed a wrong password"  → handle gracefully
//   Panic         = "The database server exploded"     → crash (or recover)
//
// C++ equivalent:
//   Normal error  = returning error codes
//   Panic         = throw (unrecoverable exception)
//   Recover       = catch (catching the exception before crash)
//   Defer         = RAII / destructors (cleanup that ALWAYS runs)

import "fmt"

// ============================================================
// SCENARIO 10: defer — Guaranteed Cleanup
// ============================================================
// defer schedules a function call to run AFTER the surrounding
// function returns — no matter HOW it returns (success, error, or panic).
//
// This is like C++ destructors or Java's finally block:
//   C++ : ~FileHandler() { file.close(); }     // destructor
//   Java: finally { file.close(); }             // finally block
//   Go  : defer file.Close()                    // defer
//
// Rules of defer:
//   1. Deferred calls run when the function RETURNS (not when the scope ends)
//   2. Multiple defers execute in LIFO order (Last In, First Out) — like a stack
//   3. Arguments are evaluated IMMEDIATELY, but the call is delayed

// DemonstrateDefer shows how defer works and its execution order.
func DemonstrateDefer() {
	fmt.Println("--- defer Demo ---")

	// These deferred calls run in REVERSE order when the function returns
	defer fmt.Println("3rd defer → runs FIRST (LIFO)")  // runs 3rd → but prints 1st
	defer fmt.Println("2nd defer → runs SECOND (LIFO)") // runs 2nd
	defer fmt.Println("1st defer → runs THIRD (LIFO)")  // runs 1st → but prints 3rd

	fmt.Println("This runs normally")
	fmt.Println("This also runs normally")

	// Output order:
	// This runs normally
	// This also runs normally
	// 1st defer → runs THIRD (LIFO)
	// 2nd defer → runs SECOND (LIFO)
	// 3rd defer → runs FIRST (LIFO)
}
/*



*/

// ============================================================
// SCENARIO 11: defer for Resource Cleanup (Real-World Usage)
// ============================================================
// The #1 use case for defer: closing files, database connections,
// network connections, mutexes — anything that MUST be cleaned up.
//
// Without defer:
//   file = open("data.txt")
//   ... do stuff ...
//   if err { return }         // ← FORGOT to close file! RESOURCE LEAK!
//   ... more stuff ...
//   if err { return }         // ← FORGOT again!
//   file.close()
//
// With defer:
//   file = open("data.txt")
//   defer file.Close()        // ← Guaranteed to run, no matter what!
//   ... do stuff ...
//   if err { return }         // file.Close() still runs ✅
//   ... more stuff ...
//   if err { return }         // file.Close() still runs ✅

// SimulateFileOperation shows the real-world defer cleanup pattern
func SimulateFileOperation(filename string) error {
	fmt.Printf("Opening file: %s\n", filename)

	// In real code: file, err := os.Open(filename)
	// defer file.Close()  ← this guarantees the file is closed

	// Simulating with a deferred cleanup message
	defer fmt.Printf("Closing file: %s (defer guarantees this runs!)\n", filename)

	if filename == "" {
		return fmt.Errorf("filename cannot be empty")
		// Even though we RETURN here, the defer STILL runs!
		// The file will be closed no matter what.
	}

	fmt.Printf("Reading from file: %s\n", filename)
	fmt.Printf("Processing file: %s\n", filename)
	return nil
}

// ============================================================
// SCENARIO 12: panic — The Nuclear Option
// ============================================================
// panic() IMMEDIATELY stops the current function and starts
// unwinding the call stack. All deferred functions still run.
// If nothing catches the panic, the program CRASHES.
//
// When to use panic:
//   ✅ Programmer errors (index out of bounds, nil pointer)
//   ✅ Initialization failures (can't connect to required database)
//   ✅ "This should NEVER happen" situations
//
// When NOT to use panic:
//   ❌ Bad user input → use normal error returns
//   ❌ File not found → use normal error returns
//   ❌ Network timeout → use normal error returns
//
// Rule of thumb: If the USER caused it, return an error.
//                If the PROGRAMMER caused it, panic.

// MustParseConfig panics if config is invalid.
// Functions starting with "Must" conventionally panic on failure.
// This is a Go naming convention — "Must" means "panics if it fails".
func MustParseConfig(config string) string {
	if config == "" {
		// panic() stops everything — like throw in C++ with no catch
		panic("FATAL: configuration cannot be empty — this is a programmer error!")
	}
	return fmt.Sprintf("Parsed config: %s", config)
}

// ============================================================
// SCENARIO 13: recover — Catching a Panic
// ============================================================
// recover() catches a panic and prevents the program from crashing.
// It ONLY works inside a deferred function.
//
// Pattern:
//   defer func() {
//       if r := recover(); r != nil {
//           // Handle the panic — r contains the panic value
//       }
//   }()
//
// C++ equivalent:
//   try {
//       riskyFunction();    // might throw
//   } catch (exception& e) {
//       cout << e.what();   // caught it!
//   }
//
// ⚠️ WARNING: Don't overuse recover. It's for truly exceptional cases.
// Using recover everywhere defeats Go's explicit error handling philosophy.

// SafeExecute runs a function and recovers from any panic.
// This is useful for HTTP servers — one bad request shouldn't crash
// the entire server. The server recovers and keeps serving other requests.
func SafeExecute(fn func()) (err error) {
	defer func() {
		if r := recover(); r != nil {
			// Convert the panic value to an error
			err = fmt.Errorf("recovered from panic: %v", r)
		}
	}()

	fn() // Run the function — if it panics, recover() catches it
	return nil
}

// How the CALLER uses SafeExecute:
//
//   err := errorhandling.SafeExecute(func() {
//       // This will panic!
//       errorhandling.MustParseConfig("")
//   })
//   if err != nil {
//       fmt.Println("Caught it:", err)
//       // Output: "Caught it: recovered from panic: FATAL: configuration cannot be empty..."
//   }
//   fmt.Println("Program continues running!") // ✅ Didn't crash!

// ============================================================
// SCENARIO 14: defer + panic + recover Together
// ============================================================
// This shows the full lifecycle of how all three work together.

// DangerousOperation demonstrates the complete panic-recover cycle.
func DangerousOperation() (result string, err error) {
	// Step 1: Set up recovery FIRST (via defer)
	defer func() {
		if r := recover(); r != nil {
			// Step 3: recover() catches the panic
			// We convert the panic into a normal error
			err = fmt.Errorf("operation failed: %v", r)
			result = "fallback value"
		}
	}()

	// Step 2: Deferred cleanup ALWAYS runs (even during panic)
	defer fmt.Println("Cleanup: releasing resources...")

	fmt.Println("Starting dangerous operation...")

	// This will panic!
	data := []int{1, 2, 3}
	_ = data[10] // ← INDEX OUT OF BOUNDS — this triggers a panic

	// This line NEVER executes
	return "success", nil
}

// Execution order:
// 1. "Starting dangerous operation..."
// 2. data[10] → PANIC! (index out of bounds)
// 3. "Cleanup: releasing resources..." (defer runs during unwind)
// 4. recover() catches the panic, sets err and result
// 5. Function returns ("fallback value", error) instead of crashing

// ============================================================
// SCENARIO 15: Real-World Pattern — HTTP Server Recovery
// ============================================================
// In production servers, you wrap each request handler with
// a recovery middleware so one bad request doesn't crash everything.

// RecoveryMiddleware wraps any handler function with panic recovery.
// This is how real Go web frameworks (Gin, Echo, Chi) protect servers.
func RecoveryMiddleware(handler func(request string) string) func(request string) string {
	return func(request string) (response string) {
		defer func() {
			if r := recover(); r != nil {
				// Log the panic (in production, you'd log to a file/service)
				fmt.Printf("🔥 PANIC in handler for request '%s': %v\n", request, r)
				// Return a safe error response instead of crashing
				response = "500 Internal Server Error"
			}
		}()

		// Call the actual handler — if it panics, we recover above
		return handler(request)
	}
}

// How the CALLER uses RecoveryMiddleware:
//
//   // A handler that might panic on bad input
//   myHandler := func(req string) string {
//       if req == "" {
//           panic("empty request!")
//       }
//       return "200 OK: " + req
//   }
//
//   // Wrap it with recovery — now it's safe
//   safeHandler := errorhandling.RecoveryMiddleware(myHandler)
//
//   fmt.Println(safeHandler("hello"))  // "200 OK: hello"
//   fmt.Println(safeHandler(""))       // "500 Internal Server Error" (didn't crash!)
//   fmt.Println(safeHandler("world"))  // "200 OK: world" (server keeps running!)
