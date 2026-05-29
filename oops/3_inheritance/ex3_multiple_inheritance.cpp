/*
 * INHERITANCE EXAMPLE 3: Multiple Inheritance (Flyable + Swimmable → Duck)
 * Compile: g++ ex3_multiple_inheritance.cpp -o ex3 && ./ex3
 */
#include <iostream>
#include <string>
using namespace std;

class Flyable {
protected:
    int maxAltitudeM;
public:
    Flyable(int alt) : maxAltitudeM(alt) {}
    void fly() { cout << "  Flying up to " << maxAltitudeM << "m!" << endl; }
    void land() { cout << "  Landing safely." << endl; }
};

class Swimmable {
protected:
    int maxDepthM;
public:
    Swimmable(int depth) : maxDepthM(depth) {}
    void swim() { cout << "  Swimming at " << maxDepthM << "m depth!" << endl; }
    void dive() { cout << "  Diving deep!" << endl; }
};

class Walkable {
protected:
    int speedKmh;
public:
    Walkable(int s) : speedKmh(s) {}
    void walk() { cout << "  Walking at " << speedKmh << " km/h" << endl; }
};

// Duck inherits from THREE classes!
class Duck : public Flyable, public Swimmable, public Walkable {
private:
    string name;
public:
    Duck(string n) : Flyable(500), Swimmable(3), Walkable(5), name(n) {}

    void quack() { cout << name << " says: QUACK!" << endl; }

    void showAbilities() {
        cout << "\n=== " << name << "'s Abilities ===" << endl;
        cout << "Flying:" << endl; fly();
        cout << "Swimming:" << endl; swim();
        cout << "Walking:" << endl; walk();
        cout << "Max altitude: " << maxAltitudeM << "m" << endl;
        cout << "Max depth: " << maxDepthM << "m" << endl;
        cout << "Walk speed: " << speedKmh << " km/h" << endl;
    }
};

// Penguin can swim and walk, but NOT fly!
class Penguin : public Swimmable, public Walkable {
private:
    string name;
public:
    Penguin(string n) : Swimmable(50), Walkable(3), name(n) {}
    void waddle() { cout << name << " waddles adorably!" << endl; }
};

int main() {
    Duck donald("Donald");
    donald.quack();
    donald.showAbilities();

    cout << "\n=== Penguin ===" << endl;
    Penguin pingu("Pingu");
    pingu.swim();    // From Swimmable
    pingu.walk();    // From Walkable
    pingu.waddle();  // Own method
    // pingu.fly();  // ERROR! Penguin doesn't inherit Flyable!
    return 0;
}
