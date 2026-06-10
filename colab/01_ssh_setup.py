"""
Copy this ENTIRE file into a Colab cell and run it.
Starts SSH server + creates a TCP tunnel via bore.pub.
"""
import subprocess, re, time

!apt-get update -qq && apt-get install -yqq openssh-server > /dev/null 2>&1
!mkdir -p /var/run/sshd
!echo "root:colab123" | chpasswd
!echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
!echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
subprocess.run(["service", "ssh", "start"], capture_output=True)

# Install bore
import urllib.request, json, shutil, os, stat

# Check which arch
arch = subprocess.run(["uname", "-m"], capture_output=True, text=True).stdout.strip()
if arch == "x86_64":
    url = "https://github.com/ekzhang/bore/releases/download/v0.5.2/bore-v0.5.2-x86_64-unknown-linux-musl.tar.gz"
elif "aarch64" in arch:
    url = "https://github.com/ekzhang/bore/releases/download/v0.5.2/bore-v0.5.2-aarch64-unknown-linux-musl.tar.gz"
else:
    url = ""

if url:
    !curl -sL "$url" | tar xz -C /usr/local/bin/ bore 2>/dev/null
    !chmod +x /usr/local/bin/bore

time.sleep(1)

proc = subprocess.Popen(
    ["bore", "local", "22", "--to", "bore.pub"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

for line in proc.stdout:
    line = line.strip()
    print(line)
    m = re.search(r"(?:port=|:)(\d+)", line)
    if m:
        port = m.group(1)
        print(f"\n{'='*55}")
        print(f"  SSH: ssh -p {port} root@bore.pub")
        print(f"  Pass: colab123")
        print(f"{'='*55}")
        break
