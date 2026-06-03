# uvicorn can serve TLS directly with a cert + key pair:
#   uvicorn main:app --port 443 --ssl-certfile server.crt --ssl-keyfile server.key
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=443,
            ssl_certfile="server.crt", ssl_keyfile="server.key")
# Production note: usually terminate TLS at a proxy/LB and run plain HTTP behind it.
