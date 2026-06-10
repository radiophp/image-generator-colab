"""
Pure Python FastAPI server for Colab.
Run via:  python3 api_server.py
"""
import subprocess, threading, re, sys

# Start uvicorn as a subprocess
uvicorn_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api_app:app", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

def print_uvicorn():
    for line in uvicorn_proc.stdout:
        print(line.strip())

threading.Thread(target=print_uvicorn, daemon=True).start()

# Start cloudflared tunnel
cloudflared_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://localhost:8000"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

for line in cloudflared_proc.stdout:
    print(line.strip())
    m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
    if m:
        print(f"\nCOLAB_URL={m.group()}")
        break

# Keep alive
uvicorn_proc.wait()
