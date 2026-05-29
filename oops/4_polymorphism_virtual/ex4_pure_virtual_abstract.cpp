/*
 * POLYMORPHISM EXAMPLE 4: Pure Virtual Functions & Abstract Classes
 *
 * SITUATION: We are building a payroll app. We have a base Employee class.
 * But wait, there is no generic employee. An employee must be either SalariedEmployee 
 * or HourlyEmployee. We enforce this by making Employee an Abstract Class with a
 * pure virtual function: calculateSalary().
 *
 * Compile: g++ ex4_pure_virtual_abstract.cpp -o ex4 && ./ex4
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

// ABSTRACT BASE CLASS — cannot instantiate
class Employee {
protected:
    string name;
    string id;

public:
    Employee(string n, string empId) : name(n), id(empId) {}

    // Pure Virtual Function — forces all child classes to implement this
    virtual double calculateSalary() = 0;

    void printPayslip() {
        cout << "ID: " << id << " | Name: " << name 
             << " | Salary: $" << calculateSalary() << endl;
    }

    virtual ~Employee() {}
};

class SalariedEmployee : public Employee {
private:
    double monthlyRate;

public:
    SalariedEmployee(string n, string empId, double rate) 
        : Employee(n, empId), monthlyRate(rate) {}

    double calculateSalary() override {
        return monthlyRate;
    }
};

class HourlyEmployee : public Employee {
private:
    double hourlyRate;
    double hoursWorked;

public:
    HourlyEmployee(string n, string empId, double rate, double hours) 
        : Employee(n, empId), hourlyRate(rate), hoursWorked(hours) {}

    double calculateSalary() override {
        return hourlyRate * hoursWorked;
    }
};

int main() {
    // Employee emp("Some Name", "E001"); // ERROR: Cannot instantiate abstract class!

    vector<Employee*> companyList;
    companyList.push_back(new SalariedEmployee("Divyansh Rawat", "EMP201", 8500.0));
    companyList.push_back(new HourlyEmployee("John Smith", "EMP304", 45.0, 160.0));

    cout << "=== Payroll Processing ===" << endl;
    double totalPayout = 0.0;
    for (Employee* emp : companyList) {
        emp->printPayslip();
        totalPayout += emp->calculateSalary();
    }

    cout << "\nTotal Company Payout: $" << totalPayout << endl;

    // Clean up
    for (Employee* emp : companyList) {
        delete emp;
    }

    return 0;
}
