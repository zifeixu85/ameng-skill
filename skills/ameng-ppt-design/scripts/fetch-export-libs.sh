#!/usr/bin/env bash
# fetch-export-libs.sh — vendor the in-browser export libraries into assets/vendor/.
# The repo ships these committed, so export works offline out of the box; run this
# only to refresh / re-pin versions. All MIT-licensed.
#
#   ./scripts/fetch-export-libs.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/assets/vendor"; mkdir -p "$DEST"

dl() { if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"; elif command -v wget >/dev/null 2>&1; then wget -qO "$2" "$1"; else echo "need curl or wget"; exit 1; fi; }

echo "→ modern-screenshot (DOM→PNG, OKLCH-faithful)"
dl "https://cdn.jsdelivr.net/npm/modern-screenshot@4.6.0/dist/index.js" "$DEST/modern-screenshot.js"
echo "→ jsPDF (assemble images → PDF)"
dl "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js" "$DEST/jspdf.umd.min.js"
echo "→ PptxGenJS (assemble images → PPTX)"
dl "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js" "$DEST/pptxgen.bundle.js"
echo "→ JSZip (bundle all-slide PNGs into a .zip)"
dl "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js" "$DEST/jszip.min.js"

echo "✓ vendored into assets/vendor/ — image-based PDF/PPTX/PNG export works offline."
