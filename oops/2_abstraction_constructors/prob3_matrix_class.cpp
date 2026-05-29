/*
 * PROBLEM 3: Matrix Class with Constructors
 * TASK: Create a 2x2 Matrix with default, parameterized, copy constructors. Support addition.
 * Compile: g++ prob3_matrix_class.cpp -o prob3 && ./prob3
 */
#include <iostream>
using namespace std;

class Matrix2x2 {
private:
    int data[2][2];
public:
    // Default — zero matrix
    Matrix2x2() {
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                data[i][j] = 0;
        cout << "[Constructor] Zero matrix created" << endl;
    }
    // Parameterized
    Matrix2x2(int a, int b, int c, int d) {
        data[0][0] = a; data[0][1] = b;
        data[1][0] = c; data[1][1] = d;
        cout << "[Constructor] Matrix created with values" << endl;
    }
    // Copy constructor
    Matrix2x2(const Matrix2x2& other) {
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                data[i][j] = other.data[i][j];
        cout << "[Copy Constructor] Matrix copied" << endl;
    }

    Matrix2x2 add(const Matrix2x2& other) {
        Matrix2x2 result;
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                result.data[i][j] = data[i][j] + other.data[i][j];
        return result;
    }

    void display(string label) {
        cout << label << ":" << endl;
        for (int i = 0; i < 2; i++) {
            cout << "  | " << data[i][0] << "  " << data[i][1] << " |" << endl;
        }
    }
};

int main() {
    Matrix2x2 m1(1, 2, 3, 4);
    Matrix2x2 m2(5, 6, 7, 8);
    Matrix2x2 m3 = m1;  // Copy constructor

    m1.display("Matrix A");
    m2.display("Matrix B");
    m3.display("Copy of A");

    cout << "\nA + B:" << endl;
    Matrix2x2 sum = m1.add(m2);
    sum.display("Result");
    return 0;
}
