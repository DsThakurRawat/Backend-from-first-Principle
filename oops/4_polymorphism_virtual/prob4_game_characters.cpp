/*
 * PROBLEM 4: RPG Combat Simulator
 *
 * PROBLEM STATEMENT:
 * Define an abstract class 'Character' representing a hero in a roleplaying game:
 * - Name, baseAttackPower, health.
 * - Pure virtual void attack(Character& target).
 * Implement three sub-classes:
 * - Warrior: Hits with heavy weapon. Deals physical damage (1.5x baseAttackPower). Reduces target health.
 * - Mage: Casts fire spell. Deals magical damage (1.2x baseAttackPower + burns them).
 * - Archer: Shoots critical arrows (deals flat baseAttackPower but 20% chance of double damage critical strike).
 *
 * Compile: g++ prob4_game_characters.cpp -o prob4 && ./prob4
 */

#include <iostream>
#include <string>
#include <cstdlib>
#include <ctime>
using namespace std;

class Character {
protected:
    string name;
    int health;
    int baseAttack;

public:
    Character(string n, int h, int att) : name(n), health(h), baseAttack(att) {}

    virtual void attack(Character& target) = 0;

    void takeDamage(int damage) {
        health -= damage;
        if (health < 0) health = 0;
        cout << "  " << name << " takes " << damage << " damage! (Health remaining: " << health << ")" << endl;
    }

    string getName() { return name; }
    int getHealth() { return health; }
    bool isAlive() { return health > 0; }

    virtual ~Character() {}
};

class Warrior : public Character {
public:
    Warrior(string n, int h, int att) : Character(n, h, att) {}

    void attack(Character& target) override {
        int damage = baseAttack * 1.5; // Heavy hit
        cout << "[Warrior] " << name << " swings a giant broadsword at " << target.getName() << "!" << endl;
        target.takeDamage(damage);
    }
};

class Mage : public Character {
private:
    int mana;

public:
    Mage(string n, int h, int att) : Character(n, h, att), mana(100) {}

    void attack(Character& target) override {
        if (mana >= 20) {
            mana -= 20;
            int damage = baseAttack * 1.2 + 10; // Magic bonus
            cout << "[Mage] " << name << " casts Fireball at " << target.getName() << "! (Mana left: " << mana << ")" << endl;
            target.takeDamage(damage);
        } else {
            cout << "[Mage] " << name << " is out of mana! Deals weak melee strike instead." << endl;
            target.takeDamage(5);
        }
    }
};

class Archer : public Character {
public:
    Archer(string n, int h, int att) : Character(n, h, att) {}

    void attack(Character& target) override {
        int damage = baseAttack;
        // 50% chance of critical hit (simplified for testing)
        bool isCritical = (rand() % 2 == 0);
        if (isCritical) {
            damage *= 2;
            cout << "[Archer] " << name << " shoots a CRITICAL headshot arrow at " << target.getName() << "!" << endl;
        } else {
            cout << "[Archer] " << name << " shoots a standard arrow at " << target.getName() << "!" << endl;
        }
        target.takeDamage(damage);
    }
};

int main() {
    srand(time(0)); // Seed random number generator

    Warrior conan("Conan the Barbarian", 120, 20);
    Mage gandalf("Gandalf the Grey", 80, 15);
    Archer robin("Robin Hood", 90, 18);

    cout << "=== Simulating Combat ===" << endl;

    // Conan attacks Gandalf
    conan.attack(gandalf);
    cout << "------------------------------------------" << endl;

    // Gandalf retaliates on Conan
    gandalf.attack(conan);
    cout << "------------------------------------------" << endl;

    // Robin shoots Conan
    robin.attack(conan);
    cout << "------------------------------------------" << endl;

    return 0;
}
