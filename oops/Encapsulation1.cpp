/*

Encapsulation
    The meaning of Encapsulation, is to make sure that "sensitive" data is hidden from users.

    To achieve this, you must declare class variables/attributes as private (cannot be accessed from outside the class).

    If you want others to read or modify the value of a private member, you can provide public get and set methods.

Real-Life Example
    Think of an employee's salary:

    The salary is private - the employee can't change it directly
    Only their manager can update it or share it when appropriate
    Encapsulation works the same way. The data is hidden, and only trusted methods can access or modify it.



Access Private Members
    To access a private attribute, use public "get" and "set" methods:






*/

#include<iostream>
using namespace std;
class Employee{
    private:
    // private attribute
    int salary;
    public:
    // setter
    void setSalary(int s){
        salary = s;
    }
    //getter
    int getSalary(){
        return salary;

    }
};
int main(){
    Employee myObj;
    myObj.setSalary(50000);
    cout << myObj.getSalary();
    return 0;
}
/*

Example explained
    salary is private - it cannot be accessed directly
    setSalary() sets the value
    getSalary() returns the value
    We use myObj.setSalary(50000) to assign a value, and myObj.getSalary() to print it.

Why Encapsulation?
    It is considered good practice to declare your class attributes as private (as often as you can). Encapsulation ensures better control of your data, because you (or others) can change one part of the code without affecting other parts
    Increased security of data



*/

