/*
 * PROBLEM 2: Database Connection Manager
 * TASK: Constructor opens connection, destructor closes it. Track queries.
 * Compile: g++ prob2_database_connection.cpp -o prob2 && ./prob2
 */
#include <iostream>
#include <string>
using namespace std;

class DBConnection {
private:
    string dbName;
    bool connected;
    int queryCount;
public:
    DBConnection(string name) : dbName(name), connected(true), queryCount(0) {
        cout << "[DB] Connection to '" << dbName << "' established." << endl;
    }
    void query(string sql) {
        if (!connected) { cout << "[DB] ERROR: Not connected!" << endl; return; }
        queryCount++;
        cout << "[DB] Executing: " << sql << " — OK (" << queryCount << " total)" << endl;
    }
    bool isConnected() { return connected; }
    ~DBConnection() {
        cout << "[DB] Closing '" << dbName << "' (" << queryCount << " queries executed)" << endl;
        connected = false;
    }
};

void fetchUsers() {
    DBConnection db("app_users");
    db.query("SELECT * FROM users");
    db.query("SELECT COUNT(*) FROM users");
    cout << "Function ending — destructor will fire automatically..." << endl;
}

int main() {
    cout << "=== Starting ===" << endl;
    fetchUsers();
    cout << "=== Connection was auto-cleaned ===" << endl;
    return 0;
}
