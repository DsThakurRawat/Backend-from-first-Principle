from fastapi import Request
from fastapi.responses import JSONResponse

def error_response(status, code, message, details=None, request_id=""):
    return JSONResponse(status_code=status, content={"error": {
        "code": code,
        "message": message,
        "details": details or [],
        "requestId": request_id,
    }})  # SAME shape for every error in the whole API

# usage
error_response(
    422, "validation_failed", "Some fields are invalid.",
    details=[
        {"field": "email", "issue": "must be a valid email"},
        {"field": "age",   "issue": "must be >= 0"},
    ],
)
