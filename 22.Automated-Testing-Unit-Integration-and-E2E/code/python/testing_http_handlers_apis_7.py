from fastapi.testclient import TestClient
from app import app   # the REAL FastAPI app (dependencies may be overridden with fakes §6)

client = TestClient(app)   # drives the app in-process — no network, no running server

def test_create_user_returns_201():
    # Act: fire a real request through routing + handler + serialization
    resp = client.post("/api/v1/users", json={"email": "a@x.com", "name": "Ada"})

    # Assert: on the real response — status, headers, body
    assert resp.status_code == 201
    assert resp.headers["content-type"].startswith("application/json")
    assert resp.json()["email"] == "a@x.com"

# FastAPI tip: override real dependencies with fakes via app.dependency_overrides
# so the handler runs but the repo is in-memory — an integration test of the web layer.
