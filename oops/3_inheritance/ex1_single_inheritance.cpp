/*
 * INHERITANCE EXAMPLE 1: Single Inheritance (Animal → Dog)
 * Compile: g++ ex1_single_inheritance.cpp -o ex1 && ./ex1
 */
#include <iostream>
#include <string>
using namespace std;

class Animal {
protected:
    string name;
    int age;
    string sound;
public:
    Animal(string n, int a, string s) : name(n), age(a), sound(s) {
        cout << "[Animal] " << name << " created" << endl;
    }
    void eat() { cout << name << " is eating." << endl; }
    void sleep() { cout << name << " is sleeping. Zzz..." << endl; }
    void makeSound() { cout << name << " says: " << sound << endl; }
    void info() { cout << "Name: " << name << " | Age: " << age << " years" << endl; }
    virtual ~Animal() { cout << "[Animal] " << name << " destroyed" << endl; }
};

class Dog : public Animal {
private:
    string breed;
    bool isTrained;
public:
    Dog(string n, int a, string b, bool trained)
        : Animal(n, a, "Woof! Woof!"), breed(b), isTrained(trained) {
        cout << "[Dog] Breed: " << breed << endl;
    }
    void fetch() { cout << name << " fetches the ball!" << endl; }
    void rollOver() {
        if (isTrained) cout << name << " rolls over! Good boy!" << endl;
        else cout << name << " looks confused..." << endl;
    }
    void fullInfo() {
        info();
        cout << "Breed: " << breed << " | Trained: " << (isTrained ? "Yes" : "No") << endl;
    }
};

class Cat : public Animal {
private:
    bool isIndoor;
public:
    Cat(string n, int a, bool indoor)
        : Animal(n, a, "Meow!"), isIndoor(indoor) {}
    void purr() { cout << name << " is purring... prrr" << endl; }
    void scratch() { cout << name << " scratches the furniture!" << endl; }
};

int main() {
    cout << "=== Creating Dog ===" << endl;
    Dog rex("Rex", 3, "German Shepherd", true);
    rex.eat();        // From Animal
    rex.makeSound();  // From Animal
    rex.fetch();      // Dog's own
    rex.rollOver();   // Dog's own
    rex.fullInfo();

    cout << "\n=== Creating Cat ===" << endl;
    Cat whiskers("Whiskers", 5, true);
    whiskers.eat();
    whiskers.makeSound();
    whiskers.purr();

    return 0;
}
