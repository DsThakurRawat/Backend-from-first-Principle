/*
 * PROBLEM 2: ATM Machine
 * 
 * PROBLEM STATEMENT:
 * Create an ATM class with the following requirements:
 * - Store account holder name, PIN (private), balance (private)
 * - User must enter correct PIN before withdrawing or checking balance
 * - Lock the account after 3 consecutive wrong PIN attempts
 * - Withdrawal cannot exceed balance
 * - Minimum withdrawal is $100, maximum is $25000 per transaction
 * 
 * Compile: g++ prob2_atm_machine.cpp -o prob2 && ./prob2
 */

#include <iostream>
#include <string>
using namespace std;

class ATM {
private:
    string accountHolder;
    int pin;
    double balance;
    int failedAttempts;
    bool isLocked;
    static const int MAX_ATTEMPTS = 3;
    static constexpr double MIN_WITHDRAWAL = 100.0;
    static constexpr double MAX_WITHDRAWAL = 25000.0;

    bool verifyPin(int enteredPin) {
        if (isLocked) {
            cout << "ACCOUNT LOCKED! Contact your bank." << endl;
            return false;
        }
        if (enteredPin == pin) {
            failedAttempts = 0;
            return true;
        }
        failedAttempts++;
        int remaining = MAX_ATTEMPTS - failedAttempts;
        cout << "Wrong PIN! " << remaining << " attempts remaining." << endl;
        if (failedAttempts >= MAX_ATTEMPTS) {
            isLocked = true;
            cout << "ACCOUNT LOCKED after " << MAX_ATTEMPTS << " failed attempts!" << endl;
        }
        return false;
    }

public:
    ATM(string name, int p, double initialBalance) {
        accountHolder = name;
        pin = p;
        balance = (initialBalance >= 0) ? initialBalance : 0;
        failedAttempts = 0;
        isLocked = false;
    }

    void checkBalance(int enteredPin) {
        if (verifyPin(enteredPin)) {
            cout << "Current Balance: $" << balance << endl;
        }
    }

    void withdraw(int enteredPin, double amount) {
        if (!verifyPin(enteredPin)) return;

        if (amount < MIN_WITHDRAWAL) {
            cout << "ERROR: Minimum withdrawal is $" << MIN_WITHDRAWAL << endl;
        } else if (amount > MAX_WITHDRAWAL) {
            cout << "ERROR: Maximum withdrawal per transaction is $" << MAX_WITHDRAWAL << endl;
        } else if (amount > balance) {
            cout << "ERROR: Insufficient balance! Available: $" << balance << endl;
        } else {
            balance -= amount;
            cout << "Dispensing $" << amount << "... Remaining: $" << balance << endl;
        }
    }

    void deposit(int enteredPin, double amount) {
        if (!verifyPin(enteredPin)) return;

        if (amount > 0) {
            balance += amount;
            cout << "Deposited $" << amount << ". New Balance: $" << balance << endl;
        } else {
            cout << "ERROR: Invalid deposit amount!" << endl;
        }
    }

    // Admin function
    void unlockAccount() {
        isLocked = false;
        failedAttempts = 0;
        cout << "Account unlocked by bank admin." << endl;
    }
};

int main() {
    ATM myATM("Divyansh", 1234, 50000);

    cout << "=== ATM Session ===" << endl;

    // Correct PIN operations
    myATM.checkBalance(1234);
    myATM.withdraw(1234, 5000);
    myATM.deposit(1234, 10000);

    // Wrong PIN — 3 times to trigger lock
    cout << "\n--- Wrong PIN attempts ---" << endl;
    myATM.withdraw(9999, 1000);  // Wrong
    myATM.withdraw(8888, 1000);  // Wrong
    myATM.withdraw(7777, 1000);  // Wrong — LOCKED!

    // Try after lock
    myATM.checkBalance(1234);  // Blocked — locked!

    // Admin unlocks
    cout << "\n--- Admin Intervention ---" << endl;
    myATM.unlockAccount();
    myATM.checkBalance(1234);  // Works again

    // Edge cases
    cout << "\n--- Edge Cases ---" << endl;
    myATM.withdraw(1234, 50);       // Too small
    myATM.withdraw(1234, 30000);    // Too large
    myATM.withdraw(1234, 999999);   // Insufficient

    return 0;
}
