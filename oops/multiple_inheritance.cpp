/*

Multiple Inheritance
A class can also be derived from more than one base class, using a comma-separated list:






*/
//Base Class

class MyClass{
    public:
    void myFunction(){
        cout << "Some content in parent class"<<nl;
    }
};

// ANother Base class
class MyotherClass{
    public:
    void myOtherFunction(){
        cout << "some content in another class";
    }
};


// Derived class
class MyChildClass: public MyClass, public MyOtherClass {
};

int main() {
  MyChildClass myObj;
  myObj.myFunction();
  myObj.myOtherFunction();
  return 0;
}