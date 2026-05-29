class Car{// the class
    public: // access specifier
    string brand;//attribute
    string model;//attribute
    int year;//attribute
    Car(string x,string y,int x){//contructor with parameter
    brand = x;
    model = y;
    year = z;

}
};
int main(){
    // create a car objects and call the constructor with differant values
    Car carObj1("BMW","X5",1999);
    Car carObj2("Ford","Mustang",1969);
    // print value;

    cout << carObj1.brand << " "<<carObj1.model << " "<<carObj1.year<<"\n";
    cout << carObj2.brand<<" "<<carObj2.model << " "<<carObj2.year << "\n";
    return 0;



}