// go does not have built in constructor that runs automotically instead the standard practice is to write a regular function that starts witht the word new

// this function crates the strcut ,validates the initial data , and returns a pointer(*) to the memory address where the strucut lives
//This function creates the struct, validates the initial data, and returns a Pointer (*) to the memory address where the struct lives.
// returns a pointer to an account in struct in memory

func NewAccount(name string ,initialBalance float64) *Account{
    if initialBalance < 0{
        initialBalance = 0;// validation
    }
    // the '&' symbol creates the struct in memory and grabs in memory address
    return &Account{
        OwnerName: name,
        balance: initialBalance,
    }
}
