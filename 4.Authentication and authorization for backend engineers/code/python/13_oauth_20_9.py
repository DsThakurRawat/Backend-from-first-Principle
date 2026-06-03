import base64, hashlib, secrets, requests

# Build the PKCE pair before redirecting the user.
def new_pkce():
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge

# Leg 2: exchange the code (send code_verifier, not the secret).
def exchange(code: str, verifier: str) -> dict:
    resp = requests.post("https://auth.example/token", data={
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  "https://notes.app/callback",
        "client_id":     "note_app",
        "code_verifier": verifier,
    })
    resp.raise_for_status()
    return resp.json()   # access_token, refresh_token, id_token, ...
