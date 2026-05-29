/*
 * POLYMORPHISM EXAMPLE 5: Virtual Destructors & Memory Leaks
 *
 * SITUATION: A base class pointer points to a derived class containing dynamically allocated memory.
 * If the destructor in base class is NOT virtual, delete base_ptr WILL NOT call the derived class destructor.
 * The memory allocated inside derived class is leaked! This example demonstrates the fix.
 *
 * Compile: g++ ex5_virtual_destructor.cpp -o ex5 && ./ex5
 */

#include <iostream>
using namespace std;

class BaseNonVirtual {
public:
    BaseNonVirtual() { cout << "[BaseNonVirtual] Constructor called" << endl; }
    
    // Non-virtual destructor!
    ~BaseNonVirtual() { cout << "[BaseNonVirtual] Destructor called (NON-VIRTUAL)" << endl; }
};

class DerivedNonVirtual : public BaseNonVirtual {
private:
    int* array;

public:
    DerivedNonVirtual() {
        array = new int[5000];
        cout << "[DerivedNonVirtual] Constructor called — allocated 5000 ints" << endl;
    }

    ~DerivedNonVirtual() {
        delete[] array;
        cout << "[DerivedNonVirtual] Destructor called — freed 5000 ints" << endl;
    }
};

class BaseVirtual {
public:
    BaseVirtual() { cout << "[BaseVirtual] Constructor called" << endl; }
    
    // VIRTUAL DESTRUCTOR!
    virtual ~BaseVirtual() { cout << "[BaseVirtual] Destructor called" << endl; }
};

class DerivedVirtual : public BaseVirtual {
private:
    int* array;

public:
    DerivedVirtual() {
        array = new int[5000];
        cout << "[DerivedVirtual] Constructor called — allocated 5000 ints" << endl;
    }

    ~DerivedVirtual() override {
        delete[] array;
        cout << "[DerivedVirtual] Destructor called — freed 5000 ints (SUCCESS)" << endl;
    }
};

int main() {
    cout << "=== Test 1: Destructing Without Virtual Destructor ===" << endl;
    BaseNonVirtual* nvPtr = new DerivedNonVirtual();
    delete nvPtr; // WARNING: DerivedNonVirtual destructor will NOT run! (Memory Leak)
    
    cout << "\n=== Test 2: Destructing With Virtual Destructor ===" << endl;
    BaseVirtual* vPtr = new DerivedVirtual();
    delete vPtr; // Both destructors run! (Safe cleanup)

    return 0;
}
