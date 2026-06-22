#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/lust-pioneer"
SERVICE_NAME="lust-pioneer-service"
CONTRACT="0xCb207489E4dbd6D4e3bf75CA947D0C43d621Fef1"
RPC="https://rpc.lustchain.org"

if [ "$(id -u)" != "0" ]; then
  echo "Run as root on the downloads/faucet server."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "===== INSTALL LUST PIONEER SERVICE ====="
echo "Source: $SCRIPT_DIR"
echo "Target: $APP_DIR"

command -v node >/dev/null || { echo "Node.js not found. Install Node 20+ first."; exit 1; }
command -v npm >/dev/null || { echo "npm not found."; exit 1; }

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude '.env' --exclude 'data' --exclude 'cache' --exclude 'node_modules' \
  "$SCRIPT_DIR/" "$APP_DIR/"

cd "$APP_DIR"
npm install --omit=dev

if [ ! -f .env ]; then
  echo "===== GENERATE DEDICATED MINT SIGNER ====="
  node --input-type=module <<'NODE' > /tmp/lust-pioneer-signer.env
import { Wallet } from "ethers";
const w = Wallet.createRandom();
console.log(`SIGNER_ADDRESS=${w.address}`);
console.log(`MINT_AUTHORIZER_PRIVATE_KEY=${w.privateKey}`);
NODE
  SIGNER_ADDRESS="$(grep '^SIGNER_ADDRESS=' /tmp/lust-pioneer-signer.env | cut -d= -f2)"
  PRIVATE_KEY="$(grep '^MINT_AUTHORIZER_PRIVATE_KEY=' /tmp/lust-pioneer-signer.env | cut -d= -f2)"
  cat > .env <<ENV
PORT=8097
RPC_URL=$RPC
CHAIN_ID=6923
CONTRACT_ADDRESS=$CONTRACT
MINT_AUTHORIZER_PRIVATE_KEY=$PRIVATE_KEY
PUBLIC_BASE_URL=https://downloads.lustchain.org
PLATFORM_ORIGIN=https://platform.lustchain.org
RULES_VERSION=lust-pioneer-v1-20260616
AUTHORIZATION_TTL_SECONDS=900
DATA_DIR=$APP_DIR/data
CACHE_DIR=$APP_DIR/cache
ASSETS_DIR=$APP_DIR/assets
TRUST_PROXY=1
ENV
  chmod 600 .env
  echo "$SIGNER_ADDRESS" > SIGNER_ADDRESS.txt
  chmod 600 SIGNER_ADDRESS.txt
  echo
  echo "NEW_BACKEND_SIGNER_ADDRESS=$SIGNER_ADDRESS"
else
  echo ".env already exists, keeping current signer."
  [ -f SIGNER_ADDRESS.txt ] && echo "SIGNER_ADDRESS=$(cat SIGNER_ADDRESS.txt)"
fi

command -v pm2 >/dev/null || npm install -g pm2
pm2 delete "$SERVICE_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo
cat <<MSG
===== NGINX ROUTE REQUIRED =====
Add this inside the downloads.lustchain.org server block, then run: nginx -t && systemctl reload nginx

location /pioneer/ {
    proxy_pass http://127.0.0.1:8097;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

===== NEXT OWNER ACTION =====
1) Open https://platform.lustchain.org/pioneer-owner-launch.html
2) Connect owner wallet 0x5feb...
3) Paste the NEW_BACKEND_SIGNER_ADDRESS above in Step 1
4) Click setMintAuthorizer
5) Then check: https://downloads.lustchain.org/pioneer/health

MSG

pm2 logs "$SERVICE_NAME" --lines 30 --nostream || true
