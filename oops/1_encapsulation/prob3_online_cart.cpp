/*
 * PROBLEM 3: Online Shopping Cart
 * 
 * PROBLEM STATEMENT:
 * Create a ShoppingCart class with the following requirements:
 * - Store items (name + price) privately, max 10 items
 * - Provide methods to add items, remove by index, and view cart
 * - Auto-calculate total price
 * - Apply 10% discount ONLY if total exceeds $100
 * - Items cannot have negative prices
 * 
 * Compile: g++ prob3_online_cart.cpp -o prob3 && ./prob3
 */

#include <iostream>
#include <string>
using namespace std;

class ShoppingCart {
private:
    string itemNames[10];
    double itemPrices[10];
    int itemCount;
    static const int MAX_ITEMS = 10;
    static constexpr double DISCOUNT_THRESHOLD = 100.0;
    static constexpr double DISCOUNT_RATE = 0.10;

    double calculateTotal() {
        double total = 0;
        for (int i = 0; i < itemCount; i++)
            total += itemPrices[i];
        return total;
    }

    double calculateDiscount() {
        double total = calculateTotal();
        if (total > DISCOUNT_THRESHOLD) return total * DISCOUNT_RATE;
        return 0;
    }

public:
    ShoppingCart() { itemCount = 0; }

    bool addItem(string name, double price) {
        if (itemCount >= MAX_ITEMS) {
            cout << "Cart is full! (Max " << MAX_ITEMS << " items)" << endl;
            return false;
        }
        if (price <= 0) {
            cout << "ERROR: Price must be positive!" << endl;
            return false;
        }
        itemNames[itemCount] = name;
        itemPrices[itemCount] = price;
        itemCount++;
        cout << "Added '" << name << "' ($" << price << ") to cart." << endl;
        return true;
    }

    bool removeItem(int index) {
        if (index < 0 || index >= itemCount) {
            cout << "ERROR: Invalid item index!" << endl;
            return false;
        }
        cout << "Removed '" << itemNames[index] << "' from cart." << endl;
        for (int i = index; i < itemCount - 1; i++) {
            itemNames[i] = itemNames[i + 1];
            itemPrices[i] = itemPrices[i + 1];
        }
        itemCount--;
        return true;
    }

    void viewCart() {
        if (itemCount == 0) {
            cout << "\nYour cart is empty!" << endl;
            return;
        }
        double total = calculateTotal();
        double discount = calculateDiscount();

        cout << "\n╔═══════════════════════════════╗" << endl;
        cout << "║       SHOPPING CART           ║" << endl;
        cout << "╠═══════════════════════════════╣" << endl;
        for (int i = 0; i < itemCount; i++) {
            cout << "║ " << i << ". " << itemNames[i] << " — $" << itemPrices[i] << endl;
        }
        cout << "╠───────────────────────────────╣" << endl;
        cout << "║ Subtotal:  $" << total << endl;
        if (discount > 0) {
            cout << "║ Discount:  -$" << discount << " (10% off!)" << endl;
            cout << "║ TOTAL:     $" << (total - discount) << endl;
        } else {
            cout << "║ (Add $" << (DISCOUNT_THRESHOLD - total + 0.01)
                 << " more for 10% discount!)" << endl;
            cout << "║ TOTAL:     $" << total << endl;
        }
        cout << "╚═══════════════════════════════╝" << endl;
    }

    int getItemCount() { return itemCount; }
};

int main() {
    ShoppingCart cart;

    cart.addItem("Keyboard", 45.99);
    cart.addItem("Mouse", 25.50);
    cart.addItem("Monitor", 199.99);
    cart.addItem("Bad Item", -10);  // Blocked!

    cart.viewCart();  // Should show 10% discount (total > $100)

    cout << "\n--- Removing Monitor ---" << endl;
    cart.removeItem(2);
    cart.viewCart();  // No discount now (total < $100)

    return 0;
}
