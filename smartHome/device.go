package smarthome

import "fmt"

type Device struct {
	Name     string
	isActive bool
}

func (d *Device) TurnOn() {
	d.isActive = true
	fmt.Printf("[%s] is now ON", d.Name)
}
func (d *Device) TurnOFF() {
	d.isActive = false
	fmt.Printf("[%s] is now OFF.\n", d.Name)
}

type SmartLight struct{
	Device     // Embedded
	Color      string
	Brightness int
}

// Shadowing (Overriding) TurnOn to add specific behavior
func (l *SmartLight) TurnOn() {
	l.Device.TurnOn() // Call base method
	fmt.Printf(" -> Setting %s light to %d%% brightness.\n", l.Color, l.Brightness)
}

// Derived Struct: Smart Thermostat
type SmartThermostat struct {
	Device     // Embedded
	TargetTemp float64
}

func (t *SmartThermostat) TurnOn() {
	t.Device.TurnOn()
	fmt.Printf(" -> Heating to %.1f degrees.\n", t.TargetTemp)
}
