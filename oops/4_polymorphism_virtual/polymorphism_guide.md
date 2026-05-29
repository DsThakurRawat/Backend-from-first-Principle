# Polymorphism and Virtual Functions in C++ — Complete Guide

## What is Polymorphism?

Polymorphism means **"many forms"**. In OOP, it allows us to perform a single action in different ways. 
Typically, this happens when we have a hierarchy of classes related by inheritance.

There are two main types of polymorphism in C++:

```
                  Polymorphism
                  /          \
      Compile-Time            Run-Time
     (Static/Early Binding)  (Dynamic/Late Binding)
         /          \                  |
Function Overloading  Operator Overloading  Virtual Functions
```

---

## Part A: Compile-Time Polymorphism

Compile-time polymorphism is resolved during compilation. The compiler knows exactly which function to call based on the arguments or operators used.

### 1. Function Overloading
Multiple functions in the same scope with the **same name** but **different parameters** (different types, order, or number of arguments).

```cpp
void print(int i) { cout << "Printing int: " << i << endl; }
void print(double f) { cout << "Printing float: " << f << endl; }
void print(string s) { cout << "Printing string: " << s << endl; }
```

### 2. Operator Overloading
Giving custom meaning to built-in C++ operators (like `+`, `-`, `<<`, `==`) when applied to user-defined classes.

```cpp
Vector2D operator+(const Vector2D& other) {
    return Vector2D(this->x + other.x, this->y + other.y);
}
```

---

## Part B: Run-Time Polymorphism & Virtual Functions

Run-Time Polymorphism is resolved at execution time (dynamic binding). 

### The Problem WITHOUT Virtual Functions
If you point a base class pointer to a derived class object and call an overridden function, C++ will execute the **base class version** by default (static binding).

```cpp
Animal* a = new Dog();
a->makeSound(); // Output: "Generic animal sound" (Static binding)
```

### The Solution: The `virtual` Keyword
When you mark a function as `virtual` in the base class:
1. C++ creates a hidden table called a **VTABLE** (Virtual Table) for the class.
2. At runtime, C++ looks at the actual object type, looks up the function in the VTABLE, and invokes the derived class implementation.

```cpp
class Animal {
public:
    virtual void makeSound() { cout << "Generic sound"; }
};

class Dog : public Animal {
public:
    void makeSound() override { cout << "Woof! Woof!"; }
};

Animal* a = new Dog();
a->makeSound(); // Output: "Woof! Woof!" (Dynamic binding!)
```

### Pure Virtual Functions and Abstract Classes
A **pure virtual function** is a virtual function initialized with `= 0`. 
Any class containing a pure virtual function is an **Abstract Class** and cannot be instantiated.

```cpp
class Vehicle {
public:
    virtual void startEngine() = 0; // Pure virtual function
};
```

### Why Virtual Destructors are Critical
If you delete a derived class object through a base class pointer, and the base class destructor is **not** virtual, only the base class destructor runs. This leads to **memory leaks** because the derived class resources are never freed.

---

## Example 1: Function Overloading (Math Operations)

```cpp
#include <iostream>
using namespace std;

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
    int add(int a, int b, int c) { return a + b + c; }
};

int main() {
    Calculator calc;
    cout << calc.add(5, 10) << endl;       // Calls add(int, int)
    cout << calc.add(2.5, 4.7) << endl;     // Calls add(double, double)
    cout << calc.add(1, 2, 3) << endl;      // Calls add(int, int, int)
    return 0;
}
```

---

## Example 2: Operator Overloading (Complex Numbers)

```cpp
#include <iostream>
using namespace std;

class Complex {
private:
    double real, imag;
public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // Overload + operator
    Complex operator+(const Complex& other) {
        return Complex(real + other.real, imag + other.imag);
    }

    void display() {
        cout << real << " + " << imag << "i" << endl;
    }
};

int main() {
    Complex c1(3.0, 4.0), c2(1.5, 2.5);
    Complex c3 = c1 + c2; // Triggers operator+
    c3.display();         // Output: 4.5 + 6.5i
    return 0;
}
```

---

## Example 3: Runtime Polymorphism (Virtual Functions)

```cpp
#include <iostream>
using namespace std;

class Animal {
public:
    virtual void sound() { cout << "Animal makes a sound" << endl; }
    virtual ~Animal() {}
};

class Dog : public Animal {
public:
    void sound() override { cout << "Dog barks: Woof!" << endl; }
};

class Cat : public Animal {
public:
    void sound() override { cout << "Cat meows: Meow!" << endl; }
};

int main() {
    Animal* myAnimal = new Dog();
    myAnimal->sound(); // Dynamic binding: Outputs "Dog barks: Woof!"
    delete myAnimal;

    myAnimal = new Cat();
    myAnimal->sound(); // Dynamic binding: Outputs "Cat meows: Meow!"
    delete myAnimal;

    return 0;
}
```

---

## Example 4: Pure Virtual Functions & Abstract Classes

```cpp
#include <iostream>
using namespace std;

class PaymentMethod {
public:
    virtual void processPayment(double amount) = 0; // Pure Virtual
    virtual ~PaymentMethod() {}
};

class CreditCard : public PaymentMethod {
public:
    void processPayment(double amount) override {
        cout << "Processing credit card payment of $" << amount << endl;
    }
};

class UPI : public PaymentMethod {
public:
    void processPayment(double amount) override {
        cout << "Processing UPI payment of $" << amount << endl;
    }
};

int main() {
    PaymentMethod* method = new CreditCard();
    method->processPayment(150.00);
    delete method;

    method = new UPI();
    method->processPayment(45.00);
    delete method;

    return 0;
}
```

---

## Example 5: Virtual Destructors (Preventing Memory Leaks)

```cpp
#include <iostream>
using namespace std;

class Base {
public:
    Base() { cout << "Base constructor" << endl; }
    virtual ~Base() { cout << "Base destructor (Virtual)" << endl; }
};

class Derived : public Base {
private:
    int* data;
public:
    Derived() {
        data = new int[100];
        cout << "Derived constructor (Allocated memory)" << endl;
    }
    ~Derived() override {
        delete[] data;
        cout << "Derived destructor (Cleaned up memory)" << endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr; // Fired BOTH destructors due to 'virtual ~Base()'
    return 0;
}
```

---

## Practice Problems (Solved)

### Problem 1: Shape Calculator
**Task:** Create abstract base `Shape` with virtual `area()`. Derive `Circle` and `Rectangle`. Write a global function to print area.

### Problem 2: Custom Payment Gateway
**Task:** Implement polymorphism with `UPI`, `NetBanking`, and `Wallet` payments with different transaction fee models.

### Problem 3: Multi-channel Notification System
**Task:** Polymorphic notification delivery via `Email`, `SMS`, and `PushNotification`.

### Problem 4: RPG Combat simulator
**Task:** Polymorphic characters (`Warrior`, `Mage`, `Archer`) attacking with unique damage calculations.

### Problem 5: Polymorphic Logger
**Task:** Send logs to `ConsoleLogger`, `FileLogger`, or `DBLogger` using polymorphism.

> **Full solutions are in the separate `.cpp` files in this directory.**
