import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:          # Acquire lock — blocks other threads
        counter += 1   # Only one thread executes this at a time
                        # Lock is released automatically at end of `with`

# Create 1000 threads all incrementing the same counter
threads = [threading.Thread(target=increment) for _ in range(1000)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)  # Always 1000 — no lost updates
