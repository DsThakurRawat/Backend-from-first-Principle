/*
 * INHERITANCE EXAMPLE 4: Hierarchical (Shape → Circle, Rectangle, Triangle)
 * Compile: g++ ex4_hierarchical_inheritance.cpp -o ex4 && ./ex4
 */
#include <iostream>
#include <string>
using namespace std;

class Shape {
protected:
    string color;
    string name;
public:
    Shape(string n, string c) : name(n), color(c) {}
    virtual double area() = 0;
    virtual double perimeter() = 0;
    void describe() {
        cout << name << " (" << color << ") | Area: " << area()
             << " | Perimeter: " << perimeter() << endl;
    }
    virtual ~Shape() {}
};

class Circle : public Shape {
private:
    double radius;
public:
    Circle(double r, string c) : Shape("Circle", c), radius(r) {}
    double area() override { return 3.14159 * radius * radius; }
    double perimeter() override { return 2 * 3.14159 * radius; }
};

class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h, string c) : Shape("Rectangle", c), width(w), height(h) {}
    double area() override { return width * height; }
    double perimeter() override { return 2 * (width + height); }
};

class Triangle : public Shape {
private:
    double a, b, c_side;  // three sides
    double height, base;
public:
    Triangle(double base, double h, double s1, double s2, double s3, string col)
        : Shape("Triangle", col), base(base), height(h), a(s1), b(s2), c_side(s3) {}
    double area() override { return 0.5 * base * height; }
    double perimeter() override { return a + b + c_side; }
};

int main() {
    Circle c(5, "Red");
    Rectangle r(4, 6, "Blue");
    Triangle t(3, 4, 3, 4, 5, "Green");

    // All share the same interface from Shape
    Shape* shapes[] = {&c, &r, &t};

    cout << "=== Shape Gallery ===" << endl;
    for (auto* s : shapes) {
        s->describe();
    }

    cout << "\nTotal area: ";
    double total = 0;
    for (auto* s : shapes) total += s->area();
    cout << total << " sq units" << endl;
    return 0;
}
