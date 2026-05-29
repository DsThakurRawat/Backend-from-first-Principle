/*
 * PROBLEM 4: Health Tracker (BMI Calculator)
 * 
 * PROBLEM STATEMENT:
 * Create a HealthTracker class with the following requirements:
 * - Store name, height (cm), and weight (kg) privately
 * - Height must be between 50-250 cm, weight between 10-300 kg
 * - Auto-calculate BMI whenever height or weight changes
 * - Provide a method that returns health category:
 *   Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (>=30)
 * - BMI is read-only — cannot be set manually
 * 
 * Compile: g++ prob4_health_tracker.cpp -o prob4 && ./prob4
 */

#include <iostream>
#include <string>
using namespace std;

class HealthTracker {
private:
    string name;
    double heightCm;
    double weightKg;
    double bmi;

    void calculateBMI() {
        double heightM = heightCm / 100.0;
        bmi = weightKg / (heightM * heightM);
    }

    bool isValidHeight(double h) { return h >= 50 && h <= 250; }
    bool isValidWeight(double w) { return w >= 10 && w <= 300; }

public:
    HealthTracker(string n, double height, double weight) {
        name = n;
        heightCm = isValidHeight(height) ? height : 170;
        weightKg = isValidWeight(weight) ? weight : 70;
        calculateBMI();
    }

    bool setHeight(double h) {
        if (!isValidHeight(h)) {
            cout << "ERROR: Height must be 50-250 cm!" << endl;
            return false;
        }
        heightCm = h;
        calculateBMI();
        return true;
    }

    bool setWeight(double w) {
        if (!isValidWeight(w)) {
            cout << "ERROR: Weight must be 10-300 kg!" << endl;
            return false;
        }
        weightKg = w;
        calculateBMI();
        return true;
    }

    string getCategory() {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25.0) return "Normal";
        if (bmi < 30.0) return "Overweight";
        return "Obese";
    }

    double getBMI() { return bmi; }
    string getName() { return name; }

    void displayReport() {
        cout << "\n--- Health Report: " << name << " ---" << endl;
        cout << "Height: " << heightCm << " cm" << endl;
        cout << "Weight: " << weightKg << " kg" << endl;
        cout << "BMI: " << bmi << endl;
        cout << "Category: " << getCategory() << endl;

        if (getCategory() == "Underweight")
            cout << "Recommendation: Increase calorie intake." << endl;
        else if (getCategory() == "Normal")
            cout << "Recommendation: Keep up the good work!" << endl;
        else if (getCategory() == "Overweight")
            cout << "Recommendation: Consider more exercise." << endl;
        else
            cout << "Recommendation: Please consult a doctor." << endl;
    }
};

int main() {
    HealthTracker tracker("Divyansh", 175, 72);
    tracker.displayReport();

    cout << "\n--- After Weight Change ---" << endl;
    tracker.setWeight(95);
    tracker.displayReport();

    // Invalid inputs — blocked
    tracker.setHeight(10);    // Too short
    tracker.setWeight(500);   // Too heavy

    // BMI cannot be set manually:
    // tracker.bmi = 22.0;  // COMPILE ERROR!

    return 0;
}
