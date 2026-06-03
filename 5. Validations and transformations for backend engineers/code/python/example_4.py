from datetime import date
from pydantic import BaseModel, Field, field_validator


class Profile(BaseModel):
    dateOfBirth: date
    age: int = Field(ge=1, le=120)   # 430 -> must be <= 120

    @field_validator("dateOfBirth")
    @classmethod
    def not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError(
                "date of birth cannot be in the future")
        return v


# Profile(dateOfBirth="2026-06-12", age=43)
#   -> dateOfBirth: date of birth cannot be in the future
# Profile(dateOfBirth="1995-06-12", age=430)
#   -> age: Input should be less than or equal to 120
# Profile(dateOfBirth="1995-06-12", age=43) -> OK
