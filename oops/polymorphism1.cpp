/*

Polymorphism
        Polymorphism means "many forms", and it occurs when we have many classes that are related to each other by inheritance.

        Like we specified in the previous chapter; Inheritance lets us inherit attributes and methods from another class. Polymorphism uses those methods to perform different tasks. This allows us to perform a single action in different ways.

        For example, imagine a base class Animal with a method called makeSound(). Derived classes of Animals could be Pigs, Cats, Dogs, Birds, etc. Every animal can "make a sound", but each one sounds different:

        Pig: wee wee
        Dog: bow wow
        Bird: tweet tweet
        This is polymorphism - the same action (making a sound) behaves differently for each animal:


















*/
class Animal{
    public:
    void animalSound(){
        cout << "The animal makes a sound"<<nl;

    }
};

class Pig : public Animal {
    public:
    void animalSound(){
        cout << "The pig say:wee wee"<<nl;
    }
};

// Derived class
class Dog : public Animal {
  public:
    void animalSound() {
      cout << "The dog says: bow wow \n";
    }
};


//Remember from the Inheritance chapter that we use the : symbol to inherit from a class.// Base class
//Now we can create Pig and Dog objects and override the animalSound() method:


class Animal {
  public:
    void animalSound() {
      cout << "The animal makes a sound \n";
    }
};

// Derived class
class Pig : public Animal {
  public:
    void animalSound() {
      cout << "The pig says: wee wee \n";
    }
};

// Derived class
class Dog : public Animal {
  public:
    void animalSound() {
      cout << "The dog says: bow wow \n";
    }
};

int main() {
  Animal myAnimal;
  Pig myPig;
  Dog myDog;

  myAnimal.animalSound();
  myPig.animalSound();
  myDog.animalSound();
  return 0;
}

/*


Why And When To Use "Inheritance" and "Polymorphism"?
- It is useful for code reusability: reuse attributes and methods of an existing class when you create a new class.




*/