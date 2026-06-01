#!/usr/bin/env bash
# shoot-themes.sh — render templates/theme-preview.html in each theme to a PNG
# under screenshots/ (one representative slide per theme, for the README gallery).
#   ./scripts/shoot-themes.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/screenshots"; mkdir -p "$OUT"
PAGE="$ROOT/templates/theme-preview.html"

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" "$(command -v chromium || true)" "$(command -v chromium-browser || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && { CHROME="$c"; break; }
done
[ -n "$CHROME" ] || { echo "Chrome/Chromium not found."; exit 1; }

W=1440; H=810
for t in industrial-paper neo-brutalist editorial dark-luxe ink-wash; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="${W},${H}" --screenshot="$OUT/$t.png" --virtual-time-budget=2200 \
    "file://$PAGE?theme=$t&export=1" >/dev/null 2>&1 && echo "✓ $t.png" || echo "✗ $t failed"
done
echo "→ $OUT/"
