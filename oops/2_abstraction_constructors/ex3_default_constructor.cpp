/*
 * ABSTRACTION EXAMPLE 3: Default & Parameterized Constructors
 * 
 * SITUATION: A Student management system that can create students
 * with or without initial data. Demonstrates constructor overloading.
 * 
 * Compile: g++ ex3_default_constructor.cpp -o ex3 && ./ex3
 */

#include <iostream>
#include <string>
using namespace std;

class Student {
private:
    string name;
    int age;
    double gpa;
    string enrollmentStatus;

public:
    // DEFAULT constructor — no parameters
    Student() {
        name = "Unknown";
        age = 0;
        gpa = 0.0;
        enrollmentStatus = "Pending";
        cout << "[Constructor] Default: Created placeholder student" << endl;
    }

    // PARAMETERIZED constructor — with name only
    Student(string n) {
        name = n;
        age = 0;
        gpa = 0.0;
        enrollmentStatus = "Enrolled";
        cout << "[Constructor] Name-only: Created student " << name << endl;
    }

    // PARAMETERIZED constructor — full details
    Student(string n, int a, double g) {
        name = n;
        age = (a > 0 && a < 120) ? a : 0;
        gpa = (g >= 0 && g <= 10) ? g : 0;
        enrollmentStatus = "Enrolled";
        cout << "[Constructor] Full: Created " << name
             << " (age " << age << ", GPA " << gpa << ")" << endl;
    }

    void display() {
        cout << "  Name: " << name << " | Age: " << age
             << " | GPA: " << gpa << " | Status: " << enrollmentStatus << endl;
    }

    // Destructor
    ~Student() {
        cout << "[Destructor] " << name << " record destroyed" << endl;
    }
};

int main() {
    cout << "=== Creating Students ===" << endl;

    Student s1;                          // Default constructor
    Student s2("Divyansh");              // 1-param constructor
    Student s3("Alice", 21, 9.2);        // 3-param constructor
    Student s4("Bob", 22, 8.5);          // 3-param constructor

    cout << "\n=== Student Records ===" << endl;
    s1.display();
    s2.display();
    s3.display();
    s4.display();

    cout << "\n=== Program ending — destructors will fire ===" << endl;
    return 0;
}
