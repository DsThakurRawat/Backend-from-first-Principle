package main

import ("encoding/json"; "fmt"; "time")

// ABSTRACTION: Serializer names a capability — "turn data into
// bytes and back" — without binding to a concrete format. Code
// depends on this contract, so JSON could be swapped for another
// format with zero changes to callers.
type Serializer interface {
    Serialize(v any) ([]byte, error)   // native -> common format
    Deserialize(data []byte, v any) error // common format -> native
}

// POLYMORPHISM: JSONSerializer implements Serializer. Any other
// format (YAML, Protobuf) could implement the same interface and
// be used interchangeably through a Serializer variable.
type JSONSerializer struct{}

func (JSONSerializer) Serialize(v any) ([]byte, error) {
    return json.Marshal(v)   // SERIALIZE: struct -> JSON bytes
}
func (JSONSerializer) Deserialize(data []byte, v any) error {
    return json.Unmarshal(data, v) // DESERIALIZE: JSON bytes -> struct
}

// "INHERITANCE" via COMPOSITION: BaseModel holds shared fields;
// embedding it into User reuses them (and their json tags).
type BaseModel struct {
    ID        int       `json:"id"`         // tag = the JSON key name
    CreatedAt time.Time `json:"created_at"`
}

// ENCAPSULATION: an exported struct whose JSON shape is controlled
// by tags. "password" is unexported (lowercase) -> private AND
// invisible to the JSON encoder, so it never leaks over the wire.
type User struct {
    BaseModel            // embedded -> inherits ID, CreatedAt
    Name    string      `json:"name"`
    Active  bool        `json:"active"`
    Address Address     `json:"address"` // nested object
    password string     // unexported: hidden from JSON output
}

type Address struct {
    Country string `json:"country"`
    Phone   int    `json:"phone"`
}

func main() {
    var codec Serializer = JSONSerializer{} // program to the interface

    u := User{
        BaseModel: BaseModel{ID: 1, CreatedAt: time.Now()},
        Name:      "Ada", Active: true,
        Address:   Address{Country: "India", Phone: 123456},
    }

    // SERIALIZE — native Go struct into the common JSON format
    out, _ := codec.Serialize(u)
    fmt.Println(string(out))
    // {"id":1,"created_at":"...","name":"Ada","active":true,
    //  "address":{"country":"India","phone":123456}}

    // DESERIALIZE — JSON received over HTTP back into a Go struct
    incoming := []byte(`{"name":"Lin","address":{"country":"IN","phone":42}}`)
    var back User
    codec.Deserialize(incoming, &back)
    fmt.Println(back.Name, back.Address.Country) // Lin IN
}
