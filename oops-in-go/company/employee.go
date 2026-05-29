package company

import "fmt"

// Person is our "Base Class" equivalent.
type Person struct {
	Name string
	Age  int
}

// Introduce is a method on the base Person struct.
func (p *Person) Introduce() {
	fmt.Printf("Hi, my name is %s and I am %d years old.\n", p.Name, p.Age)
}

// Employee is our "Derived Class" equivalent.
// Notice that we embed 'Person' directly without giving it a field name.
// This is called STRUCT EMBEDDING.
type Employee struct {
	Person     // Anonymous field / Embedded struct (Composition)
	EmployeeID string
	Salary     float64
}

// Work is a method specific to Employee.
func (e *Employee) Work() {
	fmt.Printf("%s is working as an employee (ID: %s).\n", e.Name, e.EmployeeID)
}

// Introduce shadows (overrides) the Person.Introduce method.
// When you call Introduce on an Employee, this method will run.
func (e *Employee) Introduce() {
	// We can access Name directly because it was PROMOTED from Person.
	fmt.Printf("Hello, I am Employee %s (ID: %s) and my salary is $%.2f.\n", e.Name, e.EmployeeID, e.Salary)
}

// ShowOriginalIntroduction demonstrates how to explicitly access the embedded struct's methods.
func (e *Employee) ShowOriginalIntroduction() {
	// If we need the original Person's Introduce method, we specify the type name:
	e.Person.Introduce()
}
