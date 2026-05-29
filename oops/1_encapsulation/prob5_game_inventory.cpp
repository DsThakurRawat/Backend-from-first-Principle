/*
 * PROBLEM 5: Game Inventory System
 * 
 * PROBLEM STATEMENT:
 * Create an Inventory class for a game character:
 * - Max capacity is 20 items
 * - Each item has a name, weight, and rarity (Common, Rare, Epic, Legendary)
 * - Total weight cannot exceed 100 kg
 * - Provide add, remove, list, and search methods
 * - Track total items and total weight privately
 * 
 * Compile: g++ prob5_game_inventory.cpp -o prob5 && ./prob5
 */

#include <iostream>
#include <string>
using namespace std;

class Inventory {
private:
    struct Item {
        string name;
        double weight;
        string rarity;
    };

    Item items[20];
    int itemCount;
    double totalWeight;
    static const int MAX_ITEMS = 20;
    static constexpr double MAX_WEIGHT = 100.0;

    bool isValidRarity(string r) {
        return r == "Common" || r == "Rare" || r == "Epic" || r == "Legendary";
    }

public:
    Inventory() {
        itemCount = 0;
        totalWeight = 0;
    }

    bool addItem(string name, double weight, string rarity) {
        if (itemCount >= MAX_ITEMS) {
            cout << "Inventory full! Drop something first." << endl;
            return false;
        }
        if (weight <= 0) {
            cout << "ERROR: Weight must be positive!" << endl;
            return false;
        }
        if (totalWeight + weight > MAX_WEIGHT) {
            cout << "Too heavy! Current: " << totalWeight << "kg. Item: "
                 << weight << "kg. Max: " << MAX_WEIGHT << "kg." << endl;
            return false;
        }
        if (!isValidRarity(rarity)) {
            cout << "ERROR: Rarity must be Common, Rare, Epic, or Legendary!" << endl;
            return false;
        }

        items[itemCount] = {name, weight, rarity};
        totalWeight += weight;
        itemCount++;
        cout << "[+] Picked up: " << name << " (" << rarity << ", "
             << weight << "kg)" << endl;
        return true;
    }

    bool dropItem(int index) {
        if (index < 0 || index >= itemCount) {
            cout << "ERROR: Invalid item slot!" << endl;
            return false;
        }
        cout << "[-] Dropped: " << items[index].name << endl;
        totalWeight -= items[index].weight;
        for (int i = index; i < itemCount - 1; i++)
            items[i] = items[i + 1];
        itemCount--;
        return true;
    }

    int searchItem(string name) {
        for (int i = 0; i < itemCount; i++) {
            if (items[i].name == name) return i;
        }
        return -1;
    }

    void listInventory() {
        cout << "\n=== INVENTORY (" << itemCount << "/" << MAX_ITEMS
             << " slots, " << totalWeight << "/" << MAX_WEIGHT << " kg) ===" << endl;
        if (itemCount == 0) {
            cout << "  (empty)" << endl;
            return;
        }
        for (int i = 0; i < itemCount; i++) {
            cout << "  [" << i << "] " << items[i].name
                 << " | " << items[i].rarity
                 << " | " << items[i].weight << "kg" << endl;
        }
    }

    int getItemCount() { return itemCount; }
    double getTotalWeight() { return totalWeight; }
};

int main() {
    Inventory inv;

    inv.addItem("Iron Sword", 5.0, "Common");
    inv.addItem("Diamond Shield", 15.0, "Rare");
    inv.addItem("Phoenix Feather", 0.5, "Legendary");
    inv.addItem("Health Potion", 1.0, "Common");
    inv.addItem("Dragon Armor", 40.0, "Epic");

    // Try to add item that's too heavy
    inv.addItem("Giant Boulder", 50.0, "Common");  // Blocked!

    // Invalid rarity
    inv.addItem("Mystic Orb", 2.0, "SuperRare");  // Blocked!

    inv.listInventory();

    // Search and drop
    int idx = inv.searchItem("Health Potion");
    if (idx != -1) inv.dropItem(idx);

    inv.listInventory();
    return 0;
}
