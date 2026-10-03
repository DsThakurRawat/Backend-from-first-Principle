import "os/exec"

// OK SAFE ,  command and each argument are separate params
// Shell never sees userFilename ,  it goes straight to the process
cmd := exec.Command(
    "ffmpeg",
    "-i", "input.jpg",
    "-vf", "scale=800:600",
    userFilename,   // treated as a string argument, not shell code
)
output, err := cmd.Output()
