from fastapi import Request, Response, HTTPException, Header

@app.put("/doc/{id}")
def update_doc(id: int, request: Request, if_match: str = Header(default="")):
    doc = db.get(id)
    if not if_match:
        raise HTTPException(400, "If-Match required")
    if if_match != doc.etag:                  # someone changed it first -> conflict
        raise HTTPException(412, "version conflict")   # 412
    doc.apply(request)
    doc.etag = new_etag()                     # bump the version
    db.save(doc)
    return Response(status_code=200, headers={"ETag": doc.etag})
