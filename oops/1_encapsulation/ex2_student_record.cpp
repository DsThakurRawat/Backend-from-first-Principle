/*
 * ENCAPSULATION EXAMPLE 2: Student Record System
 * 
 * SITUATION: A university needs a system where student grades can only be 
 * between 0 and 100. The GPA is auto-calculated and should be read-only —
 * no one should manually set a GPA.
 * 
 * KEY CONCEPT: Private data with auto-calculated derived fields.
 *              The GPA updates itself whenever marks change.
 * 
 * Compile: g++ ex2_student_record.cpp -o ex2 && ./ex2
 */

#include <iostream>
#include <string>
using namespace std;

class StudentRecord {
private:
    string name;
    int rollNumber;
    double marks[5];       // 5 subjects, each 0-100
    double gpa;            // Auto-calculated, NEVER set manually from outside
    int subjectsEntered;   // Track how many subjects have marks

    // PRIVATE helper function — only the class itself can call this
    // This automatically recalculates GPA whenever marks change
    void calculateGPA() {
        double total = 0;
        for (int i = 0; i < 5; i++) {
            total += marks[i];
        }
        // GPA on a 10-point scale: (total marks / 500) * 10
        gpa = (total / 500.0) * 10.0;
    }

public:
    // Constructor
    StudentRecord(string n, int roll) {
        name = n;
        rollNumber = roll;
        gpa = 0;
        subjectsEntered = 0;
        for (int i = 0; i < 5; i++) marks[i] = 0;
    }

    // SETTER with validation — marks must be 0-100
    bool setMarks(int subjectIndex, double mark) {
        if (subjectIndex < 0 || subjectIndex >= 5) {
            cout << "ERROR: Subject index must be 0-4! (Got: " << subjectIndex << ")" << endl;
            return false;
        }
        if (mark < 0 || mark > 100) {
            cout << "ERROR: Marks must be between 0 and 100! (Got: " << mark << ")" << endl;
            return false;
        }

        // Valid input — update marks and recalculate GPA
        if (marks[subjectIndex] == 0) subjectsEntered++;
        marks[subjectIndex] = mark;
        calculateGPA();  // Auto-recalculate!
        return true;
    }

    // GETTERS — read-only access
    string getName() { return name; }
    int getRollNumber() { return rollNumber; }
    double getGPA() { return gpa; }

    double getMarks(int subjectIndex) {
        if (subjectIndex >= 0 && subjectIndex < 5)
            return marks[subjectIndex];
        return -1;  // Invalid index
    }

    // Display full report card
    void displayReport() {
        string subjects[] = {"Mathematics", "Physics", "Chemistry", "English", "Computer Science"};

        cout << "\n╔══════════════════════════════════╗" << endl;
        cout << "║       STUDENT REPORT CARD        ║" << endl;
        cout << "╠══════════════════════════════════╣" << endl;
        cout << "║ Name: " << name << endl;
        cout << "║ Roll Number: " << rollNumber << endl;
        cout << "╠──────────────────────────────────╣" << endl;

        for (int i = 0; i < 5; i++) {
            cout << "║ " << subjects[i] << ": " << marks[i] << "/100" << endl;
        }

        cout << "╠──────────────────────────────────╣" << endl;
        cout << "║ GPA: " << gpa << " / 10.0" << endl;

        if (gpa >= 9.0) cout << "║ Grade: A+ (Outstanding!)" << endl;
        else if (gpa >= 8.0) cout << "║ Grade: A (Excellent)" << endl;
        else if (gpa >= 7.0) cout << "║ Grade: B+ (Very Good)" << endl;
        else if (gpa >= 6.0) cout << "║ Grade: B (Good)" << endl;
        else if (gpa >= 5.0) cout << "║ Grade: C (Average)" << endl;
        else cout << "║ Grade: F (Needs Improvement)" << endl;

        cout << "╚══════════════════════════════════╝" << endl;
    }
};

int main() {
    StudentRecord s("Divyansh", 101);

    // Set valid marks
    s.setMarks(0, 85);   // Mathematics
    s.setMarks(1, 92);   // Physics
    s.setMarks(2, 78);   // Chemistry
    s.setMarks(3, 95);   // English
    s.setMarks(4, 88);   // Computer Science

    // Try invalid operations — BLOCKED!
    s.setMarks(2, 150);  // Blocked! 150 > 100
    s.setMarks(7, 80);   // Blocked! Subject index 7 doesn't exist
    s.setMarks(0, -10);  // Blocked! Negative marks

    // Display the report card
    s.displayReport();

    // Try to manually set GPA — IMPOSSIBLE!
    // s.gpa = 10.0;  // COMPILE ERROR: 'gpa' is private

    return 0;
}

/*
 * EXPECTED OUTPUT:
 * 
 * ERROR: Marks must be between 0 and 100! (Got: 150)
 * ERROR: Subject index must be 0-4! (Got: 7)
 * ERROR: Marks must be between 0 and 100! (Got: -10)
 * 
 * ╔══════════════════════════════════╗
 * ║       STUDENT REPORT CARD        ║
 * ╠══════════════════════════════════╣
 * ║ Name: Divyansh
 * ║ Roll Number: 101
 * ╠──────────────────────────────────╣
 * ║ Mathematics: 85/100
 * ║ Physics: 92/100
 * ║ Chemistry: 78/100
 * ║ English: 95/100
 * ║ Computer Science: 88/100
 * ╠──────────────────────────────────╣
 * ║ GPA: 8.76 / 10.0
 * ║ Grade: A (Excellent)
 * ╚══════════════════════════════════╝
 */
