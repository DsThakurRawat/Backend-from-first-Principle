package branch

import (
	"fmt"
)

type Employee struct {
	Name string
	ID   string
	//Public (Exported): Name and ID start with uppercase letters. Any other file importing the company package can read or change these.
	salary float64
	//Private (Unexported): salary starts with a lowercase s. This means salary is fully encapsulated. Only code inside this exact company folder can touch the salary. If main.go tries to do mgr.salary = 100, the compiler will block it!

}

// base model

func (e *Employee) Work() {
	fmt.Printf("%s (ID: %s) is working hard\n", e.Name, e.ID)

}
func (e *Employee) GetPaid() {
	fmt.Printf("%s reciedved a salary of $%.2f\n", e.Name, e.salary)
}

// derived struct

type Manager struct {
	Employee //Embedding(composition)    // <-- THIS IS INHERITANCE (Struct Embedding)
	TeamSize int
}

// shadowing (overriding)the work methof

func (m *Manager) Work() {
	fmt.Printf("%s(ID: %s) is Managing a team of  %d people.\n", m.Name, m.ID, m.TeamSize)
}

//extra method specifier to manager

func (m *Manager) HoldMeeting() {
	fmt.Printf("Manager %s is holding a meeting for % d employees.\n", m.Name, m.TeamSize)

}
