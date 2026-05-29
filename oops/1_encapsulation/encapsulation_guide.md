# Encapsulation in C++ — Complete Guide

## What is Encapsulation?

Encapsulation is the process of **bundling data (variables) and the methods (functions) that operate on that data into a single unit (class)**, and then **restricting direct access** to some of the object's components.

Think of it like a **medicine capsule** — all the ingredients are packed inside, and you can't touch them directly. You just swallow the capsule and it works.

### Why Do We Need Encapsulation?

Without encapsulation, anyone can modify your data directly, which leads to:
- **Invalid data** (e.g., setting a bank balance to -999999)
- **Security holes** (e.g., directly accessing passwords)
- **Uncontrolled side effects** (e.g., changing one thing breaks another)

### The Three Key Tools

| Tool | Keyword | Who Can Access? |
|------|---------|----------------|
| Public | `public:` | Anyone, anywhere |
| Private | `private:` | Only functions inside the same class |
| Protected | `protected:` | Same class + child classes (inheritance) |

### The Golden Rule
> **Make all data `private`. Provide `public` getter and setter methods to access or modify it.**

---

## Example 1: Bank Account System

### Real-World Situation
You are building a banking app. A customer's balance should NEVER be modified directly. All deposits and withdrawals must go through validation — you can't deposit negative money or withdraw more than you have.

### What Goes Wrong WITHOUT Encapsulation?
```cpp
// BAD CODE — No Encapsulation
#include <iostream>
using namespace std;

class BankAccount {
public:
    string ownerName;
    double balance;  // DANGER: Anyone can change this directly!
};

int main() {
    BankAccount acc;
    acc.ownerName = "Divyansh";
    acc.balance = 5000;

    // DISASTER: Someone sets balance to negative!
    acc.balance = -999999;  // No one stops this!
    cout << acc.ownerName << "'s balance: $" << acc.balance << endl;
    // Output: Divyansh's balance: $-999999
    return 0;
}
```

### The CORRECT Way — With Encapsulation
```cpp
#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    string ownerName;
    double balance;

public:
    // Constructor
    BankAccount(string name, double initialBalance) {
        ownerName = name;
        if (initialBalance >= 0)
            balance = initialBalance;
        else
            balance = 0;
    }

    // Getter for balance
    double getBalance() {
        return balance;
    }

    // Getter for owner name
    string getOwnerName() {
        return ownerName;
    }

    // Controlled deposit with validation
    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            cout << "Deposited $" << amount << ". New balance: $" << balance << endl;
        } else {
            cout << "ERROR: Deposit amount must be positive!" << endl;
        }
    }

    // Controlled withdrawal with validation
    void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            cout << "Withdrew $" << amount << ". New balance: $" << balance << endl;
        } else if (amount > balance) {
            cout << "ERROR: Insufficient funds! Balance: $" << balance << endl;
        } else {
            cout << "ERROR: Invalid withdrawal amount!" << endl;
        }
    }
};

int main() {
    BankAccount acc("Divyansh", 5000);

    cout << acc.getOwnerName() << "'s account created with $" << acc.getBalance() << endl;

    acc.deposit(1500);       // Valid
    acc.deposit(-200);       // Blocked!
    acc.withdraw(3000);      // Valid
    acc.withdraw(10000);     // Blocked!

    // acc.balance = -999999; // COMPILE ERROR! Can't access private member!
    return 0;
}
```

**Output:**
```
Divyansh's account created with $5000
Deposited $1500. New balance: $6500
ERROR: Deposit amount must be positive!
Withdrew $3000. New balance: $3500
ERROR: Insufficient funds! Balance: $3500
```

**Key Takeaway:** The `balance` is locked behind `private`. The only way to change it is through `deposit()` and `withdraw()`, which both validate the data before allowing any changes.

---

## Example 2: Student Record System

