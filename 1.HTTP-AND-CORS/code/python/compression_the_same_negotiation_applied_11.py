from fastapi.middleware.gzip import GZipMiddleware
from fastapi import Header

# gzip responses for capable clients, but only above a size threshold
# (compressing tiny payloads costs more CPU than it saves bytes).
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/greeting")
def greeting(accept_language: str = Header(default="en")):
    lang = "es" if accept_language.startswith("es") else "en"
    return {"en": "Hello", "es": "Hola"}[lang]
