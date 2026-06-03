from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError


# CreateBook is the SCHEMA. Each annotation = one rule:
#   no default      -> existence check (required)
#   : str           -> type check
#   min/max_length  -> constraint check
class CreateBook(BaseModel):
    name: str = Field(min_length=5, max_length=100)


def run_pipeline(raw: dict) -> CreateBook:
    """Decode + validate in one call.
    Raises a 400-ready error on failure."""
    try:
        # constructing the model runs all three layers
        # in order: existence -> type -> constraint
        return CreateBook(**raw)
    except ValidationError as e:
        # reshape pydantic errors into clean strings
        messages = [
            f"{err['loc'][0]}: {err['msg']}"
            for err in e.errors()
        ]
        raise HTTPException(status_code=400, detail=messages)


# run_pipeline({})            -> 400 ["name: Field required"]
# run_pipeline({"name": 0})   -> 400 ["name: Input should be
#                                      a valid string"]
# run_pipeline({"name": "ab"})-> 400 ["name: String should
#                                      have at least 5 chars"]
# run_pipeline({"name": "Dune"}) ... still <5 -> 400
# run_pipeline({"name": "The Hobbit"}) -> OK
