from pydantic import BaseModel, Field, model_validator


class Signup(BaseModel):
    password: str = Field(min_length=8)
    passwordConfirmation: str
    married: bool
    partner: str | None = None

    # mode="after": runs once all fields are parsed,
    # so it can compare them against each other.
    @model_validator(mode="after")
    def cross_field_rules(self):
        if self.password != self.passwordConfirmation:
            raise ValueError("passwords don't match")
        if self.married and not self.partner:
            raise ValueError(
                "partner name is required when married is true")
        return self


# Signup(password="random", passwordConfirmation="another",
#        married=False)
#   -> password: String should have at least 8 characters
#   -> Value error, passwords don't match
