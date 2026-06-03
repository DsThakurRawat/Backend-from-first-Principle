# GET /v1/organizations?status=active&sortBy=name&sortOrder=ascending&page=1&limit=10
@app.get("/v1/organizations")
def list_organizations(
    status: str | None = None,
    sortBy: str = "createdAt",        # sane default
    sortOrder: str = "descending",    # sane default
    page: int = 1,                    # sane default
    limit: int = 10,                  # sane default
):
    filters = {}
    if status:
        filters["status"] = status    # ?status=active

    rows, total = store.query(filters, sortBy, sortOrder, page, limit)
    total_pages = (total + limit - 1) // limit   # ceil division

    return {
        "data": rows,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }
