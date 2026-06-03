from pydantic import BaseModel, Field


class Pagination(BaseModel):
    # Pydantic AUTO-CASTS the incoming string "2" into
    # int 2 (transform), THEN enforces gt/lt (validate)
    # -- both steps in one schema, in the right order.
    page:  int = Field(gt=0, lt=500)
    limit: int = Field(gt=0, lt=10_000)


# request: /bookmarks?page=2&limit=20
# (both values arrive as strings)
#
# Pagination(page="2", limit="20")
#   -> Pagination(page=2, limit=20)   # real ints
#
# Pagination(page="0", limit="20")
#   -> page: Input should be greater than 0
#
# Pagination(page="abc", limit="20")
#   -> page: Input should be a valid integer
