@app.patch("/v1/organizations/{id}")
def update_organization(id: str, body: dict, if_match: str | None = Header(None)):
    org = store.get(id)
    if org is None:
        raise HTTPException(404, "organization not found")
    # optimistic concurrency: reject stale writes
    if if_match is not None and if_match != org.etag:
        raise HTTPException(412, "resource changed; re-fetch and retry")
    updated = store.patch(id, body)   # merge only the given fields, don't replace
    return Response(
        content=json.dumps(updated),
        media_type="application/json",
        headers={"ETag": updated["etag"]},
    )                                  # 200 + updated entity
