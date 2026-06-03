from datetime import date
from pydantic import BaseModel, EmailStr, Field


class Contact(BaseModel):
    email: EmailStr                       # local @ domain.tld
    # country code + 7-15 digits
    phone: str = Field(pattern=r"^\+?[0-9]{7,15}$")
    date:  date                           # only accepts YYYY-MM-DD


# Contact(email="randomstring", phone=1234567,
#         date="2025-11-05")
#   -> email: value is not a valid email address
#   -> phone: Input should be a valid string
#
# Contact(email="bad@", ...)
#   -> email: there must be something after the @-sign
#
# Contact(email="test@test.com", phone="1234567",
#         date="2025-11-05")  -> OK
