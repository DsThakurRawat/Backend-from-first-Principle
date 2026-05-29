package fleet

import (
	"fmt"
)

type vehicle struct{
	Brand string
	Speed int
	Capacity int
}

func (v *vehicle) StartEngine(){
	fmt.Printf("The %s engine is starting. Vroom!\n", v.Brand)
}

func (v *vehicle) DisplayInfo(){
	fmt.Printf("Brand: %s | Max Speed : %d km/h | Capacity: %d\n", v.Brand, v.Speed, v.Capacity)
}

// derived struct 1 : Car
type Car struct {
	vehicle // inheritance
	NumDoors int
	isElectric bool
}

// shadowing overriding Display info

func (c *Car) DisplayInfo(){
	c.vehicle.DisplayInfo()
	typeStr := "Gasoline"
	if c.isElectric{
		typeStr = "Electric"
	}
	fmt.Printf("Type: Car | Doors: %d | Engine: %s\n", c.NumDoors, typeStr)
}

type Truck struct{
	vehicle // embedded or inheritance used here
	PayloadCapacity float64
}

func (t *Truck) LoadCargo(weight float64){
	if weight <= t.PayloadCapacity {
		fmt.Printf("Loaded %.2f tons of cargo onto the %s truck.\n", weight, t.Brand)
	} else {
		fmt.Printf("ERROR: Cargo weight %.2f exceeds capacity of %.2f tons!\n", weight, t.PayloadCapacity)
	}
}