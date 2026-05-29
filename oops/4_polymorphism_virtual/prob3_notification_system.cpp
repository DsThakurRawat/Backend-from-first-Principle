/*
 * PROBLEM 3: Multi-channel Notification System
 *
 * PROBLEM STATEMENT:
 * Design a polymorphic messaging engine:
 * - Base class 'Notification' with pure virtual send(string msg).
 * - Subclass 'Email': Stores recipient address. Sends message to email.
 * - Subclass 'SMS': Stores phone number. Sends message to phone number (shorten message to 160 characters).
 * - Subclass 'PushNotification': Stores device Token. Sends system alert.
 * Manage these notifications using a loop.
 *
 * Compile: g++ prob3_notification_system.cpp -o prob3 && ./prob3
 */

#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Notification {
public:
    virtual void send(string msg) = 0;
    virtual ~Notification() {}
};

class Email : public Notification {
private:
    string emailAddress;

public:
    Email(string addr) : emailAddress(addr) {}

    void send(string msg) override {
        cout << "[Email System] Sending to <" << emailAddress << ">:\n  Content: " << msg << endl;
    }
};

class SMS : public Notification {
private:
    string phoneNumber;

public:
    SMS(string num) : phoneNumber(num) {}

    void send(string msg) override {
        // Enforce 160 characters limit for SMS channel
        string finalMsg = msg;
        if (msg.length() > 160) {
            finalMsg = msg.substr(0, 157) + "...";
        }
        cout << "[SMS Gateway] Sending to " << phoneNumber << ":\n  SMS Body: " << finalMsg << endl;
    }
};

class PushNotification : public Notification {
private:
    string deviceToken;

public:
    PushNotification(string token) : deviceToken(token) {}

    void send(string msg) override {
        cout << "[Push APNS/FCM] Sending alert to Token: " << deviceToken.substr(0, 8) 
             << "... \n  Alert message: " << msg << endl;
    }
};

int main() {
    Email mail("divyansh.rawat@work.com");
    SMS text("+91-9876543210");
    PushNotification push("apns_token_9x77c22h88a0");

    vector<Notification*> broadcastList = {&mail, &text, &push};

    string alertText = "CRITICAL WARNING: CPU temperature on Node 1 is exceeding 95°C! Immediate attention is required to prevent node crashes.";

    cout << "=== Dispatching Alerts Polymorphically ===" << endl;
    for (Notification* alert : broadcastList) {
        alert->send(alertText);
        cout << "------------------------------------------" << endl;
    }

    return 0;
}
