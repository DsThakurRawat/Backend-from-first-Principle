/*
 * PROBLEM 1: Shape Area Calculator
 *
 * PROBLEM STATEMENT:
 * Define an abstract base class 'Shape' with:
 * - A pure virtual function calculateArea()
 * - A pure virtual function display()
 * Implement 'Circle' class:
 * - Property: radius.
 * Implement 'Rectangle' class:
 * - Properties: width, height.
 * Create a global helper function:
 * - printShapeArea(Shape* s) that dynamically calculates and prints details of any shape.
 *
 * Compile: g++ prob1_shape_calculator.cpp -o prob1 && ./prob1
 */

#include <iostream>
using namespace std;

class Shape {
public:
    virtual double calculateArea() = 0;
    virtual void display() = 0;
    virtual ~Shape() {}
};

class Circle : public Shape {
private:
    double radius;

public:
    Circle(double r) : radius(r) {}

    double calculateArea() override {
        return 3.14159265 * radius * radius;
    }

    void display() override {
        cout << "Circle (radius: " << radius << ")";
    }
};

class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(double w, double h) : width(w), height(h) {}

    double calculateArea() override {
        return width * height;
    }

    void display() override {
        cout << "Rectangle (" << width << " x " << height << ")";
    }
};

// Global helper function using Polymorphism
void printShapeArea(Shape* s) {
    s->display();
    cout << " has an area of: " << s->calculateArea() << " square units." << endl;
}

int main() {
    Circle c(7.0);
    Rectangle r(10.0, 5.0);

    cout << "=== Shape Area Calculation ===" << endl;
    printShapeArea(&c);
    printShapeArea(&r);

    return 0;
}
