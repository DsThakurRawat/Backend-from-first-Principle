package bank

import "fmt"

// Account acts like our C++ "Class".
// It is just a blueprint of data. No functions go inside it!
type Account struct {
	// UPPERCASE = PUBLIC. Anyone can read or change the OwnerName.
	OwnerName string  

	// LOWERCASE = PRIVATE (Unexported). Only the 'bank' package can see or touch this!
	balance   float64 
}

// NewAccount acts as our "Constructor". 
// It returns a Pointer (*) to the struct it created in memory.
func NewAccount(name string, initialBalance float64) *Account {
	if initialBalance < 0 {
		initialBalance = 0
	}
	
	// The & symbol gets the memory address of the newly created struct
	return &Account{
		OwnerName: name,
		balance:   initialBalance,
	}
}

// --- POINTER RECEIVER METHODS ---
// Notice the `(a *Account)` before the function name!
// This tells Go: "Attach this function to the Account struct."
// The '*' means we pass it by pointer, allowing us to permanently modify the balance!

func (a *Account) Deposit(amount float64) {
	if amount > 0 {
		a.balance += amount
		fmt.Printf("Deposited $%.2f. New balance: $%.2f\n", amount, a.balance)
	} else {
		fmt.Println("ERROR: Deposit must be positive!")
	}
}

func (a *Account) Withdraw(amount float64) {
	if amount > 0 && amount <= a.balance {
		a.balance -= amount
		fmt.Printf("Withdrew $%.2f. New balance: $%.2f\n", amount, a.balance)
	} else {
		fmt.Println("ERROR: Insufficient funds or invalid amount!")
	}
}

// GetBalance is a public Getter allowing read-only access to the lowercase private balance
func (a *Account) GetBalance() float64 {
	return a.balance
}
