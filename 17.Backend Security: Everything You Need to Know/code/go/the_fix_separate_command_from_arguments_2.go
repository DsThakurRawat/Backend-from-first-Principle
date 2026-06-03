import "os/exec"

// ❌ VULNERABLE — passes through shell interpreter
cmd := exec.Command("sh", "-c", "ffmpeg -i input.jpg -o "+userFilename)

// ✅ SAFE — command and each argument are separate params
// Shell never sees userFilename — it goes straight to the process
cmd := exec.Command(
    "ffmpeg",
    "-i", "input.jpg",
    "-vf", "scale=800:600",
    userFilename,   // treated as a string argument, not shell code
)
output, err := cmd.Output()
