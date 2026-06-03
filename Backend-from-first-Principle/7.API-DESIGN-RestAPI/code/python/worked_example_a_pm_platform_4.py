from fastapi import FastAPI, Response
app = FastAPI()

# list + create share the collection URL, split by method
@app.get("/v1/organizations")
def list_organizations(): ...      # (see section 07)

@app.post("/v1/organizations", status_code=201)   # 201 Created
def create_organization(body: dict):
    status = body.get("status") or "active"        # sane default
    return store.insert(                            # id, createdAt set server-side
        name=body["name"], status=status, description=body.get("description"),
    )

# get-one / update / delete share /{id}, split by method
@app.get("/v1/organizations/{id}")
def get_organization(id: str):
    org = store.get(id)
    if org is None:
        raise HTTPException(404, "organization not found")  # single id → 404
    return org

@app.patch("/v1/organizations/{id}")                # partial update → 200
def update_organization(id: str, body: dict):
    return store.update(id, body)

@app.delete("/v1/organizations/{id}", status_code=204)  # No Content
def delete_organization(id: str):
    store.delete(id)
    return Response(status_code=204)

# custom action: verb at the end → POST, returns 200 (created nothing)
@app.post("/v1/organizations/{id}/archive")
def archive_organization(id: str):
    return store.archive(id)   # flips status + cascades: projects, tasks, emails...
