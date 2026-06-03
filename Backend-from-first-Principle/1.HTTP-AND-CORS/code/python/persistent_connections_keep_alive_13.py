# Keep-alive is owned by the ASGI server (uvicorn), not your app code:
#   uvicorn main:app --timeout-keep-alive 60 --workers 4
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8080,
            timeout_keep_alive=60, workers=4)
