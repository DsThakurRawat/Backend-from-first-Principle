# Python — threading model (simplified)
import threading

def handle_request(conn):
    # 1. Parse the HTTP request (CPU work)
    request = parse_http(conn)

    # 2. Database query — this BLOCKS the thread
    #    The OS scheduler will switch to another thread
    user = db.execute(
        "SELECT * FROM users WHERE id = %s",
        (request.user_id,)
    )

    # 3. Thread resumes here after DB responds
    response = json.dumps(user)
    conn.send(response)

# Create a new OS thread for each incoming connection
while True:
    conn = server_socket.accept()
    t = threading.Thread(target=handle_request, args=(conn,))
    t.start()
