#!/usr/bin/env bash
# new-ppt.sh — scaffold a new presentation from a template.
# Usage: ./scripts/new-ppt.sh <name> [16x9|9x16|swiss]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:?usage: new-ppt.sh <name> [16x9|9x16|swiss]}"
RATIO="${2:-16x9}"
SRC="$ROOT/templates/ppt-$RATIO.html"

[ -f "$SRC" ] || { echo "no template for ratio '$RATIO' (use 16x9, 9x16, or swiss)"; exit 1; }

DEST_DIR="$ROOT/slides/$NAME"
mkdir -p "$DEST_DIR/images"
DEST="$DEST_DIR/index.html"
[ -e "$DEST" ] && { echo "presentation already exists: $DEST"; exit 1; }

# slides/<name>/index.html is two levels deep → fix asset paths (../ → ../../)
sed 's#"\.\./assets/#"../../assets/#g' "$SRC" > "$DEST"

echo "✓ created $DEST"
echo "  open it:   open '$DEST'   (or: python3 -m http.server)"
echo "  edit:      点右上角「编辑」直接改文字；或替换 demo 内容（保留 .slide 结构）"
echo "  export:    右上角「导出」→ PDF / PPTX / PNG / HTML"
echo "  art:       $DEST_DIR/images/"
