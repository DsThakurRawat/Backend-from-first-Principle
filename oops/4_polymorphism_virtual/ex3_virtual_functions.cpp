/*
 * POLYMORPHISM EXAMPLE 3: Runtime Polymorphism & Virtual Functions
 *
 * SITUATION: An OS manages system users. AdminUser and RegularUser both override
 * the login() function. Using base class pointers, we can handle logins dynamically.
 *
 * Compile: g++ ex3_virtual_functions.cpp -o ex3 && ./ex3
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class User {
protected:
    string username;

public:
    User(string u) : username(u) {}

    // Marking this method as virtual enables dynamic dispatch/runtime polymorphism
    virtual void login() {
        cout << "[User: " << username << "] Generic user logged in." << endl;
    }

    string getUsername() { return username; }

    virtual ~User() {
        cout << "[User: " << username << "] Base Destructor called." << endl;
    }
};

class AdminUser : public User {
private:
    int privilegeLevel;

public:
    AdminUser(string u, int level) : User(u), privilegeLevel(level) {}

    void login() override {
        cout << "[Admin: " << username << "] Logged in with Level-" << privilegeLevel 
             << " root access. Loading control panel..." << endl;
    }

    ~AdminUser() override {
        cout << "[Admin: " << username << "] Admin Destructor called." << endl;
    }
};

class GuestUser : public User {
public:
    GuestUser() : User("Guest") {}

    void login() override {
        cout << "[Guest User] Temporary session started. Access restricted." << endl;
    }

    ~GuestUser() override {
        cout << "[Guest User] Guest Destructor called." << endl;
    }
};

int main() {
    // We create a list of base pointers pointing to different derived objects
    vector<User*> activeSessions;

    activeSessions.push_back(new User("john_doe"));
    activeSessions.push_back(new AdminUser("divyansh_admin", 5));
    activeSessions.push_back(new GuestUser());

    cout << "=== Simulating User Logins (Polymorphic) ===" << endl;
    for (User* session : activeSessions) {
        session->login(); // Triggers correct override dynamically!
        cout << "-----------------------------------------------" << endl;
    }

    cout << "\n=== Cleaning Up Memory (Virtual Destructors fire) ===" << endl;
    for (User* session : activeSessions) {
        delete session;
        cout << "-----------------------------------------------" << endl;
    }

    return 0;
}
