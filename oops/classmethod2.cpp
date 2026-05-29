/*

Define a Method Outside the Class
Sometimes it is better to declare the method in the class and define it later (especially in large programs).

This is done by specifiying the name of the class, followed the scope resolution :: operator, followed by the name of the function:


*/
class MyClass{ // The class
    public: // Access specifier
    void myMethod();// Method/function declaration
};
// Method/function definition outside the class
void MyClass::myMethod(){
    cout << "Hellow World"<<nl;
}
int main(){
    MyClass myObj;// Create an object of MyClass
    myObj.myMethod(); // Call the method
    return 0;
}