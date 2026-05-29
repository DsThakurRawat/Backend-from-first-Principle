// multilevel inheritence
/*

Mulitilevel Inheritance
A class can also be derived from one class, which is already derived from another class
in the following example, MyGrandChild is derived from class Mychild(which is derived from MyClass)


*/

// Base Class(parent)

class MyClass{
    public:
    void MyFunction(){
        cout << "Some Content in parent class"
    }
};

//derived class(child)

class MyChild: public MyClass{

};

// Derived Class (grandchild)

class MyGrandChild: public MyChild{

};
int main(){
    MyGrandChild myObj;
    myObj.MyFunction();
    return 0;
}
//What is multilevel inheritance in C++?
// A class that is derived from another derived class