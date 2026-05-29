/*
 * INHERITANCE EXAMPLE 5: Access Specifiers (public/protected/private inheritance)
 * Compile: g++ ex5_access_specifiers.cpp -o ex5 && ./ex5
 */
#include <iostream>
using namespace std;

class Base {
public:
    int publicVar = 1;
    void publicMethod() { cout << "Base public method" << endl; }
protected:
    int protectedVar = 2;
    void protectedMethod() { cout << "Base protected method" << endl; }
private:
    int privateVar = 3;  // NEVER accessible in ANY child
};

// PUBLIC inheritance — most common (95% of the time)
class PublicChild : public Base {
public:
    void test() {
        cout << "=== Public Child ===" << endl;
        cout << "publicVar: " << publicVar << " (still public)" << endl;
        cout << "protectedVar: " << protectedVar << " (still protected)" << endl;
        // cout << privateVar;  // ERROR! Never accessible
        publicMethod();     // OK
        protectedMethod();  // OK — we're inside the child
    }
};

// PROTECTED inheritance — rare
class ProtectedChild : protected Base {
public:
    void test() {
        cout << "=== Protected Child ===" << endl;
        cout << "publicVar: " << publicVar << " (became protected)" << endl;
        cout << "protectedVar: " << protectedVar << " (still protected)" << endl;
    }
};

// PRIVATE inheritance — very rare
class PrivateChild : private Base {
public:
    void test() {
        cout << "=== Private Child ===" << endl;
        cout << "publicVar: " << publicVar << " (became private)" << endl;
        cout << "protectedVar: " << protectedVar << " (became private)" << endl;
        // Both are accessible INSIDE the class, but not from outside
    }
};

int main() {
    PublicChild pub;
    pub.test();
    cout << "From outside: " << pub.publicVar << endl;  // OK — still public
    // pub.protectedVar;  // ERROR — protected

    cout << endl;
    ProtectedChild prot;
    prot.test();
    // prot.publicVar;  // ERROR — became protected!

    cout << endl;
    PrivateChild priv;
    priv.test();
    // priv.publicVar;  // ERROR — became private!

    return 0;
}

/*
 * SUMMARY:
 * - public inheritance: Everything stays the same. Use this 95% of the time.
 * - protected inheritance: Public things become protected.
 * - private inheritance: Everything becomes private.
 * - private members of parent are NEVER accessible in child, period.
 */
