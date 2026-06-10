#!/usr/bin/env bash
# Upload a local Python file to Colab and run it via SSH
#
# Usage:
#   ./colab/upload_and_run.sh colab/api_server.py

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$SCRIPT_DIR/.env" ] && export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)

COLAB_HOST="${COLAB_SSH_HOST:-}"
COLAB_PORT="${COLAB_SSH_PORT:-22}"
COLAB_PASS="${COLAB_SSH_PASS:-colab123}"

if [ -z "$COLAB_HOST" ]; then
  echo "Set COLAB_SSH_HOST in .env"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 local_file.py"
  exit 1
fi

FILENAME=$(basename "$1")
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAuthentication=no -o PreferredAuthentications=password"
ENV_PREFIX="export LD_LIBRARY_PATH=/usr/lib64-nvidia:/usr/local/cuda-12.8/compat:\$LD_LIBRARY_PATH;"

echo "Uploading $1 to Colab:/content/$FILENAME ..."
sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "$ENV_PREFIX cat > /content/$FILENAME" < "$1"

echo "Running python3 /content/$FILENAME ..."
sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "cd /content && $ENV_PREFIX python3 $FILENAME"
