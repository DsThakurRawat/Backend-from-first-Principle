/*
 * INHERITANCE EXAMPLE 2: Multilevel (Vehicle → Car → ElectricCar)
 * Compile: g++ ex2_multilevel_inheritance.cpp -o ex2 && ./ex2
 */
#include <iostream>
#include <string>
using namespace std;

class Vehicle {
protected:
    int wheels;
    int maxSpeed;
    string manufacturer;
public:
    Vehicle(int w, int s, string m) : wheels(w), maxSpeed(s), manufacturer(m) {}
    void honk() { cout << "BEEP BEEP!" << endl; }
    void showVehicle() {
        cout << "Manufacturer: " << manufacturer << " | Wheels: " << wheels
             << " | Max Speed: " << maxSpeed << " km/h" << endl;
    }
};

class Car : public Vehicle {
protected:
    int doors;
    string fuelType;
    double engineSize;
public:
    Car(string m, int s, int d, string f, double e)
        : Vehicle(4, s, m), doors(d), fuelType(f), engineSize(e) {}
    void showCar() {
        showVehicle();
        cout << "Doors: " << doors << " | Fuel: " << fuelType
             << " | Engine: " << engineSize << "L" << endl;
    }
};

class ElectricCar : public Car {
private:
    int batteryKWh;
    int rangeKm;
    bool isCharging;
public:
    ElectricCar(string m, int s, int d, int bat, int range)
        : Car(m, s, d, "Electric", 0.0), batteryKWh(bat), rangeKm(range), isCharging(false) {}

    void charge() {
        isCharging = true;
        cout << "Charging " << manufacturer << "... Battery: " << batteryKWh << " kWh" << endl;
    }
    void autopilot() {
        cout << manufacturer << " autopilot engaged! Driving at " << maxSpeed / 2 << " km/h" << endl;
    }
    void showFull() {
        cout << "\n=== " << manufacturer << " Electric Car ===" << endl;
        showCar();
        cout << "Battery: " << batteryKWh << " kWh | Range: " << rangeKm
             << " km | Charging: " << (isCharging ? "Yes" : "No") << endl;
    }
};

int main() {
    ElectricCar tesla("Tesla Model S", 250, 4, 100, 600);
    tesla.showFull();
    tesla.honk();      // From Vehicle (grandparent!)
    tesla.charge();    // ElectricCar's own
    tesla.autopilot(); // ElectricCar's own
    return 0;
}
