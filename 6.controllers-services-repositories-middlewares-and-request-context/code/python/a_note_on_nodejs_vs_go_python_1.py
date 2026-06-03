from dataclasses import dataclass
from flask import request, jsonify

@dataclass
class CreateBookRequest:
    title: str
    author: str

def create_book_handler():
    # Step 1 + 2: extract body and deserialize into a native dict/class.
    payload = request.get_json(silent=True)
    if payload is None:
        # Deserialization failed -> malformed payload.
        return jsonify({"error": "invalid request body"}), 400
    req = CreateBookRequest(**payload)
    # ... validation, transformation, delegation follow ...
