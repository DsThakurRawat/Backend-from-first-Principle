/*
 * PROBLEM 1: Library Book Tracker
 * 
 * PROBLEM STATEMENT:
 * Create a Book class for a library system with the following requirements:
 * - Store book title, author, ISBN, total copies, and available copies (all private)
 * - Available copies can only change through borrow() and returnBook() methods
 * - Available copies can NEVER go negative
 * - Available copies can NEVER exceed total copies
 * - Track total number of times the book has been borrowed
 * 
 * Compile: g++ prob1_library_book.cpp -o prob1 && ./prob1
 */

#include <iostream>
#include <string>
using namespace std;

class Book {
private:
    string title;
    string author;
    string isbn;
    int totalCopies;
    int availableCopies;
    int totalBorrows;

public:
    Book(string t, string a, string i, int copies) {
        title = t;
        author = a;
        isbn = i;
        totalCopies = (copies > 0) ? copies : 1;
        availableCopies = totalCopies;
        totalBorrows = 0;
    }

    bool borrow() {
        if (availableCopies > 0) {
            availableCopies--;
            totalBorrows++;
            cout << "'" << title << "' borrowed successfully! "
                 << "(" << availableCopies << "/" << totalCopies << " available)" << endl;
            return true;
        }
        cout << "ERROR: No copies of '" << title << "' available!" << endl;
        return false;
    }

    bool returnBook() {
        if (availableCopies < totalCopies) {
            availableCopies++;
            cout << "'" << title << "' returned! "
                 << "(" << availableCopies << "/" << totalCopies << " available)" << endl;
            return true;
        }
        cout << "ERROR: All copies of '" << title << "' are already in the library!" << endl;
        return false;
    }

    void addCopies(int count) {
        if (count > 0) {
            totalCopies += count;
            availableCopies += count;
            cout << count << " copies added. Total: " << totalCopies << endl;
        }
    }

    // Getters
    string getTitle() { return title; }
    string getAuthor() { return author; }
    int getAvailable() { return availableCopies; }
    int getTotalBorrows() { return totalBorrows; }

    void displayInfo() {
        cout << "\n--- Book Info ---" << endl;
        cout << "Title: " << title << endl;
        cout << "Author: " << author << endl;
        cout << "ISBN: " << isbn << endl;
        cout << "Available: " << availableCopies << "/" << totalCopies << endl;
        cout << "Total Borrows: " << totalBorrows << endl;
    }
};

int main() {
    Book b("Clean Code", "Robert C. Martin", "978-0132350884", 3);

    b.displayInfo();

    cout << "\n--- Borrowing ---" << endl;
    b.borrow();  // 2/3
    b.borrow();  // 1/3
    b.borrow();  // 0/3
    b.borrow();  // Blocked! No copies left

    cout << "\n--- Returning ---" << endl;
    b.returnBook();  // 1/3
    b.returnBook();  // 2/3
    b.returnBook();  // 3/3
    b.returnBook();  // Blocked! All copies already in

    b.displayInfo();
    return 0;
}
