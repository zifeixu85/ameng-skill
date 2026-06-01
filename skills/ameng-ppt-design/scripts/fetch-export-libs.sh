#!/usr/bin/env bash
# fetch-export-libs.sh — vendor the in-browser export libraries ONCE.
#
# The Export ▸ PPTX and Export ▸ PNG buttons load these from assets/vendor/.
# PDF export and HTML export need NO library and always work.
# After running this once, PPTX/PNG export works fully offline.
#
#   ./scripts/fetch-export-libs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/assets/vendor"
mkdir -p "$DEST"

# pin versions for reproducibility
PPTX_URL="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"
H2C_URL="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"

dl() { # url dest
  if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then wget -qO "$2" "$1"
  else echo "need curl or wget"; exit 1; fi
}

echo "→ pptxgen.bundle.js (PPTX export, includes JSZip)"
dl "$PPTX_URL" "$DEST/pptxgen.bundle.js"
echo "→ html2canvas.min.js (PNG export)"
dl "$H2C_URL" "$DEST/html2canvas.min.js"

echo "✓ vendored into assets/vendor/ — PPTX/PNG export now works offline."
echo "  (PDF + HTML export never needed these.)"
