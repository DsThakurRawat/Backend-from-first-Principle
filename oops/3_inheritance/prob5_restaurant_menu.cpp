/*
 * PROBLEM 5: Restaurant Menu System — MenuItem → FoodItem, DrinkItem
 *
 * PROBLEM STATEMENT:
 * Create a base class 'MenuItem' representing items in a restaurant:
 * - Name, basePrice (double).
 * - displayItem() method.
 * Implement 'FoodItem' class derived from MenuItem:
 * - Additional properties: calories, isVegetarian (bool).
 * - Override displayItem() to show veg/non-veg indicator and calorie count.
 * Implement 'DrinkItem' class derived from MenuItem:
 * - Additional properties: volumeMl, isAlcoholic (bool).
 * - Override displayItem() to show volume and alcohol warnings if applicable.
 * - Override price calculation to include a 15% luxury/sin tax if isAlcoholic is true.
 *
 * Compile: g++ prob5_restaurant_menu.cpp -o prob5 && ./prob5
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class MenuItem {
protected:
    string name;
    double basePrice;

public:
    MenuItem(string n, double p) : name(n), basePrice(p) {}

    virtual double getPrice() {
        return basePrice;
    }

    virtual void displayItem() {
        cout << name << " — $" << getPrice() << endl;
    }

    virtual ~MenuItem() {}
};

class FoodItem : public MenuItem {
private:
    int calories;
    bool isVegetarian;

public:
    FoodItem(string n, double p, int c, bool veg)
        : MenuItem(n, p), calories(c), isVegetarian(veg) {}

    void displayItem() override {
        string tag = isVegetarian ? "[Veg]" : "[Non-Veg]";
        cout << tag << " " << name << " | Calories: " << calories 
             << " kcal | Price: $" << getPrice() << endl;
    }
};

class DrinkItem : public MenuItem {
private:
    int volumeMl;
    bool isAlcoholic;

public:
    DrinkItem(string n, double p, int vol, bool alc)
        : MenuItem(n, p), volumeMl(vol), isAlcoholic(alc) {}

    double getPrice() override {
        if (isAlcoholic) {
            return basePrice * 1.15; // 15% extra tax
        }
        return basePrice;
    }

    void displayItem() override {
        string tag = isAlcoholic ? "[Alcoholic - 21+ Only]" : "[Soft Drink]";
        cout << tag << " " << name << " (" << volumeMl << "ml) | Price: $" << getPrice() << endl;
    }
};

int main() {
    FoodItem burger("Double Cheese Burger", 8.99, 650, false);
    FoodItem salad("Garden Caesar Salad", 6.50, 220, true);
    DrinkItem cola("Classic Cola", 1.99, 330, false);
    DrinkItem beer("Craft IPA Beer", 6.00, 500, true);

    vector<MenuItem*> menu = {&burger, &salad, &cola, &beer};

    cout << "=== RESTAURANT MENU ===" << endl;
    double billTotal = 0.0;
    for (auto* item : menu) {
        item->displayItem();
        billTotal += item->getPrice();
    }

    cout << "\n=======================" << endl;
    cout << "Subtotal for one of each item: $" << billTotal << endl;
    cout << "=======================" << endl;

    return 0;
}
