/*
 * PROBLEM 1: Smart Home System (Abstraction)
 * 
 * TASK: Create an abstract SmartDevice class with pure virtual turnOn(),
 * turnOff(), getStatus(). Implement SmartLight and SmartThermostat.
 * 
 * Compile: g++ prob1_smart_home.cpp -o prob1 && ./prob1
 */

#include <iostream>
#include <string>
using namespace std;

// Abstract base class
class SmartDevice {
protected:
    string deviceName;
    bool isOn;
public:
    SmartDevice(string name) : deviceName(name), isOn(false) {}
    virtual void turnOn() = 0;
    virtual void turnOff() = 0;
    virtual string getStatus() = 0;
    string getName() { return deviceName; }
    virtual ~SmartDevice() {}
};

class SmartLight : public SmartDevice {
private:
    int brightness;  // 0-100
    string color;
public:
    SmartLight(string name) : SmartDevice(name), brightness(0), color("white") {}

    void turnOn() override {
        isOn = true;
        brightness = 100;
        cout << deviceName << ": Light ON (brightness " << brightness << "%, " << color << ")" << endl;
    }

    void turnOff() override {
        isOn = false;
        brightness = 0;
        cout << deviceName << ": Light OFF" << endl;
    }

    void setBrightness(int b) {
        if (b >= 0 && b <= 100) {
            brightness = b;
            isOn = (b > 0);
        }
    }

    void setColor(string c) { color = c; }

    string getStatus() override {
        return deviceName + " — " + (isOn ? "ON" : "OFF") +
               " | Brightness: " + to_string(brightness) + "% | Color: " + color;
    }
};

class SmartThermostat : public SmartDevice {
private:
    double targetTemp;
    double currentTemp;
public:
    SmartThermostat(string name, double current)
        : SmartDevice(name), targetTemp(22), currentTemp(current) {}

    void turnOn() override {
        isOn = true;
        cout << deviceName << ": Thermostat ON (target: " << targetTemp << "°C)" << endl;
    }

    void turnOff() override {
        isOn = false;
        cout << deviceName << ": Thermostat OFF" << endl;
    }

    void setTarget(double t) {
        if (t >= 10 && t <= 35) {
            targetTemp = t;
            cout << deviceName << ": Target set to " << t << "°C" << endl;
        }
    }

    string getStatus() override {
        return deviceName + " — " + (isOn ? "ON" : "OFF") +
               " | Current: " + to_string((int)currentTemp) +
               "°C | Target: " + to_string((int)targetTemp) + "°C";
    }
};

int main() {
    SmartLight light("Living Room Light");
    SmartThermostat thermo("Main Thermostat", 18.5);

    // Use them through the abstract interface
    SmartDevice* devices[] = {&light, &thermo};

    cout << "=== Turning All Devices ON ===" << endl;
    for (auto* d : devices) d->turnOn();

    cout << "\n=== Status ===" << endl;
    for (auto* d : devices) cout << d->getStatus() << endl;

    cout << "\n=== Adjustments ===" << endl;
    light.setBrightness(50);
    light.setColor("warm yellow");
    thermo.setTarget(24);

    cout << "\n=== Updated Status ===" << endl;
    for (auto* d : devices) cout << d->getStatus() << endl;

    cout << "\n=== Turning All Devices OFF ===" << endl;
    for (auto* d : devices) d->turnOff();

    return 0;
}
