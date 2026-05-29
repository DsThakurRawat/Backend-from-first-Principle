package payment

import "fmt"

// ============================================================
// ABSTRACTION (Interface)
// ============================================================
// PaymentProcessor is an INTERFACE — it defines a CONTRACT.
// Any struct that has a ProcessPayment(amount float64) bool method
// automatically satisfies this interface — no "implements" keyword.
//
// This is ABSTRACTION because:
//   - The outside world only knows WHAT it can do: "process a payment"
//   - It does NOT know HOW each payment method works internally
//
// Tomorrow you can add Bitcoin, ApplePay, BankTransfer — and the
// Checkout function below will work with ALL of them without changing.
//
// C++ equivalent:
//   class PaymentProcessor {
//       public:
//           virtual bool ProcessPayment(double amount) = 0; // pure virtual
//   };
type PaymentProcessor interface {
	ProcessPayment(amount float64) bool
}

// ============================================================
// ENCAPSULATION (Letter Casing = Access Control)
// ============================================================
// CreditCard struct — notice "CardNumber" starts with UPPERCASE 'C'
// Uppercase = EXPORTED (Public) = anyone importing this package can access it
//
// From main.go:  cc.CardNumber  ✅ Works — it's public
//
// ⚠️ In a real-world app, you'd want to HIDE sensitive data:
//    cardNumber string   (lowercase = Private — no one can read this directly)
//
// C++ equivalent:
//   class CreditCard {
//       public:
//           string CardNumber;  // public because uppercase in Go
//   };
type CreditCard struct {
	CardNumber string // Uppercase C = Exported (Public) — accessible from ANY package
}

// ============================================================
// POLYMORPHISM (CreditCard's own version of ProcessPayment)
// ============================================================
// By defining ProcessPayment() on CreditCard, it automatically
// satisfies the PaymentProcessor interface (Duck Typing).
// This is CreditCard's OWN implementation — PayPal will have a DIFFERENT one.
// Same method name, different behavior = Polymorphism.
func (cc *CreditCard) ProcessPayment(amount float64) bool {
	fmt.Printf("Processing $ %.2f via Credit Card (%s)...\n", amount, cc.CardNumber)
	return true
}

// ============================================================
// ENCAPSULATION (Another struct with public fields)
// ============================================================
// PayPal struct — "Email" starts with UPPERCASE 'E'
// Uppercase = EXPORTED (Public)
//
// From main.go:  pp.Email  ✅ Works — it's public
type PayPal struct {
	Email string // Uppercase E = Exported (Public) — accessible from ANY package
}

// ============================================================
// POLYMORPHISM (PayPal's own version of ProcessPayment)
// ============================================================
// PayPal has its OWN ProcessPayment() — different behavior than CreditCard's.
// CreditCard prints card number, PayPal prints email.
// Same method name "ProcessPayment()", completely different logic.
// That's the "many forms" in polymorphism.
func (p *PayPal) ProcessPayment(amount float64) bool {
	fmt.Printf("Processing $ %.2f via PayPal (%s)...\n", amount, p.Email)
	return true
}

// ============================================================
// POLYMORPHISM IN ACTION (The magic function)
// ============================================================
// Checkout accepts the INTERFACE type "PaymentProcessor" — not CreditCard, not PayPal.
// It doesn't care WHAT payment method you pass in, as long as it can ProcessPayment().
//
// Pass a CreditCard → calls CreditCard's ProcessPayment()
// Pass a PayPal     → calls PayPal's ProcessPayment()
// Pass a Bitcoin (future) → would call Bitcoin's ProcessPayment()
//
// ONE function, MANY behaviors = Polymorphism
//
// This is also ABSTRACTION in action:
//   Checkout knows WHAT it needs (something that processes payments)
//   but has ZERO knowledge of HOW each method works internally.
//
// C++ equivalent:
//   void Checkout(double cartTotal, PaymentProcessor* method) {
//       method->ProcessPayment(cartTotal);
//   }
func Checkout(cartTotal float64, method PaymentProcessor) {
	fmt.Println("--- Starting Checkout ---")
	if method.ProcessPayment(cartTotal) {
		fmt.Println("Transaction Successful!")
	} else {
		fmt.Println("Transaction Failed.")
	}
}