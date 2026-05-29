/*
 * PROBLEM 4: File Handler with Destructor
 * TASK: Opens file in constructor, closes in destructor. Provides read/write.
 * Compile: g++ prob4_file_handler.cpp -o prob4 && ./prob4
 */
#include <iostream>
#include <string>
using namespace std;

class FileHandler {
private:
    string filename;
    bool isOpen;
    string content;  // Simulated file content
    int writeCount;
public:
    FileHandler(string fname) : filename(fname), isOpen(true), content(""), writeCount(0) {
        cout << "[File] Opened '" << filename << "' for read/write" << endl;
    }

    void write(string text) {
        if (!isOpen) { cout << "[File] ERROR: File is closed!" << endl; return; }
        content += text + "\n";
        writeCount++;
        cout << "[File] Written line #" << writeCount << ": " << text << endl;
    }

    string read() {
        if (!isOpen) { cout << "[File] ERROR: File is closed!" << endl; return ""; }
        return content;
    }

    ~FileHandler() {
        if (isOpen) {
            cout << "[File] Saving and closing '" << filename
                 << "' (" << writeCount << " writes)" << endl;
            isOpen = false;
        }
    }
};

void generateReport() {
    FileHandler report("monthly_report.txt");
    report.write("=== Monthly Sales Report ===");
    report.write("Total Revenue: $125,000");
    report.write("Growth: +15%");

    cout << "\n[Reading file contents:]" << endl;
    cout << report.read();
    cout << "Function ending..." << endl;
    // Destructor auto-closes and saves the file!
}

int main() {
    generateReport();
    cout << "File was auto-saved and closed!" << endl;
    return 0;
}
