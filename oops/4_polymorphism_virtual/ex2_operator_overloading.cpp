/*
 * POLYMORPHISM EXAMPLE 2: Operator Overloading
 *
 * SITUATION: We want to represent a 2D Vector (math/physics) in code.
 * Instead of writing clumsy functions like addVectors(v1, v2), we want to use
 * the natural '+' operator (v1 + v2) and print them easily with '<<'.
 *
 * Compile: g++ ex2_operator_overloading.cpp -o ex2 && ./ex2
 */

#include <iostream>
using namespace std;

class Vector2D {
private:
    double x;
    double y;

public:
    Vector2D(double xVal = 0, double yVal = 0) : x(xVal), y(yVal) {}

    // Overloading the Binary + Operator (Member function)
    Vector2D operator+(const Vector2D& other) {
        return Vector2D(this->x + other.x, this->y + other.y);
    }

    // Overloading the Binary - Operator (Member function)
    Vector2D operator-(const Vector2D& other) {
        return Vector2D(this->x - other.x, this->y - other.y);
    }

    // Overloading the Equality == Operator
    bool operator==(const Vector2D& other) {
        return (this->x == other.x && this->y == other.y);
    }

    // Overloading the stream insertion operator << (Friend function)
    // This allows us to print the object directly using std::cout << vector
    friend ostream& operator<<(ostream& os, const Vector2D& vec);
};

// Definition of the stream insertion operator overload
ostream& operator<<(ostream& os, const Vector2D& vec) {
    os << "(" << vec.x << ", " << vec.y << ")";
    return os;
}

int main() {
    Vector2D v1(3.5, 4.0);
    Vector2D v2(1.5, 2.0);

    // Using overloaded arithmetic operators
    Vector2D v3 = v1 + v2;
    Vector2D v4 = v1 - v2;

    // Printing using overloaded << operator
    cout << "Vector 1: " << v1 << endl;
    cout << "Vector 2: " << v2 << endl;
    cout << "Sum (v1 + v2): " << v3 << endl;
    cout << "Difference (v1 - v2): " << v4 << endl;

    // Comparison check
    if (v1 == v2) {
        cout << "v1 is equal to v2" << endl;
    } else {
        cout << "v1 is NOT equal to v2" << endl;
    }

    return 0;
}
