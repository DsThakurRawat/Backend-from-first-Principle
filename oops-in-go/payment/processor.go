package payment

import "fmt"

// PaymentProcessor is our Interface (Abstraction).
// Any struct that implements a 'ProcessPayment(amount float64) bool' method
// automatically satisfies this interface.
type PaymentProcessor interface {
	ProcessPayment(amount float64) bool
}

// CreditCard is a concrete struct implementing the interface.
type CreditCard struct {
	CardNumber string
	ExpiryDate string
}

// ProcessPayment implements the PaymentProcessor interface for CreditCard.
func (cc *CreditCard) ProcessPayment(amount float64) bool {
	fmt.Printf("Processing Credit Card payment of $%.2f using card: XXXX-XXXX-XXXX-%s\n", amount, cc.CardNumber[len(cc.CardNumber)-4:])
	return true
}

// PayPal is another concrete struct implementing the interface.
type PayPal struct {
	Email string
}

// ProcessPayment implements the PaymentProcessor interface for PayPal.
func (p *PayPal) ProcessPayment(amount float64) bool {
	fmt.Printf("Processing PayPal payment of $%.2f using account: %s\n", amount, p.Email)
	return true
}

// ExecuteTransaction is a polymorphic function.
// It accepts any type that implements the PaymentProcessor interface.
func ExecuteTransaction(processor PaymentProcessor, amount float64) {
	fmt.Println("--- Starting Transaction ---")
	success := processor.ProcessPayment(amount)
	if success {
		fmt.Println("Transaction Completed Successfully!")
	} else {
		fmt.Println("Transaction Failed!")
	}
	fmt.Println()
}
