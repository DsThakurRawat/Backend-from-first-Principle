// you can create a multiple objects of one class

class Car {
    public:
    string brand;
    string model;
    int year;
};
int main(){

     // Create an object of Car
    Car carobje1;
    carobje1.brand = "BMW";
    carObje.model = "X5";
    carObje1.year = 1999;

    // create another object of car
    Car carObj2;
    carObj2.brand   = "ford";
    carObj2.model = "Mustang";
    carObj2.year = 1969;

    // Print attribute values
  cout << carObj1.brand << " " << carObj1.model << " " << carObj1.year << "\n";
  cout << carObj2.brand << " " << carObj2.model << " " << carObj2.year << "\n";
  return 0;


}