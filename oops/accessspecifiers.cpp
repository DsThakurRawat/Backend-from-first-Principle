/*
Access Specifiers
Access specifiers control how the members (attributes and methods) of a class can be accessed.

They help protect data and organize code so that only the right parts can be seen or changed.



Using Access Specifiers
The public keyword is an access specifier.

In the example below, the members are public - which means that they can be accessed and modified from outside the code:












*/

/*
Private
        Members declared as private cannot be accessed from outside the class.
        In the following example, we demonstrate the differences between public and p

        
*/
class MyClass{
    public: // Public access specifier
    int x;// Public attribute

    private: // Private access specifier
    int y;  // Private attribute
};
int main(){
    MyClass myObj;
    myObj.x = 25;// Allowed (public)
    myObj.y = 50;// Not allowed (private)
    return 0;/ Allowed (public)
}

/*


Note: It is possible to access private members of a class using a public method inside the same class. See the next chapter (Encapsulation) on how to do this.

Tip: It is considered good practice to declare your class attributes as private (as often as you can). This will reduce the possibility of yourself (or others) to mess up the code. This is also the main ingredient of the Encapsulation concept, which you will learn more about in the next chapter.





*/

class MyClass {
  public:    // Public access specifier
    int x;   // Public attribute
  private:   // Private access specifier
    int y;   // Private attribute
};

int main() {
  MyClass myObj;
  myObj.x = 25;  // Allowed (public)
  myObj.y = 50;  // Not allowed (private)
  return 0;
}

class MyClass {
  int x;   // Private attribute
  int y;   // Private attribute
};

/*
Public: Like the front door of your house - anyone can come in.
Private: Like a locked drawer - only the owner (or trusted friends) can open it.
Protected: Like a family-only room - children (subclasses) can enter, others cannot.




*/