### Real-World Situation
A university needs a system where student grades can only be between 0 and 100. The GPA is auto-calculated and should be read-only — no one should manually set a GPA.

```cpp
#include <iostream>
#include <string>
using namespace std;

class StudentRecord {
private:
    string name;
    int rollNumber;
    double marks[5];    // 5 subjects
    double gpa;         // Auto-calculated, read-only from outside

    // Private helper function — only the class itself can call this
    void calculateGPA() {
        double total = 0;
        for (int i = 0; i < 5; i++) {
            total += marks[i];
        }
        gpa = total / 50.0;  // GPA on a 10-point scale
    }

public:
    StudentRecord(string n, int roll) {
        name = n;
        rollNumber = roll;
        gpa = 0;
        for (int i = 0; i < 5; i++) marks[i] = 0;
    }

    // Setter with validation — marks must be 0-100
    bool setMarks(int subject, double mark) {
        if (subject >= 0 && subject < 5 && mark >= 0 && mark <= 100) {
            marks[subject] = mark;
            calculateGPA();  // Auto-recalculate GPA whenever marks change
            return true;
        }
        cout << "ERROR: Invalid subject index or marks out of range (0-100)!" << endl;
        return false;
    }

    // Getters — read-only access
    string getName() { return name; }
    int getRollNumber() { return rollNumber; }
    double getGPA() { return gpa; }
    double getMarks(int subject) {
        if (subject >= 0 && subject < 5) return marks[subject];
        return -1;
    }

    void displayReport() {
        cout << "\n--- Student Report Card ---" << endl;
        cout << "Name: " << name << " | Roll: " << rollNumber << endl;
        for (int i = 0; i < 5; i++)
            cout << "Subject " << i + 1 << ": " << marks[i] << endl;
        cout << "GPA: " << gpa << "/10.0" << endl;
    }
};

int main() {
    StudentRecord s("Divyansh", 101);

    s.setMarks(0, 85);
    s.setMarks(1, 92);
    s.setMarks(2, 78);
    s.setMarks(3, 95);
    s.setMarks(4, 88);

    s.setMarks(2, 150);  // Blocked! Out of range
    s.setMarks(7, 80);   // Blocked! Invalid subject

    s.displayReport();
    return 0;
}
```

**Key Takeaway:** The GPA is completely read-only. It auto-updates whenever marks change. Nobody can manually set `gpa = 10.0` from outside.

---

## Example 3: Employee Payroll System

### Real-World Situation
An HR system where employee salaries are confidential. Only authorized operations (raise, bonus) can modify the salary. The salary can never go below minimum wage.

```cpp
#include <iostream>
#include <string>
using namespace std;

class Employee {
private:
    string name;
    string department;
    double baseSalary;
    double bonus;
    static const double MIN_WAGE;  // Minimum wage constant

    // Private: only internal use
    double calculateTotalPay() {
        return baseSalary + bonus;
    }

public:
    Employee(string n, string dept, double salary) {
        name = n;
        department = dept;
        bonus = 0;
        baseSalary = (salary >= MIN_WAGE) ? salary : MIN_WAGE;
    }

    // Controlled salary raise — percentage based
    void giveRaise(double percentage) {
        if (percentage > 0 && percentage <= 50) {
            double raiseAmount = baseSalary * (percentage / 100);
            baseSalary += raiseAmount;
            cout << name << " got a " << percentage << "% raise! (+$" << raiseAmount << ")" << endl;
        } else {
            cout << "ERROR: Raise must be between 1% and 50%!" << endl;
        }
    }

    // Controlled bonus
    void giveBonus(double amount) {
        if (amount > 0 && amount <= baseSalary * 0.5) {
            bonus = amount;
            cout << name << " received a bonus of $" << amount << endl;
        } else {
            cout << "ERROR: Bonus cannot exceed 50% of base salary!" << endl;
        }
    }

    // Read-only getters
    string getName() { return name; }
    string getDepartment() { return department; }

    void displayPayslip() {
        cout << "\n--- Payslip for " << name << " ---" << endl;
        cout << "Department: " << department << endl;
        cout << "Base Salary: $" << baseSalary << endl;
        cout << "Bonus: $" << bonus << endl;
        cout << "Total Pay: $" << calculateTotalPay() << endl;
    }
};

const double Employee::MIN_WAGE = 15000.0;

int main() {
    Employee emp("Divyansh", "Engineering", 50000);

    emp.giveRaise(10);      // Valid: 10% raise
    emp.giveRaise(60);      // Blocked!
    emp.giveBonus(20000);   // Valid
    emp.giveBonus(999999);  // Blocked!

    emp.displayPayslip();
    return 0;
}
```

