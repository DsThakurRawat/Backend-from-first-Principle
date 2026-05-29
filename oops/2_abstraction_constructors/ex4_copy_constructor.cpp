/*
 * ABSTRACTION EXAMPLE 4: Copy Constructor (Deep vs Shallow Copy)
 * 
 * SITUATION: When you copy an object that contains a pointer, a "shallow copy"
 * just copies the pointer address (BOTH objects point to the SAME memory).
 * A "deep copy" creates entirely new memory. Without a proper copy constructor,
 * modifying one object silently corrupts the other — a devastating bug.
 * 
 * Compile: g++ ex4_copy_constructor.cpp -o ex4 && ./ex4
 */

#include <iostream>
#include <cstring>
using namespace std;

class DynamicArray {
private:
    int* data;
    int size;

public:
    // Parameterized constructor
    DynamicArray(int s) {
        size = s;
        data = new int[size];  // Allocate on heap
        for (int i = 0; i < size; i++) data[i] = 0;
        cout << "[Constructor] Array of size " << size << " created" << endl;
    }

    // COPY CONSTRUCTOR — Deep copy
    DynamicArray(const DynamicArray& other) {
        size = other.size;
        data = new int[size];  // Allocate NEW memory (deep copy!)
        for (int i = 0; i < size; i++)
            data[i] = other.data[i];
        cout << "[Copy Constructor] Deep copy created (size " << size << ")" << endl;
    }

    // Destructor
    ~DynamicArray() {
        cout << "[Destructor] Freeing array of size " << size << endl;
        delete[] data;
    }

    void set(int index, int value) {
        if (index >= 0 && index < size) data[index] = value;
    }

    void display(string label) {
        cout << label << ": [";
        for (int i = 0; i < size; i++) {
            cout << data[i];
            if (i < size - 1) cout << ", ";
        }
        cout << "]" << endl;
    }
};

int main() {
    DynamicArray arr1(5);
    arr1.set(0, 10);
    arr1.set(1, 20);
    arr1.set(2, 30);

    // Copy constructor is called here
    DynamicArray arr2 = arr1;

    arr1.display("arr1 (original)");
    arr2.display("arr2 (deep copy)");

    // Modify arr1 — arr2 should NOT be affected
    arr1.set(0, 999);

    cout << "\nAfter modifying arr1[0] = 999:" << endl;
    arr1.display("arr1");
    arr2.display("arr2");  // Still has 10 — proof of deep copy!

    return 0;
}

/*
 * WITHOUT the custom copy constructor, both arr1 and arr2 would point
 * to the SAME memory. Changing arr1 would silently change arr2 too.
 * Even worse: when both destructors run, they try to free the SAME
 * memory twice — causing a crash (double free error).
 */
