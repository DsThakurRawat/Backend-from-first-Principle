package encapsulation

func NewAccount(name string ,initialBalance float64) *Account{
	if initialBalance < 0{
		initialBalance = 0// validation
	}
	// '&' creates the struct in memory and returns its address (pointer)
	return &Account{
		OwnerName: name,
		balance:   initialBalance,
	}
}