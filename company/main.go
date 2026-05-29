package main

import (
	"backend/company/branch"
	"fmt"
)

func main() {
	// Initialize a Manager using your branch package
	// Notice we can't set 'salary' here because you made it unexported (private) in Employee!
	mgr := branch.Manager{
		Employee: branch.Employee{
			Name: "Divyansh",
			ID:   "MGR-001",
		},
		TeamSize: 15,
	}

	fmt.Println("--- Testing Inheritance & Encapsulation ---")
	
	// Calling the overridden (shadowed) Work method from Manager
	mgr.Work()
	
	// Calling the inherited GetPaid method from Employee
	mgr.GetPaid()
	
	// Calling Manager specific method
	mgr.HoldMeeting()
}