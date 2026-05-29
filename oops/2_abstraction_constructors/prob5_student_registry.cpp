/*
 * PROBLEM 5: Student Registry with Copy Constructor
 * TASK: Registry stores students. Use copy constructor to create backups.
 * Compile: g++ prob5_student_registry.cpp -o prob5 && ./prob5
 */
#include <iostream>
#include <string>
using namespace std;

class StudentRegistry {
private:
    string* names;
    int count;
    int capacity;
public:
    StudentRegistry(int cap) : capacity(cap), count(0) {
        names = new string[capacity];
        cout << "[Registry] Created with capacity " << capacity << endl;
    }

    // Deep copy constructor
    StudentRegistry(const StudentRegistry& other) {
        capacity = other.capacity;
        count = other.count;
        names = new string[capacity];  // New memory!
        for (int i = 0; i < count; i++)
            names[i] = other.names[i];
        cout << "[Registry] Backup created (" << count << " students copied)" << endl;
    }

    void addStudent(string name) {
        if (count >= capacity) {
            cout << "Registry full!" << endl;
            return;
        }
        names[count++] = name;
        cout << "Added: " << name << " (" << count << "/" << capacity << ")" << endl;
    }

    void removeLastStudent() {
        if (count > 0) {
            cout << "Removed: " << names[count - 1] << endl;
            count--;
        }
    }

    void display(string label) {
        cout << "\n" << label << " (" << count << " students):" << endl;
        for (int i = 0; i < count; i++)
            cout << "  " << i + 1 << ". " << names[i] << endl;
    }

    ~StudentRegistry() {
        cout << "[Registry] Destroyed (" << count << " records freed)" << endl;
        delete[] names;
    }
};

int main() {
    StudentRegistry reg(5);
    reg.addStudent("Alice");
    reg.addStudent("Bob");
    reg.addStudent("Charlie");

    // Create a backup using copy constructor
    StudentRegistry backup = reg;

    // Modify original — backup should NOT be affected
    reg.addStudent("Dave");
    reg.removeLastStudent();

    reg.display("Original Registry");
    backup.display("Backup Registry");  // Still has Alice, Bob, Charlie

    return 0;
}
