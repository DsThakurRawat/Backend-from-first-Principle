//Define a Method Inside the Class
/*
There are two ways to define functions that belongs to a class:

   >>Inside class definition
   >>Outside class definition





*/
class MyClass{
    public:
    void myMethod(){
        cout << "Hello World";
    }
};

int main(){
    MyClass myObj;
    myObj.myMethod();
    return 0;
}