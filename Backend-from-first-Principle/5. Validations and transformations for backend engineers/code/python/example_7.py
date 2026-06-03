from pydantic import BaseModel, EmailStr, field_validator


class Contact(BaseModel):
    email: EmailStr
    phone: str

    # field_validators double as transformers: whatever
    # they return REPLACES the incoming value.
    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.strip().lower()       # normalize case

    @field_validator("phone")
    @classmethod
    def add_plus(cls, v: str) -> str:
        v = v.strip()
        return v if v.startswith("+") else "+" + v


# Contact(email="Test@TEST.com", phone="1234567")
#   -> email="test@test.com", phone="+1234567"
