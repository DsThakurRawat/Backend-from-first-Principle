/*
class           object 
animal          -> cow,horse,bull,snake
in cpp a object is created from class we gonna use myClass 

*/
class MyClass{
    public:
    int myNum;
    string myString;
};
int main(){
    MyClass myObj;
    myObj.myNum = 15;
    myObj.myString = "some text";

    cout << myObj.myNum << nl;
    cout << myObj.myString;
    return 0;


}