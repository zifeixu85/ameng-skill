#!/usr/bin/env bash
# eject.sh — copy a deck OUT of the skill into a standalone, self-contained folder.
# The deck under slides/<name>/ references ../../assets via relative paths and only
# works inside the skill tree. "Ejecting" copies index.html + a private assets/ +
# images/ (+ png/ if present) into a target dir and rewrites ../../assets/ → assets/
# so the whole folder opens anywhere, can be zipped, handed off, or committed to a
# project repo. Fully offline; nothing is uploaded.
#
# Usage:
#   ./scripts/eject.sh <name> <target-dir>
#   ./scripts/eject.sh uxda ~/Documents/UXDA-share/ppt
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:?usage: eject.sh <deck-name> <target-dir>}"
DEST="${2:?usage: eject.sh <deck-name> <target-dir>}"
SRC_DIR="$ROOT/slides/$NAME"
SRC="$SRC_DIR/index.html"

[ -f "$SRC" ] || { echo "no deck at $SRC (run new-ppt.sh first)"; exit 1; }

mkdir -p "$DEST"
cp -R "$ROOT/assets" "$DEST/assets"
[ -d "$SRC_DIR/images" ] && cp -R "$SRC_DIR/images" "$DEST/images" || mkdir -p "$DEST/images"
[ -d "$SRC_DIR/png" ] && cp -R "$SRC_DIR/png" "$DEST/png" || true

# rewrite ../../assets/ → assets/  (deck is two levels deep in the skill; flat when ejected)
sed 's#\.\./\.\./assets/#assets/#g' "$SRC" > "$DEST/index.html"

# safety: confirm no stray ../ asset refs remain
if grep -q '\.\./' "$DEST/index.html"; then
  echo "⚠ residual ../ reference in $DEST/index.html — check manually"; grep -n '\.\./' "$DEST/index.html" || true
else
  echo "✓ self-contained — no ../ references"
fi

echo "✓ ejected $NAME → $DEST"
echo "  open:   cd '$(dirname "$DEST")' && python3 -m http.server   # then /$(basename "$DEST")/index.html"
echo "  note:   editor/export work best over http://, not file:// (browser blocks screenshot/font reads)"

# drop a double-clickable local server so export always runs over http://
cat > "$DEST/serve.command" <<'EOSRV'
#!/bin/bash
# 双击启动本地服务器并打开 deck（导出 PDF/PPTX/PNG 必须从 http:// 打开）
cd "$(dirname "$0")"
PORT=8123
( sleep 1; open "http://localhost:$PORT/index.html" ) &
echo "Serving at http://localhost:$PORT — 关闭此窗口即停止"
python3 -m http.server $PORT
EOSRV
chmod +x "$DEST/serve.command"
echo "  serve:  双击 $DEST/serve.command 即从 http:// 打开（导出必需）"
