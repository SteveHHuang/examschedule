#!/usr/bin/env bash
set -euo pipefail

# Manual deploy to your own Vultr VPS (or any Linux server).
#
# Usage:
#   export DEPLOY_HOST=your.vultr.ip.or.domain
#   export DEPLOY_USER=root          # or a non-root user with sudo
#   export DEPLOY_PATH=/var/www/examschedule
#   ./deploy.sh
#
# Requirements on this machine:
#   - deno
#   - rsync
#   - ssh access to the server
#
# Requirements on the server (run scripts/setup-vultr.sh once):
#   - nginx
#   - write permission to DEPLOY_PATH

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/examschedule}"

if [ -z "$DEPLOY_HOST" ]; then
    echo "Error: DEPLOY_HOST is not set."
    echo "Example: DEPLOY_HOST=123.45.67.89 DEPLOY_USER=root ./deploy.sh"
    exit 1
fi

echo "==> Generating JSON data..."
deno run --allow-read --allow-write src/cli.ts \
    input.csv \
    public/testSessionsByStudent.json \
    public/studentNamesList.txt \
    public/testSessionsByProctor.json \
    public/proctorNamesList.txt

echo "==> Syncing to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} ..."
rsync -avz --delete \
    --exclude='.DS_Store' \
    public/ \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> Reloading nginx on server..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "
    set -e
    if command -v nginx >/dev/null 2>&1; then
        sudo nginx -t && sudo systemctl reload nginx || true
    fi
"

echo "==> Deploy complete."
echo "    Site: http://${DEPLOY_HOST}/"
