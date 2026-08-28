import subprocess

# ❌ VULNERABLE — shell=True sends everything through sh
subprocess.run(f"ffmpeg -i input.jpg -o {user_filename}", shell=True)

# ✅ SAFE — list form, shell=False (default)
subprocess.run([
    "ffmpeg", "-i", "input.jpg",
    "-vf", "scale=800:600",
    user_filename   # just a string, not interpreted
], check=True)
