/*
 * ABSTRACTION EXAMPLE 2: ATM Interface (Abstract Class)
 * 
 * SITUATION: A bank has ATMs from different manufacturers. Each works
 * differently internally, but all MUST provide: withdraw, deposit,
 * checkBalance, printReceipt. We define an abstract contract.
 * 
 * Compile: g++ ex2_atm_interface.cpp -o ex2 && ./ex2
 */

#include <iostream>
using namespace std;

// ABSTRACT CLASS — the contract
class ATMInterface {
public:
    virtual void withdraw(double amount) = 0;   // Pure virtual
    virtual void deposit(double amount) = 0;     // Pure virtual
    virtual double checkBalance() = 0;           // Pure virtual
    virtual void printReceipt() = 0;             // Pure virtual

    // Regular method — all ATMs share this
    void welcome() {
        cout << "════════════════════════════" << endl;
        cout << "  Welcome to our ATM!" << endl;
        cout << "════════════════════════════" << endl;
    }

    virtual ~ATMInterface() {}
};

// CONCRETE implementation 1 — NCR brand
class NCR_ATM : public ATMInterface {
private:
    double balance;
public:
    NCR_ATM(double bal) : balance(bal) {}

    void withdraw(double amount) override {
        if (amount <= balance && amount > 0) {
            balance -= amount;
            cout << "[NCR] Dispensing $" << amount << " via motorized tray" << endl;
        } else {
            cout << "[NCR] Transaction denied." << endl;
        }
    }

    void deposit(double amount) override {
        if (amount > 0) {
            balance += amount;
            cout << "[NCR] $" << amount << " accepted via bill scanner" << endl;
        }
    }

    double checkBalance() override { return balance; }

    void printReceipt() override {
        cout << "[NCR] ═══ THERMAL RECEIPT ═══" << endl;
        cout << "[NCR] Balance: $" << balance << endl;
        cout << "[NCR] ══════════════════════" << endl;
    }
};

// CONCRETE implementation 2 — Diebold brand
class Diebold_ATM : public ATMInterface {
private:
    double balance;
public:
    Diebold_ATM(double bal) : balance(bal) {}

    void withdraw(double amount) override {
        if (amount <= balance && amount > 0) {
            balance -= amount;
            cout << "[Diebold] Cash dispensed from bottom slot: $" << amount << endl;
        } else {
            cout << "[Diebold] ERROR: Cannot process." << endl;
        }
    }

    void deposit(double amount) override {
        if (amount > 0) {
            balance += amount;
            cout << "[Diebold] Envelope deposit accepted: $" << amount << endl;
        }
    }

    double checkBalance() override { return balance; }

    void printReceipt() override {
        cout << "[Diebold] --- INK RECEIPT ---" << endl;
        cout << "[Diebold] Current Balance: $" << balance << endl;
        cout << "[Diebold] -------------------" << endl;
    }
};

// Function that works with ANY ATM — doesn't care which brand!
void performTransaction(ATMInterface* atm) {
    atm->welcome();
    atm->deposit(500);
    atm->withdraw(200);
    cout << "Balance: $" << atm->checkBalance() << endl;
    atm->printReceipt();
}

int main() {
    cout << "=== Using NCR ATM ===" << endl;
    NCR_ATM ncr(1000);
    performTransaction(&ncr);

    cout << "\n=== Using Diebold ATM ===" << endl;
    Diebold_ATM diebold(2000);
    performTransaction(&diebold);

    // ATMInterface atm(500);  // ERROR! Cannot create abstract class object!
    return 0;
}
