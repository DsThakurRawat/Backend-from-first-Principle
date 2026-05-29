/*
 * PROBLEM 2: Custom Payment Gateway
 *
 * PROBLEM STATEMENT:
 * Define an abstract class 'PaymentMethod' representing various online payment channels:
 * - Pure virtual void makePayment(double amount).
 * Implement three sub-classes:
 * - UPI: No surcharge on transactions.
 * - NetBanking: Flat $2.50 surcharge.
 * - Wallet: 1% surcharge on payment amount.
 * Simluate checking out a user order where the payment is processed polymorphically.
 *
 * Compile: g++ prob2_payment_system.cpp -o prob2 && ./prob2
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class PaymentMethod {
public:
    virtual void makePayment(double amount) = 0;
    virtual ~PaymentMethod() {}
};

class UPI : public PaymentMethod {
private:
    string upiId;

public:
    UPI(string id) : upiId(id) {}

    void makePayment(double amount) override {
        cout << "[UPI Payment] Paid $" << amount << " using address " << upiId 
             << " | Transaction Fee: $0.00 | Total Deducted: $" << amount << endl;
    }
};

class NetBanking : public PaymentMethod {
private:
    string bankName;
    static constexpr double SURCHARGE = 2.50;

public:
    NetBanking(string bank) : bankName(bank) {}

    void makePayment(double amount) override {
        double total = amount + SURCHARGE;
        cout << "[NetBanking] Paid $" << amount << " via " << bankName 
             << " | Flat Fee: $" << SURCHARGE << " | Total Deducted: $" << total << endl;
    }
};

class Wallet : public PaymentMethod {
private:
    string walletName;
    static constexpr double FEE_PERCENT = 0.01; // 1%

public:
    Wallet(string name) : walletName(name) {}

    void makePayment(double amount) override {
        double fee = amount * FEE_PERCENT;
        double total = amount + fee;
        cout << "[" << walletName << " Wallet] Paid $" << amount 
             << " | 1% Fee: $" << fee << " | Total Deducted: $" << total << endl;
    }
};

// Checkout function that accepts any PaymentMethod
void checkoutOrder(double billAmount, PaymentMethod* selectedPayment) {
    cout << "Initiating checkout for transaction value: $" << billAmount << endl;
    selectedPayment->makePayment(billAmount);
    cout << "Checkout Complete.\n--------------------------------------------" << endl;
}

int main() {
    UPI upi("divyansh@okaxis");
    NetBanking netBank("State Bank of India");
    Wallet paytm("Paytm");

    checkoutOrder(500.0, &upi);
    checkoutOrder(500.0, &netBank);
    checkoutOrder(500.0, &paytm);

    return 0;
}
