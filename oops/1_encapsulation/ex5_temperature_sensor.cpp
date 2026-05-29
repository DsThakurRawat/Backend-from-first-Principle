/*
 * ENCAPSULATION EXAMPLE 5: IoT Temperature Sensor
 * 
 * SITUATION: An IoT temperature sensor that reads values from hardware.
 * The raw sensor reading must be calibrated internally. Users only get 
 * the calibrated, validated temperature. Invalid readings (sensor malfunction)
 * are automatically rejected.
 * 
 * KEY CONCEPT: Internal processing is completely hidden. The outside world
 *              only sees clean, validated output.
 * 
 * Compile: g++ ex5_temperature_sensor.cpp -o ex5 && ./ex5
 */

#include <iostream>
using namespace std;

class TemperatureSensor {
private:
    double rawReading;
    double calibrationOffset;
    double minValidTemp;
    double maxValidTemp;
    bool isMalfunctioning;
    int readingCount;
    int validReadings;
    int rejectedReadings;

    // PRIVATE: Apply calibration offset to raw reading
    double calibrate(double raw) {
        return raw + calibrationOffset;
    }

    // PRIVATE: Check if temperature is within valid sensor range
    bool isValidReading(double temp) {
        return temp >= minValidTemp && temp <= maxValidTemp;
    }

public:
    TemperatureSensor(double offset, double minTemp, double maxTemp) {
        calibrationOffset = offset;
        minValidTemp = minTemp;
        maxValidTemp = maxTemp;
        rawReading = 0;
        isMalfunctioning = false;
        readingCount = 0;
        validReadings = 0;
        rejectedReadings = 0;
    }

    // PUBLIC: Feed a new raw sensor reading
    void feedReading(double raw) {
        readingCount++;
        double calibrated = calibrate(raw);

        if (isValidReading(calibrated)) {
            rawReading = raw;
            isMalfunctioning = false;
            validReadings++;
            cout << "Reading #" << readingCount << ": " << calibrated 
                 << "°C [OK]" << endl;
        } else {
            isMalfunctioning = true;
            rejectedReadings++;
            cout << "Reading #" << readingCount << ": " << calibrated 
                 << "°C [REJECTED - Out of range " << minValidTemp 
                 << " to " << maxValidTemp << "]" << endl;
        }
    }

    // PUBLIC: Get the last valid calibrated temperature
    double getTemperature() {
        if (isMalfunctioning) {
            cout << "WARNING: Last reading was invalid. Returning last good reading." << endl;
        }
        return calibrate(rawReading);
    }

    // PUBLIC: Get sensor health status
    void displayStatus() {
        cout << "\n--- Sensor Status ---" << endl;
        cout << "Total Readings: " << readingCount << endl;
        cout << "Valid: " << validReadings << " | Rejected: " << rejectedReadings << endl;
        cout << "Current Temperature: " << calibrate(rawReading) << "°C" << endl;
        cout << "Sensor Health: " << (isMalfunctioning ? "WARNING" : "OK") << endl;
        cout << "Valid Range: " << minValidTemp << "°C to " << maxValidTemp << "°C" << endl;
    }

    bool isHealthy() { return !isMalfunctioning; }
    int getTotalReadings() { return readingCount; }
};

int main() {
    // Create sensor: offset +1.5°C, valid range -40°C to 60°C
    TemperatureSensor sensor(1.5, -40.0, 60.0);

    cout << "=== Feeding Sensor Readings ===" << endl;
    sensor.feedReading(22.0);     // 22 + 1.5 = 23.5°C — Valid
    sensor.feedReading(35.5);     // 35.5 + 1.5 = 37.0°C — Valid
    sensor.feedReading(100.0);    // 100 + 1.5 = 101.5°C — Rejected!
    sensor.feedReading(-50.0);    // -50 + 1.5 = -48.5°C — Rejected!
    sensor.feedReading(25.0);     // 25 + 1.5 = 26.5°C — Valid

    sensor.displayStatus();

    // The outside world never sees raw readings or calibration logic
    // It just gets clean, validated temperature data
    cout << "\nFinal temperature: " << sensor.getTemperature() << "°C" << endl;

    return 0;
}

/*
 * KEY TAKEAWAY:
 * The calibration offset, raw readings, and validation logic are all
 * completely hidden from the outside world. The user of this class
 * just feeds raw data in and gets clean, validated temperatures out.
 * They never need to know HOW calibration works internally.
 */
