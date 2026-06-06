#!/usr/bin/env bash
# preview-themes.sh — open the theme picker seeded with YOUR deck's real content.
#
#   ./scripts/preview-themes.sh <name> [slideIndex]
#   ./scripts/preview-themes.sh my-talk        # use slide 1 (cover) of slides/my-talk
#   ./scripts/preview-themes.sh my-talk 3       # preview using the 3rd slide
#
# The static picker (templates/theme-preview.html) ships a DEMO slide. This
# splices in one of your actual slides instead, so you choose a theme by how it
# treats YOUR copy/charts — not a stand-in. Writes slides/<name>/_preview.html
# (gitignored, throwaway) and opens it. Switch themes with ← → / 1–5 / D.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:?usage: preview-themes.sh <name> [slideIndex]}"
WHICH="${2:-1}"
DECK="$ROOT/slides/$NAME/index.html"
PICKER="$ROOT/templates/theme-preview.html"
OUT="$ROOT/slides/$NAME/_preview.html"

[ -f "$DECK" ] || { echo "no deck at $DECK (run new-ppt.sh first)"; exit 1; }
[ -f "$PICKER" ] || { echo "missing $PICKER"; exit 1; }

python3 - "$DECK" "$PICKER" "$OUT" "$WHICH" <<'PY'
import re, sys
deck_p, picker_p, out_p, which = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])

deck = open(deck_p, encoding="utf-8").read()
picker = open(picker_p, encoding="utf-8").read()

# grab all <section ... class="...slide...">...</section> blocks from the deck
slides = re.findall(r'<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[\s\S]*?</section>', deck)
if not slides:
    sys.exit("no .slide found in deck")
i = max(1, min(which, len(slides))) - 1
chosen = slides[i]

# make it visible in the static picker (no runtime to add .is-active)
chosen = re.sub(r'(<section\b[^>]*\bclass=")([^"]*?)(")',
                lambda m: m.group(1) + (m.group(2) if "is-active" in m.group(2) else m.group(2) + " is-active") + m.group(3),
                chosen, count=1)
# drop speaker notes from the preview
chosen = re.sub(r'<div\b[^>]*\bclass="[^"]*\bnotes\b[^"]*"[\s\S]*?</div>', '', chosen)

# replace the picker's demo <section ...slide...>...</section> with the chosen one
new = re.sub(r'<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[\s\S]*?</section>',
             lambda _: chosen, picker, count=1)

# the picker lives in templates/ (../assets); the output lives two levels deep
# in slides/<name>/ (../../assets). deck slides already use ../../assets.
new = new.replace('"../assets/', '"../../assets/')

open(out_p, "w", encoding="utf-8").write(new)
print(f"seeded preview with slide {i+1} of {len(slides)}")
PY

echo "✓ $OUT"
echo "  switch themes: ← → / 1–5 / D（明暗）· 看准了把模板 #theme-link 指到该主题"
if command -v open >/dev/null 2>&1; then open "$OUT"; else echo "  open it: $OUT (or python3 -m http.server)"; fi
