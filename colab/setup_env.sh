#!/usr/bin/env bash
# Run via SSH on Colab to install dependencies
# Usage: ./run_on_colab.sh colab/setup_env.sh

set -e

pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install -q diffusers transformers accelerate pillow
pip install -q fastapi uvicorn nest-asyncio

# Install cloudflared binary (not pip package)
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
elif echo "$ARCH" | grep -q aarch64; then
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
fi
chmod +x /usr/local/bin/cloudflared 2>/dev/null

echo "Dependencies installed"
