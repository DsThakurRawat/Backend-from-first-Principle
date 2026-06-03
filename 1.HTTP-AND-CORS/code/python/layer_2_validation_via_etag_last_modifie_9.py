import hashlib
from fastapi import Request, Response

@app.get("/resource")
def get_resource(request: Request):
    body = load_resource()
    etag = '"' + hashlib.sha256(body).hexdigest()[:16] + '"'  # fingerprint

    if request.headers.get("if-none-match") == etag:   # already cached
        return Response(status_code=304)               # 304, no body — payload saved

    return Response(content=body, status_code=200,
                    headers={"ETag": etag, "Cache-Control": "max-age=10"})
