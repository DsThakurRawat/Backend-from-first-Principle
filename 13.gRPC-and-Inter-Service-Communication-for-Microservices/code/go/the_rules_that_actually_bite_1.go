syntax = "proto3";              // always declare the syntax; proto3 is current

package user.v1;                // namespace + a versioning convention (v1, v2...)

option go_package = "example.com/gen/userv1;userv1";  // where generated Go lands

// A message is a typed record. Each FIELD has a type, a name, and a NUMBER.
message User {
  string id          = 1;       // the "= 1" is the FIELD NUMBER, not a value
  string email       = 2;
  string full_name   = 3;
  Role   role        = 4;       // a nested enum (declared below)
  repeated string tags = 5;     // "repeated" = a list/array of strings
  int64  created_at  = 6;       // unix seconds; proto3 has no native date
}

// An enum is a fixed set of named values. The first MUST be 0 (the default).
enum Role {
  ROLE_UNSPECIFIED = 0;         // 0 is the implicit default — reserve it
  ROLE_MEMBER      = 1;
  ROLE_ADMIN       = 2;
}

message GetUserRequest  { string id = 1; }
message GetUserResponse { User user = 1; }   // messages nest inside messages

message CreateUserRequest {
  string email     = 1;
  string full_name = 2;
  optional string phone = 3;    // "optional" tracks presence: set vs unset vs ""
}

// A SERVICE is a set of methods. Each takes one message and returns one message.
service UserService {
  rpc GetUser    (GetUserRequest)    returns (GetUserResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
}
