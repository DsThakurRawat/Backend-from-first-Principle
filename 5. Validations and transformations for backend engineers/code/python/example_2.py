from pydantic import BaseModel
from typing import List


class TypePayload(BaseModel):
    stringField: str
    numberField: float
    arrayField:  List[str]   # recursive: EVERY element a string
    boolField:   bool


# Strict, explicit type errors:
#
# TypePayload(stringField="x", numberField="x",
#             arrayField="x", boolField="x")
#   -> numberField: Input should be a valid number
#   -> arrayField:  Input should be a valid list
#   -> boolField:   Input should be a valid boolean
#
# TypePayload(..., arrayField=[1, 2], ...)
#   -> arrayField.0: Input should be a valid string
#   -> arrayField.1: Input should be a valid string
#
# TypePayload(stringField="something", numberField=10,
#             arrayField=["one","two"], boolField=False) -> OK
