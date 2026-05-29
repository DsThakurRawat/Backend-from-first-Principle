/*
 * PROBLEM 4: Vehicle Rental System — Vehicle → Car, Bike, Truck
 *
 * PROBLEM STATEMENT:
 * Create a base class 'Vehicle' representing general rental details:
 * - Brand, model, rentalRatePerDay (double).
 * - displayDetails() and calculateRent(int days) methods.
 * Implement 'Car' class derived from Vehicle:
 * - Additional properties: passengerCapacity, hasAC (bool).
 * - Override displayDetails() to include car-specific features.
 * - Override calculateRent(int days) to add a 10% premium if hasAC is true.
 * Implement 'Bike' class derived from Vehicle:
 * - Additional properties: engineCC.
 * - Override displayDetails().
 * Implement 'Truck' class derived from Vehicle:
 * - Additional properties: cargoCapacityTons.
 * - Override calculateRent(int days) to charge an extra $50 per day for cargo handling.
 *
 * Compile: g++ prob4_vehicle_rental.cpp -o prob4 && ./prob4
 */

#include <iostream>
#include <string>
using namespace std;

class Vehicle {
protected:
    string brand;
    string model;
    double rentalRatePerDay;

public:
    Vehicle(string b, string m, double rate) : brand(b), model(m), rentalRatePerDay(rate) {}

    virtual void displayDetails() {
        cout << brand << " " << model << " | Base Rate: $" << rentalRatePerDay << "/day" << endl;
    }

    virtual double calculateRent(int days) {
        return rentalRatePerDay * days;
    }

    virtual ~Vehicle() {}
};

class Car : public Vehicle {
private:
    int passengerCapacity;
    bool hasAC;

public:
    Car(string b, string m, double rate, int cap, bool ac)
        : Vehicle(b, m, rate), passengerCapacity(cap), hasAC(ac) {}

    void displayDetails() override {
        cout << "[Car] " << brand << " " << model 
             << " | Capacity: " << passengerCapacity << " passengers"
             << " | AC: " << (hasAC ? "Yes" : "No") 
             << " | Rate: $" << rentalRatePerDay << "/day" << endl;
    }

    double calculateRent(int days) override {
        double base = Vehicle::calculateRent(days);
        if (hasAC) {
            base += base * 0.10; // 10% AC premium
        }
        return base;
    }
};

class Bike : public Vehicle {
private:
    int engineCC;

public:
    Bike(string b, string m, double rate, int cc)
        : Vehicle(b, m, rate), engineCC(cc) {}

    void displayDetails() override {
        cout << "[Bike] " << brand << " " << model 
             << " | Engine: " << engineCC << "cc"
             << " | Rate: $" << rentalRatePerDay << "/day" << endl;
    }
};

class Truck : public Vehicle {
private:
    double cargoCapacityTons;

public:
    Truck(string b, string m, double rate, double cargo)
        : Vehicle(b, m, rate), cargoCapacityTons(cargo) {}

    void displayDetails() override {
        cout << "[Truck] " << brand << " " << model 
             << " | Cargo Capacity: " << cargoCapacityTons << " tons"
             << " | Rate: $" << rentalRatePerDay << "/day" << endl;
    }

    double calculateRent(int days) override {
        // Base rent + $50 per day cargo surcharge
        return (rentalRatePerDay + 50.0) * days;
    }
};

int main() {
    Car sedan("Toyota", "Camry", 50.0, 5, true);
    Bike scooter("Honda", "Activa", 15.0, 110);
    Truck cargoTruck("Volvo", "FH16", 150.0, 20.0);

    Vehicle* inventory[] = {&sedan, &scooter, &cargoTruck};
    int days = 5;

    cout << "=== Rental Inventory Details (Rental Duration: " << days << " days) ===" << endl;
    for (auto* v : inventory) {
        v->displayDetails();
        cout << "  Calculated Rent: $" << v->calculateRent(days) << endl;
        cout << "--------------------------------------------------------" << endl;
    }

    return 0;
}