**Key Takeaway:** Salary is never accessed directly. Business rules (min wage, max raise %, max bonus %) are enforced automatically.

---

## Example 4: Password Manager

### Real-World Situation
A password manager where the actual password is NEVER exposed. It is stored as a hash. The only operations allowed are: set password, verify password, and check password strength.

```cpp
#include <iostream>
#include <string>
using namespace std;

class PasswordManager {
private:
    string username;
    size_t passwordHash;  // We store hash, NEVER the actual password

    // Private: hash function
    size_t hashPassword(string pwd) {
        size_t h = 5381;
        for (char c : pwd) {
            h = ((h << 5) + h) + c;
        }
        return h;
    }

    // Private: strength checker
    int calculateStrength(string pwd) {
        int score = 0;
        if (pwd.length() >= 8) score++;
        if (pwd.length() >= 12) score++;
        bool hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : pwd) {
            if (isupper(c)) hasUpper = true;
            if (islower(c)) hasLower = true;
            if (isdigit(c)) hasDigit = true;
            if (!isalnum(c)) hasSpecial = true;
        }
        if (hasUpper) score++;
        if (hasLower) score++;
        if (hasDigit) score++;
        if (hasSpecial) score++;
        return score;  // Max score = 6
    }

public:
    PasswordManager(string user, string pwd) {
        username = user;
        passwordHash = hashPassword(pwd);
    }

    // Verify password — returns true/false, never exposes the hash
    bool verifyPassword(string attempt) {
        return hashPassword(attempt) == passwordHash;
    }

    // Change password — requires old password first
    bool changePassword(string oldPwd, string newPwd) {
        if (!verifyPassword(oldPwd)) {
            cout << "ERROR: Old password is incorrect!" << endl;
            return false;
        }
        if (newPwd.length() < 6) {
            cout << "ERROR: New password must be at least 6 characters!" << endl;
            return false;
        }
        passwordHash = hashPassword(newPwd);
        cout << "Password changed successfully!" << endl;
        return true;
    }

    // Check strength of a given password
    void checkStrength(string pwd) {
        int score = calculateStrength(pwd);
        string levels[] = {"Very Weak", "Weak", "Fair", "Moderate", "Strong", "Very Strong", "Excellent"};
        cout << "Password strength: " << levels[score] << " (" << score << "/6)" << endl;
    }

    string getUsername() { return username; }
};

int main() {
    PasswordManager pm("divyansh", "MyP@ss123");

    cout << "Login attempt with wrong password: "
         << (pm.verifyPassword("wrong") ? "Success" : "Failed") << endl;

    cout << "Login attempt with correct password: "
         << (pm.verifyPassword("MyP@ss123") ? "Success" : "Failed") << endl;

    pm.checkStrength("abc");
    pm.checkStrength("MyP@ss123");

    pm.changePassword("wrong", "newpass");       // Blocked!
    pm.changePassword("MyP@ss123", "NewSecure@456");  // Works!

    return 0;
}
```

**Key Takeaway:** The actual password is NEVER stored or exposed. Even the hash is private. This is real-world security through encapsulation.

---

## Example 5: Temperature Sensor (IoT Device)

