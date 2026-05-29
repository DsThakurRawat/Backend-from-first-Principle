package main

import (
	"backend/bank"
	"fmt"
)

func main() {
	// --- PART 1: ENCAPSULATION ---
	fmt.Println("=== 1. ENCAPSULATION DEMO ===")
	acc := bank.NewAccount("Divyansh", 5000)
	fmt.Println("Account created for:", acc.OwnerName)
	fmt.Printf("Initial Balance: $%.2f\n", acc.GetBalance())
	acc.Deposit(1500)
	acc.Withdraw(3000)
	fmt.Println()
}
