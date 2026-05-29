/*
 * ENCAPSULATION EXAMPLE 3: Employee Payroll System
 * 
 * SITUATION: An HR system where employee salaries are confidential.
 * Only authorized operations (raise, bonus) can modify the salary.
 * The salary can never go below minimum wage. Tax is auto-calculated.
 * 
 * KEY CONCEPT: Business rules enforced through private data + controlled methods.
 * 
 * Compile: g++ ex3_employee_payroll.cpp -o ex3 && ./ex3
 */

#include <iostream>
#include <string>
using namespace std;

class Employee {
private:
    string name;
    string employeeId;
    string department;
    double baseSalary;
    double bonus;
    double taxRate;

    static constexpr double MIN_WAGE = 15000.0;
    static constexpr double MAX_RAISE_PERCENT = 50.0;

    // PRIVATE: Calculate tax based on salary bracket
    void updateTaxRate() {
        double total = baseSalary + bonus;
        if (total > 100000) taxRate = 0.30;       // 30% tax
        else if (total > 50000) taxRate = 0.20;    // 20% tax
        else if (total > 25000) taxRate = 0.10;    // 10% tax
        else taxRate = 0.0;                         // No tax
    }

    // PRIVATE: Calculate net pay after tax
    double calculateNetPay() {
        double grossPay = baseSalary + bonus;
        return grossPay - (grossPay * taxRate);
    }

public:
    Employee(string n, string id, string dept, double salary) {
        name = n;
        employeeId = id;
        department = dept;
        bonus = 0;
        // Enforce minimum wage
        baseSalary = (salary >= MIN_WAGE) ? salary : MIN_WAGE;
        updateTaxRate();
    }

    // Controlled salary raise — percentage based with limits
    void giveRaise(double percentage) {
        if (percentage > 0 && percentage <= MAX_RAISE_PERCENT) {
            double raiseAmount = baseSalary * (percentage / 100.0);
            baseSalary += raiseAmount;
            updateTaxRate();  // Recalculate tax after raise
            cout << name << " got a " << percentage << "% raise! (+$" 
                 << raiseAmount << ")" << endl;
        } else {
            cout << "ERROR: Raise must be between 1% and " 
                 << MAX_RAISE_PERCENT << "%!" << endl;
        }
    }

    // Controlled bonus — cannot exceed 50% of base salary
    void giveBonus(double amount) {
        if (amount > 0 && amount <= baseSalary * 0.5) {
            bonus = amount;
            updateTaxRate();  // Recalculate tax after bonus
            cout << name << " received a bonus of $" << amount << endl;
        } else {
            cout << "ERROR: Bonus must be between $1 and $" 
                 << baseSalary * 0.5 << " (50% of base)!" << endl;
        }
    }

    // Read-only getters
    string getName() { return name; }
    string getId() { return employeeId; }
    string getDepartment() { return department; }

    // Display full payslip
    void displayPayslip() {
        double grossPay = baseSalary + bonus;
        double taxAmount = grossPay * taxRate;

        cout << "\n╔═══════════════════════════════════╗" << endl;
        cout << "║          EMPLOYEE PAYSLIP         ║" << endl;
        cout << "╠═══════════════════════════════════╣" << endl;
        cout << "║ Name: " << name << endl;
        cout << "║ ID: " << employeeId << endl;
        cout << "║ Department: " << department << endl;
        cout << "╠───────────────────────────────────╣" << endl;
        cout << "║ Base Salary:  $" << baseSalary << endl;
        cout << "║ Bonus:        $" << bonus << endl;
        cout << "║ Gross Pay:    $" << grossPay << endl;
        cout << "║ Tax (" << (taxRate * 100) << "%):    -$" << taxAmount << endl;
        cout << "║ Net Pay:      $" << calculateNetPay() << endl;
        cout << "╚═══════════════════════════════════╝" << endl;
    }
};

int main() {
    Employee emp("Divyansh", "EMP-001", "Engineering", 50000);

    emp.giveRaise(10);       // Valid: 10% raise
    emp.giveRaise(60);       // Blocked! Exceeds 50%
    emp.giveBonus(20000);    // Valid
    emp.giveBonus(999999);   // Blocked! Exceeds 50% of base

    emp.displayPayslip();

    cout << "\n--- Creating employee below minimum wage ---" << endl;
    Employee emp2("Intern", "INT-001", "Marketing", 5000);
    emp2.displayPayslip();  // Salary auto-corrected to MIN_WAGE

    return 0;
}

/*
 * EXPECTED OUTPUT:
 * 
 * Divyansh got a 10% raise! (+$5000)
 * ERROR: Raise must be between 1% and 50%!
 * Divyansh received a bonus of $20000
 * ERROR: Bonus must be between $1 and $27500 (50% of base)!
 * 
 * ╔═══════════════════════════════════╗
 * ║          EMPLOYEE PAYSLIP         ║
 * ...
 * ║ Net Pay:      $52500
 * ╚═══════════════════════════════════╝
 */
