#!/usr/bin/env bash
# Run any command or script on Colab via SSH
#
# Usage:
#   ./run_on_colab.sh "python3 -c 'print(1+1)'"
#   ./run_on_colab.sh colab/setup_env.sh

set -e

[ -f .env ] && export $(grep -v '^#' .env | xargs)

COLAB_HOST="${COLAB_SSH_HOST:-}"
COLAB_PORT="${COLAB_SSH_PORT:-22}"
COLAB_PASS="${COLAB_SSH_PASS:-colab123}"

# Env prefix overrides .env file
[ -n "$_COLAB_SSH_HOST" ] && COLAB_HOST="$_COLAB_SSH_HOST"
[ -n "$_COLAB_SSH_PORT" ] && COLAB_PORT="$_COLAB_SSH_PORT"
[ -n "$_COLAB_SSH_PASS" ] && COLAB_PASS="$_COLAB_SSH_PASS"

if [ -z "$COLAB_HOST" ]; then
  echo "Set COLAB_SSH_HOST in .env"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAuthentication=no -o PreferredAuthentications=password"

ENV_PREFIX="export LD_LIBRARY_PATH=/usr/lib64-nvidia:/usr/local/cuda-12.8/compat:\$LD_LIBRARY_PATH;"

if [ -f "$1" ]; then
  sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "$ENV_PREFIX"'bash -s' < "$1"
else
  sshpass -p "$COLAB_PASS" ssh $SSH_OPTS -p "$COLAB_PORT" "root@$COLAB_HOST" "$ENV_PREFIX $1"
fi
