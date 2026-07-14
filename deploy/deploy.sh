#!/usr/bin/env bash
# Bygger standalone-utgaven lokalt og kopierer den til serveren.
# Bruk: SERVER=bruker@robothjelp.no ./deploy/deploy.sh
set -euo pipefail

SERVER="${SERVER:?Sett SERVER=bruker@vert, f.eks. SERVER=jens@robothjelp.no}"
DEST="${DEST:-/srv/robothjelp}"

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
cp -R prisma/schema.prisma "$STAGE/schema.prisma"

echo "==> Kopierer til $SERVER:$DEST"
rsync -az --delete "$STAGE/" "$SERVER:$DEST/"

echo "==> Restarter tjenesten"
ssh "$SERVER" "sudo systemctl restart robothjelp && systemctl is-active robothjelp"

echo "==> Ferdig. Sjekk https://robothjelp.no"
