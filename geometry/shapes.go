package geometry

import (
	"fmt"
	"math"
)

// ============================================================
// ABSTRACTION (Interface)
// ============================================================
// Shape is an INTERFACE — it defines a CONTRACT (a set of rules).
// Any struct that has BOTH Area() and Perimeter() methods
// automatically satisfies this interface — no "implements" keyword needed.
//
// This is ABSTRACTION because:
//   - The caller only knows WHAT can be done (Area, Perimeter)
//   - The caller does NOT know HOW it's done internally
//
// C++ equivalent:
//   class Shape {
//       public:
//           virtual double Area() = 0;      // pure virtual
//           virtual double Perimeter() = 0; // pure virtual
//   };
type Shape interface {
	Area() float64
	Perimeter() float64
}

// ============================================================
// ENCAPSULATION (Letter Casing = Access Control)
// ============================================================
// Circle struct — notice "Radius" starts with UPPERCASE 'R'
// Uppercase = EXPORTED (Public) = anyone importing this package can access it
//
// From main.go:  c.Radius = 5  ✅ Works — Radius is public
//
// C++ equivalent:
//   class Circle {
//       public:
//           double Radius;  // public because uppercase in Go
//   };
type Circle struct {
	Radius float64 // Uppercase R = Exported (Public) — accessible from ANY package
}

// ============================================================
// POLYMORPHISM (Circle's own version of Area)
// ============================================================
// By defining Area() on Circle, Circle starts satisfying the Shape interface.
// This is Circle's OWN implementation — Rectangle will have a DIFFERENT one.
// That's polymorphism: same method name, different behavior per type.
//
// Formula: Area of a circle = π × r²
func (c *Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius // ✅ FIXED — was 2*π*r (circumference), now π*r² (area)
}

// POLYMORPHISM (Circle's own version of Perimeter)
// ✅ FIXED — this method was MISSING before.
// Without it, Circle did NOT satisfy the Shape interface,
// and the compiler would REFUSE to pass Circle to PrintShapeDetails().
//
// Formula: Perimeter (circumference) of a circle = 2πr
func (c *Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius // Circumference = 2πr
}

// ============================================================
// ENCAPSULATION (Mixed Access — Private + Public fields)
// ============================================================
// Rectangle has TWO fields with DIFFERENT visibility:
//   - "width"  → lowercase 'w' = UNEXPORTED (Private) = HIDDEN from outside
//   - "Height" → uppercase 'H' = EXPORTED (Public) = visible to everyone
//
// From main.go:
//   r.Height = 10  ✅ Works — uppercase = public
//   r.width = 5    ❌ COMPILER ERROR — lowercase = private
//
// Only code INSIDE the "geometry" package can touch "width".
// This IS encapsulation — you're hiding internal data.
//
// C++ equivalent:
//   class Rectangle {
//       private:
//           double width;   // private because lowercase in Go
//       public:
//           double Height;  // public because uppercase in Go
//   };
type Rectangle struct {
	width  float64 // lowercase w = Unexported (Private) — ONLY this package can access
	Height float64 // Uppercase H = Exported (Public) — any package can access
}

// ============================================================
// POLYMORPHISM (Rectangle's own version of Area)
// ============================================================
// Rectangle has its OWN Area() — different formula than Circle's Area().
// Same method name "Area()", but completely different behavior.
// That's the "many forms" in polymorphism.
func (r *Rectangle) Area() float64 {
	return r.width * r.Height
}

// POLYMORPHISM (Rectangle's own version of Perimeter)
// Rectangle now has BOTH Area() and Perimeter() →
// it fully satisfies the Shape interface ✅
func (r *Rectangle) Perimeter() float64 {
	return 2 * (r.width + r.Height)
}

// ============================================================
// POLYMORPHISM IN ACTION (The magic function)
// ============================================================
// This function accepts the INTERFACE type "Shape" — not Circle, not Rectangle.
// It doesn't care WHAT you pass in, as long as it has Area() and Perimeter().
//
// Pass a Circle    → calls Circle's Area() and Circle's Perimeter()
// Pass a Rectangle → calls Rectangle's Area() and Rectangle's Perimeter()
// Pass a Triangle (future) → would call Triangle's methods
//
// ONE function, MANY behaviors = Polymorphism
//
// C++ equivalent:
//   void PrintShapeDetails(Shape* s) {
//       cout << s->Area() << " | " << s->Perimeter();
//   }
func PrintShapeDetails(s Shape) {
	fmt.Printf("Area: %.2f | Perimeter: %.2f\n", s.Area(), s.Perimeter())
}
