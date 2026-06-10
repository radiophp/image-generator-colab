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

echo "Killing old Python processes..."
sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "pkill -9 -f 'python3.*instantid' 2>/dev/null; pkill -9 -f 'python3.*api_app' 2>/dev/null; sleep 2; echo 'done'" 2>/dev/null || true

echo "Uploading $1 to Colab:/content/$FILENAME ..."
sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "$ENV_PREFIX cat > /content/$FILENAME" < "$1"

echo "Running python3 /content/$FILENAME in background (nohup)..."
sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "cd /content && $ENV_PREFIX nohup python3 $FILENAME > /content/app.log 2>&1 &
echo 'PID:' \$!
echo 'Waiting 60s for model to load...'
# Poll for health or for log output showing ready
for i in \$(seq 1 60); do
  sleep 1
  if grep -q 'COLAB_URL=' /content/app.log 2>/dev/null; then
    grep 'COLAB_URL=' /content/app.log
    break
  fi
  if grep -qi 'error\|Traceback' /content/app.log 2>/dev/null; then
    echo 'Error detected:'
    head -20 /content/app.log
    break
  fi
done
echo '--- Last 10 log lines ---'
tail -10 /content/app.log"
