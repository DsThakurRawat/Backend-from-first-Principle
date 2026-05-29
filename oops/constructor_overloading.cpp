/*

Constructor Overloading
In C++, you can have more than one constructor in the same class. This is called constructor overloading.

Each constructor must have a different number or type of parameters, so the compiler knows which one to use when you create an object.



Why Use Constructor Overloading?
    To give flexibility when creating objects
    To set default or custom values
    To reduce repetitive code



*/
class Car{
    public:
    string brand;
    string model;
    
    Car(){
        brand = "Unknown";
        model = "Unknown";

    }
    Car(string b,string m){
        brand = b;
        model = m;
    }

};

int main(){
    Car car1;
    Car car2("BMW","X5");
    car car3("Ford","Mustang");
    cout << "Car1: " << car1.brand << " " << car1.model << "\n";
  cout << "Car2: " << car2.brand << " " << car2.model << "\n";
  cout << "Car3: " << car3.brand << " " << car3.model;
  return 0;

}
