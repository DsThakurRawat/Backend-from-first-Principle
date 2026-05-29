/*
 * ABSTRACTION EXAMPLE 1: Car Engine System
 * 
 * SITUATION: A driver only needs start(), stop(), accelerate().
 * All internal engine mechanics (fuel injection, spark plugs,
 * transmission) are hidden behind a simple interface.
 * 
 * Compile: g++ ex1_car_engine.cpp -o ex1 && ./ex1
 */

#include <iostream>
using namespace std;

class Car {
private:
    bool engineRunning;
    int speed;
    double fuelLevel;
    int rpm;

    // Hidden internal mechanics
    void checkOil() { cout << "  [Internal] Oil level checked — OK" << endl; }
    void injectFuel() { cout << "  [Internal] Fuel injected into cylinders" << endl; }
    void igniteSpark() { cout << "  [Internal] Spark plugs ignited" << endl; }
    void engageTransmission() { cout << "  [Internal] Transmission engaged in gear 1" << endl; }
    void disengageTransmission() { cout << "  [Internal] Transmission disengaged" << endl; }
    void cutFuelSupply() { cout << "  [Internal] Fuel supply line closed" << endl; }
    void coolEngine() { cout << "  [Internal] Cooling fan activated" << endl; }

    void adjustRPM(int targetSpeed) {
        rpm = targetSpeed * 40;
        if (rpm > 6000) rpm = 6000;
    }

public:
    Car(double fuel) : engineRunning(false), speed(0), fuelLevel(fuel), rpm(0) {}

    // SIMPLE PUBLIC INTERFACE — hides all complexity
    void start() {
        if (engineRunning) {
            cout << "Car is already running!" << endl;
            return;
        }
        if (fuelLevel <= 0) {
            cout << "Cannot start — no fuel!" << endl;
            return;
        }
        cout << "\nStarting car..." << endl;
        checkOil();
        injectFuel();
        igniteSpark();
        engageTransmission();
        engineRunning = true;
        rpm = 800;
        cout << "Car started! RPM: " << rpm << endl;
    }

    void accelerate(int amount) {
        if (!engineRunning) {
            cout << "Start the car first!" << endl;
            return;
        }
        if (fuelLevel <= 0) {
            cout << "Out of fuel! Car stalling..." << endl;
            stop();
            return;
        }
        speed += amount;
        if (speed > 200) speed = 200;
        fuelLevel -= amount * 0.1;
        adjustRPM(speed);
        cout << "Speed: " << speed << " km/h | RPM: " << rpm
             << " | Fuel: " << fuelLevel << "L" << endl;
    }

    void brake(int amount) {
        if (!engineRunning) return;
        speed -= amount;
        if (speed < 0) speed = 0;
        adjustRPM(speed);
        cout << "Braking... Speed: " << speed << " km/h" << endl;
    }

    void stop() {
        if (!engineRunning) {
            cout << "Car is already stopped!" << endl;
            return;
        }
        cout << "\nStopping car..." << endl;
        disengageTransmission();
        cutFuelSupply();
        coolEngine();
        engineRunning = false;
        speed = 0;
        rpm = 0;
        cout << "Car stopped safely." << endl;
    }
};

int main() {
    Car myCar(50.0);

    myCar.accelerate(20);  // Can't — not started
    myCar.start();
    myCar.accelerate(30);
    myCar.accelerate(50);
    myCar.brake(20);
    myCar.stop();

    return 0;
}
