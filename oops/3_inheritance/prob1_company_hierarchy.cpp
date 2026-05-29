/*
 * PROBLEM 1: Company Hierarchy — Employee → Manager → Director
 * Compile: g++ prob1_company_hierarchy.cpp -o prob1 && ./prob1
 */
#include <iostream>
#include <string>
using namespace std;

class Employee {
protected:
    string name;
    double salary;
    string department;
public:
    Employee(string n, double s, string d) : name(n), salary(s), department(d) {}
    virtual void showRole() {
        cout << "Employee: " << name << " | Dept: " << department
             << " | Salary: $" << salary << endl;
    }
    virtual ~Employee() {}
};

class Manager : public Employee {
protected:
    int teamSize;
public:
    Manager(string n, double s, string d, int t)
        : Employee(n, s, d), teamSize(t) {}
    void showRole() override {
        cout << "Manager: " << name << " | Dept: " << department
             << " | Salary: $" << salary << " | Team: " << teamSize << endl;
    }
    void holdMeeting() { cout << name << " is holding a team meeting with " << teamSize << " people" << endl; }
};

class Director : public Manager {
private:
    double budget;
public:
    Director(string n, double s, string d, int t, double b)
        : Manager(n, s, d, t), budget(b) {}
    void showRole() override {
        cout << "Director: " << name << " | Dept: " << department
             << " | Salary: $" << salary << " | Team: " << teamSize
             << " | Budget: $" << budget << endl;
    }
    void approveBudget(double amount) {
        if (amount <= budget) cout << name << " approved $" << amount << endl;
        else cout << name << ": Budget exceeded!" << endl;
    }
};

int main() {
    Employee emp("Alice", 50000, "Engineering");
    Manager mgr("Bob", 80000, "Engineering", 8);
    Director dir("Carol", 150000, "Engineering", 25, 500000);

    Employee* team[] = {&emp, &mgr, &dir};
    for (auto* e : team) e->showRole();

    cout << endl;
    mgr.holdMeeting();
    dir.approveBudget(100000);
    dir.approveBudget(999999);
    return 0;
}
