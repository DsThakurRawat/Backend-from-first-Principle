from fastapi.middleware.cors import CORSMiddleware

# Handles the OPTIONS preflight and all the headers for you.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],   # exact origin when credentials are on
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
    max_age=86400,                           # cache the approval for 24h
)
