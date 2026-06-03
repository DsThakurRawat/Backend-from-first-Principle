# ===== SERVER over TLS =====
with open("server.key", "rb") as k, open("server.crt", "rb") as c:
    creds = grpc.ssl_server_credentials([(k.read(), c.read())])
server.add_secure_port("[::]:443", creds)   # encrypted port

# ===== CLIENT over TLS =====
with open("ca.crt", "rb") as f:
    channel_creds = grpc.ssl_channel_credentials(root_certificates=f.read())

# ===== Per-call token, composed with the channel credentials =====
class TokenAuth(grpc.AuthMetadataPlugin):
    def __init__(self, token): self.token = token
    def __call__(self, context, callback):
        callback((("authorization", f"Bearer {self.token}"),), None)  # adds metadata per call

call_creds = grpc.metadata_call_credentials(TokenAuth(token))
composite  = grpc.composite_channel_credentials(channel_creds, call_creds)
channel    = grpc.secure_channel("api.example.com:443", composite)
