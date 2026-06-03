from fastapi.responses import RedirectResponse

# Permanent move that must keep the method/body -> 308
@app.api_route("/user/{id}", methods=["GET", "POST"])
def old_route(id: int):
    return RedirectResponse(f"/person/{id}", status_code=308)

# Post/Redirect/Get -> 303 so a browser refresh won't re-POST the form
@app.post("/submit")
def submit_form():
    rid = save()
    return RedirectResponse(f"/results/{rid}", status_code=303)  # forces GET
