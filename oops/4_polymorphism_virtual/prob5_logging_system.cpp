/*
 * PROBLEM 5: Labeled System Logging Gateway
 *
 * PROBLEM STATEMENT:
 * Define an abstract class 'Logger' for telemetry output:
 * - Pure virtual function void writeLog(string message, string level)
 * Implement three sub-classes:
 * - ConsoleLogger: Prints logs to the terminal with color labels.
 * - FileLogger: Simulates appending logs to a virtual log file.
 * - DatabaseLogger: Simulates logging messages as raw INSERT SQL statements.
 * Demonstrate routing single log messages to multiple outputs.
 *
 * Compile: g++ prob5_logging_system.cpp -o prob5 && ./prob5
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Logger {
public:
    virtual void writeLog(string message, string level) = 0;
    virtual ~Logger() {}
};

class ConsoleLogger : public Logger {
public:
    void writeLog(string message, string level) override {
        string color = "\033[0m"; // Default
        if (level == "ERROR") color = "\033[1;31m"; // Red
        else if (level == "WARNING") color = "\033[1;33m"; // Yellow
        else if (level == "INFO") color = "\033[1;32m"; // Green

        cout << color << "[" << level << "] " << message << "\033[0m" << endl;
    }
};

class FileLogger : public Logger {
private:
    string filename;

public:
    FileLogger(string fname) : filename(fname) {}

    void writeLog(string message, string level) override {
        cout << "[File: " << filename << "] Writing line: " << level << " | " << message << endl;
    }
};

class DatabaseLogger : public Logger {
public:
    void writeLog(string message, string level) override {
        cout << "[Database Engine] Executing: INSERT INTO system_logs (log_level, log_text) VALUES ('" 
             << level << "', '" << message << "');" << endl;
    }
};

int main() {
    ConsoleLogger console;
    FileLogger file("app_telemetry.log");
    DatabaseLogger db;

    vector<Logger*> systemLoggers = {&console, &file, &db};

    cout << "=== Telemetry Simulation Mode ===" << endl;
    
    // Broadcast info log
    for (auto* logger : systemLoggers) {
        logger->writeLog("Server successfully bound to port 8080", "INFO");
    }
    cout << "--------------------------------------------------------" << endl;

    // Broadcast warning log
    for (auto* logger : systemLoggers) {
        logger->writeLog("Database connections count approaching limit (92/100)", "WARNING");
    }
    cout << "--------------------------------------------------------" << endl;

    // Broadcast error log
    for (auto* logger : systemLoggers) {
        logger->writeLog("OutOfMemoryError encountered in worker pool thread 12", "ERROR");
    }
    cout << "--------------------------------------------------------" << endl;

    return 0;
}
