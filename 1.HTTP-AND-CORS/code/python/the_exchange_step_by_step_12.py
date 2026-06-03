# Starlette's FileResponse honors Range requests and emits 206 automatically.
from fastapi.responses import FileResponse

@app.get("/big.zip")
def download():
    return FileResponse("big.zip", media_type="application/zip")
