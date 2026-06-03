import asyncio
from fastapi import UploadFile
from fastapi.responses import StreamingResponse

# 1. Receive a multipart upload
@app.post("/upload")
async def upload(file: UploadFile):
    data = await file.read()        # UploadFile streams to a temp file under the hood
    return {"received": file.filename, "size": len(data)}

# 2. Stream a response in chunks (Server-Sent Events)
@app.get("/stream")
async def stream():
    async def gen():
        for i in range(5):
            yield f"data: chunk {i}\n\n"
            await asyncio.sleep(1)
    return StreamingResponse(gen(), media_type="text/event-stream")
