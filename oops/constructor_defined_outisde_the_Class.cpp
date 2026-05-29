//Constructor Defined Outside the Class
// you can als define the constructor outside the class using scope resolution operator ::
class Car{ //class
    public://specifier
    string brand;//attribute
    string model;//attribute
    int year//attribtue
    Car(string x,string y,int z);
};

Car::Car(string x,string y,int z){
    brand x;
    model = y;
    year = z;

}
int main(){
    Car carObj1("BMW","X5",1999);
    Car carObj2("Ford","Mustang",1969);

// print values
cout << carObj1.brand << " "<<carObj1.model << " "<<carObj1.year<<nl;
cout << carObj2.brand <<" "<< carObj2.model << " "<<carObj2.year << nl;

}