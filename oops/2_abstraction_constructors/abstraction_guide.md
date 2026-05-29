# Abstraction & Constructors in C++ — Complete Guide

## Part A: What is Abstraction?

Abstraction means **showing only the essential features** of an object and **hiding the complex implementation details** behind a simple interface.

### Encapsulation vs Abstraction — What's the Difference?

| Aspect | Encapsulation | Abstraction |
|--------|--------------|-------------|
| **Focus** | Hiding **data** | Hiding **complexity** |
| **How** | Using `private` access | Using abstract classes & interfaces |
| **Analogy** | A capsule hides ingredients | A car hides the engine from the driver |
| **Goal** | Protect data from corruption | Simplify usage for the user |

**Simple analogy:** When you drive a car, you just turn the key, press the accelerator, and steer. You don't need to know how the fuel injection, transmission, or spark plugs work internally. That's **abstraction** — hiding the complex engine and giving you a simple steering wheel and pedals.

### Abstract Classes in C++

An **abstract class** is a class that:
1. Has at least one **pure virtual function** (a function with `= 0`)
2. **Cannot be instantiated** (you can't create an object from it directly)
3. Acts as a **blueprint/contract** — child classes MUST implement the pure virtual functions

```cpp
// Abstract class — cannot create objects of this type
class Shape {
public:
    virtual double area() = 0;      // Pure virtual — MUST be implemented by children
    virtual double perimeter() = 0; // Pure virtual
    
    void describe() {  // Regular function — children inherit this as-is
        cout << "I am a shape with area: " << area() << endl;
    }
};
```

---

## Part B: Constructors in C++

A **constructor** is a special function that runs **automatically** when an object is created. It has the same name as the class and no return type.

### Types of Constructors

| Type | Description | When It Runs |
|------|-------------|-------------|
| **Default** | No parameters, sets defaults | `MyClass obj;` |
| **Parameterized** | Takes arguments to customize | `MyClass obj(10, "hello");` |
| **Copy** | Creates a new object as a copy of another | `MyClass obj2 = obj1;` |
| **Destructor** | Runs when object is destroyed (cleanup) | Object goes out of scope |

### Constructor Overloading
You can have MULTIPLE constructors in the same class with different parameter lists.

---

## Example 1: Car Engine (Abstraction)

### Situation
You are building a car simulation. The driver should only see `start()`, `stop()`, and `accelerate()`. They should NEVER interact with the internal systems like fuel injection, spark plugs, or transmission.

```cpp
#include <iostream>
using namespace std;

class Car {
private:
    bool engineRunning;
    int speed;
    double fuelLevel;

    // HIDDEN complex internals
    void injectFuel() { cout << "  [Internal] Fuel injected into cylinders" << endl; }
    void igniteSpark() { cout << "  [Internal] Spark plug ignited" << endl; }
    void engageTransmission() { cout << "  [Internal] Transmission engaged" << endl; }
    void disengageTransmission() { cout << "  [Internal] Transmission disengaged" << endl; }
    void cutFuelSupply() { cout << "  [Internal] Fuel supply cut" << endl; }

public:
    Car(double fuel) : engineRunning(false), speed(0), fuelLevel(fuel) {}

    // SIMPLE public interface — hides all complexity
    void start() {
        if (engineRunning) { cout << "Car is already running!" << endl; return; }
        if (fuelLevel <= 0) { cout << "No fuel!" << endl; return; }
        cout << "Starting car..." << endl;
        injectFuel();
        igniteSpark();
        engageTransmission();
        engineRunning = true;
        cout << "Car started successfully!" << endl;
    }

    void stop() {
        if (!engineRunning) { cout << "Car is already stopped!" << endl; return; }
        cout << "Stopping car..." << endl;
        disengageTransmission();
        cutFuelSupply();
        engineRunning = false;
        speed = 0;
        cout << "Car stopped." << endl;
    }

    void accelerate(int amount) {
        if (!engineRunning) { cout << "Start the car first!" << endl; return; }
        speed += amount;
        fuelLevel -= amount * 0.1;
        cout << "Speed: " << speed << " km/h | Fuel: " << fuelLevel << "L" << endl;
    }
};

int main() {
    Car myCar(50.0);
    myCar.start();
    myCar.accelerate(30);
    myCar.accelerate(40);
    myCar.stop();
    return 0;
}
```

**Key Takeaway:** The driver (user of the class) never touches `injectFuel()` or `igniteSpark()`. They just call `start()` and the car handles everything internally.

---

## Example 2: ATM Interface (Abstract Class)

### Situation
A bank has ATMs from different manufacturers (NCR, Diebold, Wincor). Each works differently internally, but they all MUST support the same operations: withdraw, deposit, checkBalance.

```cpp
#include <iostream>
using namespace std;

// Abstract class — defines the CONTRACT that all ATMs must follow
class ATMInterface {
public:
    virtual void withdraw(double amount) = 0;
    virtual void deposit(double amount) = 0;
    virtual double checkBalance() = 0;
    virtual void printReceipt() = 0;

    void welcome() { cout << "Welcome to our ATM!" << endl; }
    virtual ~ATMInterface() {}
};

// Concrete implementation — NCR brand ATM
class NCR_ATM : public ATMInterface {
private:
    double balance;
public:
    NCR_ATM(double bal) : balance(bal) {}

    void withdraw(double amount) override {
        if (amount <= balance) {
            balance -= amount;
            cout << "[NCR] Dispensing $" << amount << endl;
        } else {
            cout << "[NCR] Insufficient funds!" << endl;
        }
    }

    void deposit(double amount) override {
        balance += amount;
        cout << "[NCR] Deposited $" << amount << " via bill scanner" << endl;
    }

    double checkBalance() override { return balance; }

    void printReceipt() override {
        cout << "[NCR] === THERMAL RECEIPT ===" << endl;
        cout << "[NCR] Balance: $" << balance << endl;
    }
};

int main() {
    ATMInterface* atm = new NCR_ATM(5000);
    atm->welcome();
    atm->deposit(1000);
    atm->withdraw(2000);
    cout << "Balance: $" << atm->checkBalance() << endl;
    atm->printReceipt();
    delete atm;
    return 0;
}
```

---

## Example 3: Default & Parameterized Constructors

```cpp
#include <iostream>
#include <string>
using namespace std;

class Student {
private:
    string name;
    int age;
    double gpa;

public:
    // DEFAULT constructor — no parameters, sets defaults
    Student() {
        name = "Unknown";
        age = 0;
        gpa = 0.0;
        cout << "Default constructor called!" << endl;
    }

    // PARAMETERIZED constructor — customizes the object
    Student(string n, int a, double g) {
        name = n;
        age = (a > 0) ? a : 0;
        gpa = (g >= 0 && g <= 10) ? g : 0;
        cout << "Parameterized constructor called for " << name << "!" << endl;
    }

    void display() {
        cout << "Name: " << name << " | Age: " << age << " | GPA: " << gpa << endl;
    }
};

int main() {
    Student s1;                         // Calls DEFAULT constructor
    Student s2("Divyansh", 22, 8.5);    // Calls PARAMETERIZED constructor

    s1.display();
    s2.display();
    return 0;
}
```

---

## Example 4: Copy Constructor (Deep vs Shallow Copy)

### Situation
When you copy an object that contains a pointer, a "shallow copy" copies the pointer address (both objects point to the same memory). A "deep copy" creates new memory.

```cpp
#include <iostream>
#include <cstring>
using namespace std;

class MyString {
private:
    char* data;
    int length;

public:
    // Parameterized constructor
    MyString(const char* str) {
        length = strlen(str);
        data = new char[length + 1];  // Allocate memory on the heap
        strcpy(data, str);
        cout << "Constructor: Created \"" << data << "\"" << endl;
    }

    // COPY CONSTRUCTOR — Deep copy!
    MyString(const MyString& other) {
        length = other.length;
        data = new char[length + 1];  // Allocate NEW memory (deep copy)
        strcpy(data, other.data);
        cout << "Copy Constructor: Deep copied \"" << data << "\"" << endl;
    }

    // Destructor — cleanup
    ~MyString() {
        cout << "Destructor: Freeing \"" << data << "\"" << endl;
        delete[] data;
    }

    void display() { cout << "String: \"" << data << "\" (length: " << length << ")" << endl; }

    void changeFirst(char c) { data[0] = c; }
};

int main() {
    MyString s1("Hello");
    MyString s2 = s1;  // Calls COPY constructor (deep copy)

    s1.display();
    s2.display();

    // Change s1 — s2 should NOT be affected (because deep copy)
    s1.changeFirst('J');
    cout << "\nAfter changing s1:" << endl;
    s1.display();  // "Jello"
    s2.display();  // "Hello" — unaffected!

    return 0;
}
```

---

## Example 5: Destructor (Memory Cleanup)

### Situation
A Logger class opens a log file when created and must close it when destroyed. Without a destructor, the file stays open forever (memory/resource leak).

```cpp
#include <iostream>
#include <string>
using namespace std;

class Logger {
private:
    string filename;
    int logCount;
    bool isOpen;

public:
    // Constructor — opens the "file"
    Logger(string fname) {
        filename = fname;
        logCount = 0;
        isOpen = true;
        cout << "[Logger] Opened log file: " << filename << endl;
    }

    void log(string message) {
        if (!isOpen) { cout << "ERROR: Logger is closed!" << endl; return; }
        logCount++;
        cout << "[LOG #" << logCount << "] " << message << endl;
    }

    // DESTRUCTOR — automatically called when object goes out of scope
    ~Logger() {
        cout << "[Logger] Closing file: " << filename
             << " (Total logs: " << logCount << ")" << endl;
        isOpen = false;
    }
};

int main() {
    cout << "=== Program Start ===" << endl;

    {   // Start of a scope block
        Logger appLog("app.log");
        appLog.log("Application started");
        appLog.log("User logged in");
        appLog.log("Processing data...");
        // Destructor is called HERE automatically when appLog goes out of scope
    }

    cout << "\n=== After scope block ===" << endl;
    cout << "The logger was automatically cleaned up!" << endl;
    return 0;
}
```

---

## Practice Problems (Solved)

### Problem 1: Smart Home System
**Task:** Create an abstract SmartDevice class with pure virtual `turnOn()`, `turnOff()`, `getStatus()`. Implement SmartLight and SmartThermostat.

### Problem 2: Database Connection
**Task:** Create a DatabaseConnection class. Constructor opens connection, destructor closes it. Track query count.

### Problem 3: Matrix Class
**Task:** Create a Matrix class with default, parameterized, and copy constructors. Support matrix addition.

### Problem 4: File Handler
**Task:** Create a FileHandler class that opens a file in constructor and closes in destructor. Provide read/write methods.

### Problem 5: Student Registry
**Task:** Create a StudentRegistry that uses a copy constructor to create backups of the registry.

> **Full solutions are in the separate `.cpp` files in this directory.**