### Real-World Situation
An IoT temperature sensor that reads values. The raw sensor reading must be calibrated internally. Users only get the calibrated, validated temperature. Invalid readings (sensor malfunction) are automatically rejected.

```cpp
#include <iostream>
using namespace std;

class TemperatureSensor {
private:
    double rawReading;
    double calibrationOffset;
    double minValidTemp;
    double maxValidTemp;
    bool isMalfunctioning;
    int readingCount;

    // Private: Apply calibration
    double calibrate(double raw) {
        return raw + calibrationOffset;
    }

    // Private: Validate reading
    bool isValidReading(double temp) {
        return temp >= minValidTemp && temp <= maxValidTemp;
    }

public:
    TemperatureSensor(double offset, double minTemp, double maxTemp) {
        calibrationOffset = offset;
        minValidTemp = minTemp;
        maxValidTemp = maxTemp;
        rawReading = 0;
        isMalfunctioning = false;
        readingCount = 0;
    }

    // Public: Feed a new raw sensor reading
    void feedReading(double raw) {
        readingCount++;
        double calibrated = calibrate(raw);

        if (isValidReading(calibrated)) {
            rawReading = raw;
            isMalfunctioning = false;
            cout << "Reading #" << readingCount << ": " << calibrated << "°C [OK]" << endl;
        } else {
            isMalfunctioning = true;
            cout << "Reading #" << readingCount << ": " << calibrated
                 << "°C [REJECTED - Out of valid range!]" << endl;
        }
    }

    // Public: Get the last valid calibrated temperature
    double getTemperature() {
        if (isMalfunctioning) {
            cout << "WARNING: Sensor may be malfunctioning!" << endl;
        }
        return calibrate(rawReading);
    }

    bool getSensorStatus() { return !isMalfunctioning; }
    int getReadingCount() { return readingCount; }
};

int main() {
    // Sensor with +1.5 offset, valid range: -40 to 60°C
    TemperatureSensor sensor(1.5, -40.0, 60.0);

    sensor.feedReading(22.0);    // 22 + 1.5 = 23.5°C — Valid
    sensor.feedReading(35.5);    // 35.5 + 1.5 = 37.0°C — Valid
    sensor.feedReading(100.0);   // 100 + 1.5 = 101.5°C — Rejected!
    sensor.feedReading(-50.0);   // -50 + 1.5 = -48.5°C — Rejected!
    sensor.feedReading(25.0);    // 25 + 1.5 = 26.5°C — Valid

    cout << "\nFinal temperature: " << sensor.getTemperature() << "°C" << endl;
    cout << "Total readings: " << sensor.getReadingCount() << endl;
    return 0;
}
```

**Key Takeaway:** The raw reading, calibration logic, and validation are all hidden. The outside world only gets clean, validated temperature data.

---

## Practice Problems (Solved)

### Problem 1: Library Book Tracker
**Task:** Create a `Book` class where the number of available copies can only decrease (borrow) or increase (return). It should never go negative. Track total borrows.

### Problem 2: ATM Machine
**Task:** Create an `ATM` class with a private PIN. Users must enter the correct PIN before withdrawing. Lock the account after 3 wrong attempts.

### Problem 3: Online Shopping Cart
**Task:** Create a `ShoppingCart` class where items have private prices. Provide methods to add items, remove items, and calculate total. Apply a discount only if total exceeds $100.

### Problem 4: Health Tracker
**Task:** Create a `HealthTracker` class with private height and weight. Auto-calculate BMI. Provide a method that returns health category (Underweight, Normal, Overweight, Obese).

### Problem 5: Game Inventory
**Task:** Create an `Inventory` class for a game character. Max capacity is 20 items. Items have private weight. Total weight cannot exceed 100kg. Provide add/remove/list methods.

> **Note:** Full solutions for all 5 problems are in the separate `.cpp` files in this directory.
