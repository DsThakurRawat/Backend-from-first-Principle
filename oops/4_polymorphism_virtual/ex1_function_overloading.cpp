/*
 * POLYMORPHISM EXAMPLE 1: Function Overloading
 *
 * SITUATION: We need to print different types of records (int, double, string, array)
 * using the same function name 'displayInfo'. The compiler will choose the correct overload
 * based on the arguments supplied.
 *
 * Compile: g++ ex1_function_overloading.cpp -o ex1 && ./ex1
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Printer {
public:
    // Overload 1: Integer
    void displayInfo(int value) {
        cout << "[Integer Record] Value: " << value << endl;
    }

    // Overload 2: Double
    void displayInfo(double value) {
        cout << "[Double Record] Value: " << value << " (Precision: 2 dec)" << endl;
    }

    // Overload 3: String
    void displayInfo(string value) {
        cout << "[String Record] Value: \"" << value << "\"" << endl;
    }

    // Overload 4: Vector of integers
    void displayInfo(const vector<int>& list) {
        cout << "[Array Record] Size: " << list.size() << " | Elements: [";
        for (size_t i = 0; i < list.size(); i++) {
            cout << list[i];
            if (i < list.size() - 1) cout << ", ";
        }
        cout << "]" << endl;
    }

    // Overload 5: Multi-parameter (Label + value)
    void displayInfo(string label, double value) {
        cout << "[Labeled Record] " << label << " = " << value << endl;
    }
};

int main() {
    Printer p;

    // Compiler performs static overload resolution at compile time:
    p.displayInfo(42);
    p.displayInfo(3.14159);
    p.displayInfo("Divyansh Rawat");
    p.displayInfo(vector<int>{1, 2, 3, 4, 5});
    p.displayInfo("CPU Temperature", 45.2);

    return 0;
}
