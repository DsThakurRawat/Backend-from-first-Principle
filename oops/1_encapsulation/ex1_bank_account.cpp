/*
 * ENCAPSULATION EXAMPLE 1: Bank Account System
 * 
 * SITUATION: You are building a banking app. A customer's balance should 
 * NEVER be modified directly. All deposits and withdrawals must go through
 * validation — you can't deposit negative money or withdraw more than you have.
 * 
 * KEY CONCEPT: Private data + Public getter/setter methods with validation.
 * 
 * Compile: g++ ex1_bank_account.cpp -o ex1 && ./ex1
 */

#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    // These are PRIVATE — nobody outside the class can touch these directly
    string ownerName;
    double balance;
    int transactionCount;

public:
    // Constructor — sets up the account when it is created
    BankAccount(string name, double initialBalance) {
        ownerName = name;
        transactionCount = 0;
        // Validation: initial balance cannot be negative
        if (initialBalance >= 0)
            balance = initialBalance;
        else
            balance = 0;
    }

    // GETTER: Read-only access to the balance
    double getBalance() {
        return balance;
    }

    // GETTER: Read-only access to the owner name
    string getOwnerName() {
        return ownerName;
    }

    // GETTER: Read-only access to transaction count
    int getTransactionCount() {
        return transactionCount;
    }

    // CONTROLLED deposit with validation
    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            transactionCount++;
            cout << "[Transaction #" << transactionCount << "] Deposited $" 
                 << amount << ". New balance: $" << balance << endl;
        } else {
            cout << "ERROR: Deposit amount must be positive!" << endl;
        }
    }

    // CONTROLLED withdrawal with validation
    void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            transactionCount++;
            cout << "[Transaction #" << transactionCount << "] Withdrew $" 
                 << amount << ". New balance: $" << balance << endl;
        } else if (amount > balance) {
            cout << "ERROR: Insufficient funds! Current balance: $" << balance << endl;
        } else {
            cout << "ERROR: Invalid withdrawal amount!" << endl;
        }
    }

    // Display full account summary
    void displaySummary() {
        cout << "\n========== ACCOUNT SUMMARY ==========" << endl;
        cout << "Owner: " << ownerName << endl;
        cout << "Balance: $" << balance << endl;
        cout << "Total Transactions: " << transactionCount << endl;
        cout << "=====================================" << endl;
    }
};

int main() {
    // Create account with $5000 initial balance
    BankAccount acc("Divyansh", 5000);

    cout << acc.getOwnerName() << "'s account created with $" 
         << acc.getBalance() << endl << endl;

    // Valid operations
    acc.deposit(1500);       // Works — adds $1500
    acc.deposit(2000);       // Works — adds $2000

    // Invalid operations — BLOCKED by encapsulation!
    acc.deposit(-200);       // Blocked! Negative deposit
    acc.withdraw(3000);      // Works — removes $3000
    acc.withdraw(10000);     // Blocked! Insufficient funds

    // This line would cause a COMPILE ERROR if uncommented:
    // acc.balance = -999999;  // ERROR: 'balance' is private!

    acc.displaySummary();
    return 0;
}

/*
 * EXPECTED OUTPUT:
 * 
 * Divyansh's account created with $5000
 * 
 * [Transaction #1] Deposited $1500. New balance: $6500
 * [Transaction #2] Deposited $2000. New balance: $8500
 * ERROR: Deposit amount must be positive!
 * [Transaction #3] Withdrew $3000. New balance: $5500
 * ERROR: Insufficient funds! Current balance: $5500
 * 
 * ========== ACCOUNT SUMMARY ==========
 * Owner: Divyansh
 * Balance: $5500
 * Total Transactions: 3
 * =====================================
 */
