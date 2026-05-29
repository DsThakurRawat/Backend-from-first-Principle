/*
 * PROBLEM 3: University System — Person → Student, Professor
 *
 * PROBLEM STATEMENT:
 * Create a base class 'Person' with:
 * - Name, age, gender properties.
 * - displayInfo() method.
 * Implement 'Student' class derived from Person:
 * - Properties: studentId, major, marks (array of floats).
 * - displayInfo() override to include academic details.
 * - calculateAverage() method.
 * Implement 'Professor' class derived from Person:
 * - Properties: employeeId, department, salary, publications count.
 * - displayInfo() override to include research/teaching details.
 *
 * Compile: g++ prob3_university_system.cpp -o prob3 && ./prob3
 */

#include <iostream>
#include <string>
#include <vector>
#include <numeric>
using namespace std;

class Person {
protected:
    string name;
    int age;
    char gender;

public:
    Person(string n, int a, char g) : name(n), age(a), gender(g) {}

    virtual void displayInfo() {
        cout << "Name: " << name << " | Age: " << age << " | Gender: " << gender << endl;
    }

    virtual ~Person() {}
};

class Student : public Person {
private:
    string studentId;
    string major;
    vector<double> marks;

public:
    Student(string n, int a, char g, string id, string maj, vector<double> m)
        : Person(n, a, g), studentId(id), major(maj), marks(m) {}

    double calculateAverage() {
        if (marks.empty()) return 0.0;
        double sum = 0;
        for (double m : marks) sum += m;
        return sum / marks.size();
    }

    void displayInfo() override {
        cout << "[Student ID: " << studentId << "] Name: " << name 
             << " | Age: " << age << " | Gender: " << gender 
             << "\n  Major: " << major << " | Average Grade: " << calculateAverage() << "%" << endl;
    }
};

class Professor : public Person {
private:
    string employeeId;
    string department;
    double salary;
    int publicationsCount;

public:
    Professor(string n, int a, char g, string id, string dept, double sal, int pubCount)
        : Person(n, a, g), employeeId(id), department(dept), salary(sal), publicationsCount(pubCount) {}

    void displayInfo() override {
        cout << "[Professor ID: " << employeeId << "] Name: " << name 
             << " | Age: " << age << " | Gender: " << gender 
             << "\n  Dept: " << department << " | Salary: $" << salary 
             << " | Publications: " << publicationsCount << endl;
    }
};

int main() {
    Student s("Divyansh", 22, 'M', "STU2026", "Computer Science", {88.5, 92.0, 79.5, 95.0, 85.0});
    Professor p("Dr. Sarah Connor", 45, 'F', "PROF999", "Artificial Intelligence", 120000.0, 37);

    Person* campus[] = {&s, &p};

    cout << "=== University Directory ===" << endl;
    for (auto* person : campus) {
        person->displayInfo();
        cout << "------------------------------------" << endl;
    }

    return 0;
}
