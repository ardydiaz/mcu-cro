#!/usr/bin/env bash
# Applies the code that is already on the server: installs packages, applies
# new database migrations, restarts the API and rebuilds the website.
# It does NOT pull. Get the code yourself first, then run it:
#   git pull origin main
#   ./deploy.sh
# Run on the server as the app user, not root. See docs/deployment.md.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_NAME="mcu-cro-api"

# nvm installs Node per user; load it when this runs from a non-login shell.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

step() { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }

cd "$APP_DIR"

step "Deploying $(git branch --show-current) at $(git log -1 --format='%h %s')"

step "Backend: installing packages"
cd "$APP_DIR/backend"
npm ci --omit=dev --no-audit --no-fund

step "Backend: applying database migrations"
npm run db:migrate

step "Backend: restarting the API"
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start npm --name "$PM2_NAME" -- start
fi
pm2 save > /dev/null

step "Frontend: installing packages and building the website"
cd "$APP_DIR/frontend"
npm ci --no-audit --no-fund
npm run build

step "Checking the API"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${PORT:-2002}/api/health" > /dev/null; then
    echo "API is up."
    printf '\n\033[1;32mDeployed %s\033[0m\n' "$(git -C "$APP_DIR" log -1 --format='%h %s')"
    exit 0
  fi
  sleep 1
done
echo "The API did not answer /api/health. Check: pm2 logs $PM2_NAME --lines 50" >&2
exit 1
