#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
npm ci

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Building application..."
npm run build

echo "==> Restarting PM2..."
if pm2 describe rpp-richmenu > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi

pm2 save
echo "==> Done. PORT is read from .env by Next.js (default 3007)."
