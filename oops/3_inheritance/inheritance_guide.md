# Inheritance in C++ — Complete Guide

## What is Inheritance?

Inheritance allows you to **create a new class (child/derived) based on an existing class (parent/base)**, automatically getting all its attributes and methods. This lets you reuse code instead of rewriting it.

### The Syntax
```cpp
class ChildClass : public ParentClass {
    // Child automatically gets everything from Parent
};
```

### Types of Inheritance in C++

| Type | Description | Syntax |
|------|-------------|--------|
| **Single** | One child, one parent | `class Dog : public Animal` |
| **Multilevel** | Chain: Grandparent → Parent → Child | `A → B → C` |
| **Multiple** | One child, TWO or more parents | `class Duck : public Flyable, public Swimmable` |
| **Hierarchical** | One parent, MANY children | `Shape → Circle, Rectangle, Triangle` |

### Access Specifiers in Inheritance

| Base Member | `public` inheritance | `protected` inheritance | `private` inheritance |
|-------------|---------------------|------------------------|----------------------|
| `public` | public in child | protected in child | private in child |
| `protected` | protected in child | protected in child | private in child |
| `private` | NOT accessible | NOT accessible | NOT accessible |

> **Rule:** `private` members of the parent are NEVER directly accessible in the child, regardless of inheritance type. Use `protected` if children need access.

---

## Example 1: Single Inheritance (Animal → Dog)

### Situation
Every animal has a name and age. Dogs additionally have a breed and can fetch. Instead of rewriting name/age for every animal, we inherit from a base Animal class.

```cpp
#include <iostream>
#include <string>
using namespace std;

class Animal {
protected:
    string name;
    int age;
public:
    Animal(string n, int a) : name(n), age(a) {
        cout << "[Animal] Created: " << name << endl;
    }
    void eat() { cout << name << " is eating." << endl; }
    void sleep() { cout << name << " is sleeping." << endl; }
    void info() {
        cout << "Name: " << name << " | Age: " << age << endl;
    }
};

class Dog : public Animal {
private:
    string breed;
public:
    // Call parent constructor using initializer list
    Dog(string n, int a, string b) : Animal(n, a), breed(b) {
        cout << "[Dog] Breed: " << breed << endl;
    }
    void fetch() { cout << name << " is fetching the ball!" << endl; }
    void bark() { cout << name << " says: Woof! Woof!" << endl; }
    void fullInfo() {
        info();  // Inherited from Animal
        cout << "Breed: " << breed << endl;
    }
};

int main() {
    Dog myDog("Rex", 3, "German Shepherd");
    myDog.eat();       // Inherited from Animal
    myDog.sleep();     // Inherited from Animal
    myDog.bark();      // Dog's own method
    myDog.fetch();     // Dog's own method
    myDog.fullInfo();
    return 0;
}
```

---

## Example 2: Multilevel Inheritance (Vehicle → Car → ElectricCar)

### Situation
A chain of specialization: Every vehicle has wheels and speed. A Car adds doors and fuel type. An ElectricCar adds battery capacity and charging.

```cpp
#include <iostream>
using namespace std;

class Vehicle {
protected:
    int wheels;
    int maxSpeed;
public:
    Vehicle(int w, int s) : wheels(w), maxSpeed(s) {}
    void showBase() {
        cout << "Wheels: " << wheels << " | Max Speed: " << maxSpeed << " km/h" << endl;
    }
};

class Car : public Vehicle {
protected:
    int doors;
    string fuelType;
public:
    Car(int w, int s, int d, string f) : Vehicle(w, s), doors(d), fuelType(f) {}
    void showCar() {
        showBase();
        cout << "Doors: " << doors << " | Fuel: " << fuelType << endl;
    }
};

class ElectricCar : public Car {
private:
    int batteryKWh;
    int rangeKm;
public:
    ElectricCar(int d, int s, int bat, int range)
        : Car(4, s, d, "Electric"), batteryKWh(bat), rangeKm(range) {}
    void showFull() {
        showCar();
        cout << "Battery: " << batteryKWh << " kWh | Range: " << rangeKm << " km" << endl;
    }
    void charge() { cout << "Charging... Battery: " << batteryKWh << " kWh" << endl; }
};

int main() {
    ElectricCar tesla(4, 250, 100, 600);
    tesla.showFull();
    tesla.charge();
    return 0;
}
```

