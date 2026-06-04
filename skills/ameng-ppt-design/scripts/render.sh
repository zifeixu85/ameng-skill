#!/usr/bin/env bash
# render.sh — export a deck to per-slide PNG or a single PDF (headless Chrome, offline).
#
# Usage:
#   ./scripts/render.sh <deck.html> [png|pdf] [WxH] [out-dir]
#   ./scripts/render.sh slides/my-talk/index.html             # PNG, auto-count slides, 1280x720
#   ./scripts/render.sh slides/my-talk/index.html pdf         # → slides/my-talk/my-talk.pdf
#   ./scripts/render.sh slides/my-talk/index.html 10          # legacy: explicit count → PNG
#
# Slide count is auto-detected from the HTML; PDF is assembled from @2x PNGs so it
# stays crisp. No extra dependencies beyond a local Chrome/Chromium. Fully offline.
set -euo pipefail

FILE="${1:?usage: render.sh <deck.html> [png|pdf] [WxH] [out-dir]}"
MODE="${2:-png}"
# legacy: a numeric 2nd arg means "explicit slide count, PNG mode"
COUNT=""
if [[ "$MODE" =~ ^[0-9]+$ ]]; then COUNT="$MODE"; MODE="png"; fi
SIZE="${3:-1280x720}"
W="${SIZE%x*}"; H="${SIZE#*x}"

# locate Chrome / Chromium across platforms
CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)" \
  "$(command -v chromium-browser || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && { CHROME="$c"; break; }
done
[ -n "$CHROME" ] || { echo "Chrome/Chromium not found. Install it, or print to PDF from the browser (Cmd/Ctrl+P)."; exit 1; }

ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"

# auto-detect slide count (matches <... class="slide" ...> and "slide " + more classes;
# does NOT match .slide__foot / .slide__num / .slide-fx)
if [ -z "$COUNT" ]; then
  COUNT=$(grep -oE 'class="slide[ "]' "$FILE" | wc -l | tr -d ' ')
fi
[ "${COUNT:-0}" -ge 1 ] || { echo "no .slide found in $FILE"; exit 1; }

# a sensible deck name (slides/<name>/index.html → <name>; templates/ppt-x.html → ppt-x)
DNAME="$(basename "$(dirname "$ABS")")"
[ "$DNAME" = "templates" ] || [ "$DNAME" = "." ] && DNAME="$(basename "${ABS%.html}")"

shoot() {  # $1=output png path  $2=slide index
  # ?export tells runtime.js to skip the on-screen help affordance (deliverables stay clean)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="${W},${H}" --screenshot="$1" --virtual-time-budget=1600 \
    "file://$ABS?export#/$2" >/dev/null 2>&1
}

if [ "$MODE" = "pdf" ]; then
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  OUT="${4:-$(dirname "$FILE")}"; mkdir -p "$OUT"
  PDF="$OUT/$DNAME.pdf"
  echo "rendering $COUNT slides → PDF @ ${W}x${H} ..."
  for i in $(seq 1 "$COUNT"); do
    N=$(printf "%02d" "$i")
    shoot "$TMP/slide-$N.png" "$i" && echo "  ✓ slide $N" || echo "  ! slide $i failed"
  done
  # print sheet: one image per page, exact page size, zero margins
  PRINT="$TMP/_print.html"
  {
    echo "<!doctype html><meta charset=utf-8><style>"
    echo "@page{size:${W}px ${H}px;margin:0}html,body{margin:0;padding:0;background:#fff}"
    echo "img{display:block;width:${W}px;height:${H}px;page-break-after:always}"
    echo "img:last-child{page-break-after:auto}</style>"
    for i in $(seq 1 "$COUNT"); do printf '<img src="slide-%02d.png">\n' "$i"; done
  } > "$PRINT"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$PDF" "file://$PRINT" >/dev/null 2>&1 \
    || { echo "PDF print failed (try updating Chrome)"; exit 1; }
  echo "✓ $PDF  ($COUNT pages)"
else
  OUT="${4:-$(dirname "$FILE")/png}"; mkdir -p "$OUT"
  echo "rendering $COUNT slides → PNG @ ${W}x${H} → $OUT/"
  for i in $(seq 1 "$COUNT"); do
    N=$(printf "%02d" "$i")
    shoot "$OUT/slide-$N.png" "$i" && echo "  ✓ slide-$N.png" || echo "  ! slide $i failed"
  done
  echo "done. Review $OUT/ for overflow, contrast, alignment, AI-slop (see references/anti-slop-checklist.md)."
fi
