package validate

type Signup struct {
    Password string `json:"password" validate:"required,min=8"`
    // eqfield: must equal another field on the struct
    PasswordConf string `json:"passwordConfirmation" \
        validate:"required,eqfield=Password"`
    Married *bool `json:"married" validate:"required"`
    // required_if: partner required only if married == true
    Partner string `json:"partner" \
        validate:"required_if=Married true"`
}

// {password:"random", passwordConfirmation:"another",
//  married:false}
//   -> password: must be at least 8 characters
//   -> passwordConfirmation: passwords don't match
//
// {password:"random12", passwordConfirmation:"random12",
//  married:true}
//   -> partner: required when married is true