---

## Example 3: Multiple Inheritance (Flyable + Swimmable → Duck)

### Situation
A Duck can both fly AND swim. Instead of putting both abilities in one massive class, we create separate ability classes and combine them.

```cpp
#include <iostream>
using namespace std;

class Flyable {
public:
    void fly() { cout << "Flying through the sky!" << endl; }
    int maxAltitude() { return 1000; }
};

class Swimmable {
public:
    void swim() { cout << "Swimming in the water!" << endl; }
    int maxDepth() { return 5; }
};

class Duck : public Flyable, public Swimmable {
private:
    string name;
public:
    Duck(string n) : name(n) {}
    void quack() { cout << name << " says: Quack!" << endl; }
    void showAbilities() {
        cout << name << "'s abilities:" << endl;
        cout << "  Can fly up to " << maxAltitude() << "m" << endl;
        cout << "  Can dive up to " << maxDepth() << "m" << endl;
    }
};

int main() {
    Duck donald("Donald");
    donald.quack();
    donald.fly();    // From Flyable
    donald.swim();   // From Swimmable
    donald.showAbilities();
    return 0;
}
```

---

## Example 4: Hierarchical Inheritance (Shape → Circle, Rectangle, Triangle)

```cpp
#include <iostream>
using namespace std;

class Shape {
protected:
    string color;
public:
    Shape(string c) : color(c) {}
    virtual double area() = 0;
    void showColor() { cout << "Color: " << color << endl; }
};

class Circle : public Shape {
private:
    double radius;
public:
    Circle(double r, string c) : Shape(c), radius(r) {}
    double area() override { return 3.14159 * radius * radius; }
    void display() {
        cout << "Circle (r=" << radius << ") | Area: " << area() << endl;
        showColor();
    }
};

class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h, string c) : Shape(c), width(w), height(h) {}
    double area() override { return width * height; }
    void display() {
        cout << "Rectangle (" << width << "x" << height << ") | Area: " << area() << endl;
        showColor();
    }
};

class Triangle : public Shape {
private:
    double base, height;
public:
    Triangle(double b, double h, string c) : Shape(c), base(b), height(h) {}
    double area() override { return 0.5 * base * height; }
    void display() {
        cout << "Triangle (b=" << base << ", h=" << height << ") | Area: " << area() << endl;
        showColor();
    }
};

int main() {
    Circle c(5, "Red");
    Rectangle r(4, 6, "Blue");
    Triangle t(3, 8, "Green");

    c.display();
    r.display();
    t.display();
    return 0;
}
```

---

## Example 5: Access Specifiers in Inheritance

```cpp
#include <iostream>
using namespace std;

class Base {
public:
    int publicVar = 1;
protected:
    int protectedVar = 2;
private:
    int privateVar = 3;  // NEVER accessible in child
};

// PUBLIC inheritance — most common
class PublicChild : public Base {
public:
    void test() {
        cout << "publicVar: " << publicVar << endl;       // OK
        cout << "protectedVar: " << protectedVar << endl;  // OK
        // cout << privateVar;  // ERROR! Private is NEVER inherited
    }
};

// PROTECTED inheritance — rare
class ProtectedChild : protected Base {
public:
    void test() {
        cout << "publicVar: " << publicVar << endl;        // Now protected
        cout << "protectedVar: " << protectedVar << endl;   // Still protected
    }
};

int main() {
    PublicChild pub;
    pub.test();
    cout << pub.publicVar << endl;   // OK — still public
    // cout << pub.protectedVar;     // ERROR — protected

    ProtectedChild prot;
    prot.test();
    // cout << prot.publicVar;       // ERROR — became protected!
    return 0;
}
```

---

## Practice Problems (Solved)

### Problem 1: Company Hierarchy — Employee → Manager → Director
### Problem 2: Media Player — Media → AudioFile, VideoFile
### Problem 3: University — Person → Student, Professor
### Problem 4: Vehicle Rental — Vehicle → Car, Bike, Truck
### Problem 5: Restaurant Menu — MenuItem → FoodItem, DrinkItem

> **Full solutions are in the separate `.cpp` files in this directory.**
