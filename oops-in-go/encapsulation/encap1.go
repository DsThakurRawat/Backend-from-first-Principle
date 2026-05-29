package encapsulation
type Account struct{
	OwnerName string // Uppercase = Exported (Public)
	balance float64// lowercase = Unexported (Private)
}
