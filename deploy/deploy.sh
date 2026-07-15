#!/usr/bin/env bash
# Bygger standalone-utgaven lokalt og deployer til robothjelp.no-serveren.
# Bruk: ./deploy/deploy.sh
set -euo pipefail

SERVER="${SERVER:-root@167.233.142.138}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/mediemonitor_hetzner}"
DEST="${DEST:-/srv/robothjelp}"
SSH="ssh -i $SSH_KEY"

cd "$(dirname "$0")/.."

echo "==> Bygger"
npm run build

echo "==> Setter sammen standalone-pakken"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -R .next/standalone/. "$STAGE/"
mkdir -p "$STAGE/.next"
cp -R .next/static "$STAGE/.next/static"
cp -R public "$STAGE/public"

echo "==> Kopierer til $SERVER:$DEST"
rsync -az --delete -e "$SSH" "$STAGE/" "$SERVER:$DEST/"

echo "==> Retter rettigheter og restarter"
$SSH "$SERVER" "chmod 755 $DEST && chown -R robothjelp:robothjelp $DEST && systemctl restart robothjelp && sleep 2 && systemctl is-active robothjelp && curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:3000/"

echo "==> Ferdig. Sjekk https://robothjelp.no"
