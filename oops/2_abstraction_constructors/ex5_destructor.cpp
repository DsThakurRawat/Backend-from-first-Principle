/*
 * ABSTRACTION EXAMPLE 5: Destructor & Resource Cleanup
 * 
 * SITUATION: A DatabaseConnection class opens a connection in the constructor
 * and MUST close it in the destructor. Without proper cleanup, you get
 * resource leaks — connections pile up until the database server crashes.
 * 
 * Compile: g++ ex5_destructor.cpp -o ex5 && ./ex5
 */

#include <iostream>
#include <string>
using namespace std;

class DatabaseConnection {
private:
    string dbName;
    string host;
    bool isConnected;
    int queryCount;

public:
    // Constructor — opens connection
    DatabaseConnection(string db, string h) {
        dbName = db;
        host = h;
        isConnected = true;
        queryCount = 0;
        cout << "[DB] Connected to '" << dbName << "' at " << host << endl;
    }

    void executeQuery(string query) {
        if (!isConnected) {
            cout << "[DB] ERROR: Not connected!" << endl;
            return;
        }
        queryCount++;
        cout << "[DB] Query #" << queryCount << ": " << query << " — OK" << endl;
    }

    int getQueryCount() { return queryCount; }

    // DESTRUCTOR — automatically closes connection when object dies
    ~DatabaseConnection() {
        if (isConnected) {
            cout << "[DB] Closing connection to '" << dbName
                 << "' (executed " << queryCount << " queries)" << endl;
            isConnected = false;
        }
        cout << "[DB] Connection object destroyed." << endl;
    }
};

void processUserData() {
    // Connection is created when this function starts
    DatabaseConnection db("users_db", "localhost:5432");

    db.executeQuery("SELECT * FROM users");
    db.executeQuery("INSERT INTO users (name) VALUES ('Alice')");
    db.executeQuery("UPDATE users SET active = true WHERE id = 1");

    // When this function ends, 'db' goes out of scope
    // The destructor is called AUTOMATICALLY — connection is closed!
    cout << "[Function] processUserData() is ending..." << endl;
}

int main() {
    cout << "=== Program Start ===" << endl;

    processUserData();

    cout << "\n=== Back in main ===" << endl;
    cout << "The DB connection was automatically cleaned up!" << endl;

    // Demonstrating with dynamic allocation
    cout << "\n=== Dynamic Allocation ===" << endl;
    DatabaseConnection* db2 = new DatabaseConnection("orders_db", "localhost:5432");
    db2->executeQuery("SELECT * FROM orders");

    // Must manually delete — destructor fires here
    delete db2;

    cout << "\n=== Program End ===" << endl;
    return 0;
}
