/*
 * ENCAPSULATION EXAMPLE 4: Password Manager
 * 
 * SITUATION: A password manager where the actual password is NEVER exposed.
 * It is stored as a hash. The only operations allowed are: set password,
 * verify password, and check password strength.
 * 
 * KEY CONCEPT: Sensitive data is hidden and can never be retrieved — only verified.
 * 
 * Compile: g++ ex4_password_manager.cpp -o ex4 && ./ex4
 */

#include <iostream>
#include <string>
using namespace std;

class PasswordManager {
private:
    string username;
    size_t passwordHash;  // We store the HASH, NEVER the actual password
    int failedAttempts;
    bool isLocked;

    // PRIVATE: Simple hash function (DJB2 algorithm)
    size_t hashPassword(string pwd) {
        size_t h = 5381;
        for (char c : pwd) {
            h = ((h << 5) + h) + c;
        }
        return h;
    }

    // PRIVATE: Calculate password strength score
    int calculateStrength(string pwd) {
        int score = 0;
        if (pwd.length() >= 8) score++;
        if (pwd.length() >= 12) score++;

        bool hasUpper = false, hasLower = false;
        bool hasDigit = false, hasSpecial = false;

        for (char c : pwd) {
            if (isupper(c)) hasUpper = true;
            if (islower(c)) hasLower = true;
            if (isdigit(c)) hasDigit = true;
            if (!isalnum(c)) hasSpecial = true;
        }

        if (hasUpper) score++;
        if (hasLower) score++;
        if (hasDigit) score++;
        if (hasSpecial) score++;
        return score;  // Max = 6
    }

public:
    PasswordManager(string user, string pwd) {
        username = user;
        passwordHash = hashPassword(pwd);
        failedAttempts = 0;
        isLocked = false;
    }

    // Verify password — returns true/false, NEVER exposes the hash
    bool verifyPassword(string attempt) {
        if (isLocked) {
            cout << "ACCOUNT LOCKED! Too many failed attempts." << endl;
            return false;
        }

        if (hashPassword(attempt) == passwordHash) {
            failedAttempts = 0;  // Reset on success
            return true;
        } else {
            failedAttempts++;
            cout << "Wrong password! Attempts remaining: " 
                 << (3 - failedAttempts) << endl;
            if (failedAttempts >= 3) {
                isLocked = true;
                cout << "ACCOUNT LOCKED after 3 failed attempts!" << endl;
            }
            return false;
        }
    }

    // Change password — requires old password verification first
    bool changePassword(string oldPwd, string newPwd) {
        if (isLocked) {
            cout << "ACCOUNT LOCKED! Cannot change password." << endl;
            return false;
        }
        if (hashPassword(oldPwd) != passwordHash) {
            cout << "ERROR: Old password is incorrect!" << endl;
            return false;
        }
        if (newPwd.length() < 6) {
            cout << "ERROR: New password must be at least 6 characters!" << endl;
            return false;
        }
        if (calculateStrength(newPwd) < 3) {
            cout << "ERROR: New password is too weak! Add uppercase, digits, or special chars." << endl;
            return false;
        }

        passwordHash = hashPassword(newPwd);
        cout << "Password changed successfully!" << endl;
        return true;
    }

    // Check strength of any given password string
    void checkStrength(string pwd) {
        int score = calculateStrength(pwd);
        string levels[] = {"Very Weak", "Weak", "Fair", "Moderate", "Strong", "Very Strong", "Excellent"};
        cout << "Password \"" << pwd << "\" strength: " 
             << levels[score] << " (" << score << "/6)" << endl;
    }

    // Unlock account (admin function)
    void unlockAccount() {
        isLocked = false;
        failedAttempts = 0;
        cout << "Account unlocked by admin." << endl;
    }

    string getUsername() { return username; }
    bool getIsLocked() { return isLocked; }
};

int main() {
    PasswordManager pm("divyansh", "MyP@ss123");

    // Check password strengths
    pm.checkStrength("abc");
    pm.checkStrength("password123");
    pm.checkStrength("MyP@ss123");

    // Try to login
    cout << "\n--- Login Attempts ---" << endl;
    cout << "Attempt 1 (wrong): " << (pm.verifyPassword("wrong") ? "OK" : "FAILED") << endl;
    cout << "Attempt 2 (wrong): " << (pm.verifyPassword("also_wrong") ? "OK" : "FAILED") << endl;
    cout << "Attempt 3 (wrong): " << (pm.verifyPassword("still_wrong") ? "OK" : "FAILED") << endl;
    cout << "Attempt 4 (correct): " << (pm.verifyPassword("MyP@ss123") ? "OK" : "FAILED") << endl;

    // Unlock and try again
    cout << "\n--- Admin Unlock ---" << endl;
    pm.unlockAccount();
    cout << "Login: " << (pm.verifyPassword("MyP@ss123") ? "SUCCESS!" : "FAILED") << endl;

    // Change password
    cout << "\n--- Change Password ---" << endl;
    pm.changePassword("wrong", "NewPass");           // Blocked! Wrong old password
    pm.changePassword("MyP@ss123", "abc");            // Blocked! Too short
    pm.changePassword("MyP@ss123", "NewSecure@456");  // Works!

    return 0;
}

/*
 * KEY TAKEAWAY:
 * The actual password string is NEVER stored anywhere in memory.
 * Only its hash exists. Even if a hacker reads the object's memory,
 * they cannot reverse-engineer the original password from the hash.
 * This is REAL-WORLD security through encapsulation.
 */
