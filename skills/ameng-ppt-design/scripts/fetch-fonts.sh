#!/usr/bin/env bash
# ============================================================================
# fetch-fonts.sh — one-time download of the distinctive Latin webfonts that
# assets/fonts.css @font-face-references, so the deck becomes fully OFFLINE /
# cn-ok (no Google Fonts, no CDN at runtime).
#
#   ./scripts/fetch-fonts.sh
#
# Source: Fontsource via jsDelivr (stable woff2, OFL-licensed families).
# We grab the VARIABLE-weight ("vf") woff2 for each family — one file covers
# the full weight range that fonts.css declares (e.g. 200–800), so a single
# download per family is enough.
#
# Idempotent: a font already present in assets/fonts/ is skipped.
# Graceful:   if a download fails (e.g. network-sandboxed), the deck STILL
#             works — fonts.css falls back to the system CJK + sans stack.
# No secrets: nothing here reads or writes any credential.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONT_DIR="$ROOT/assets/fonts"
mkdir -p "$FONT_DIR"

# family-label | output filename (must match fonts.css) | source URL
# Variable woff2 from Fontsource (latin subset, weight axis = "wght").
FONTS=(
  "Bricolage Grotesque|BricolageGrotesque.woff2|https://cdn.jsdelivr.net/fontsource/fonts/bricolage-grotesque:vf@latest/latin-wght-normal.woff2"
  "Host Grotesk|HostGrotesk.woff2|https://cdn.jsdelivr.net/fontsource/fonts/host-grotesk:vf@latest/latin-wght-normal.woff2"
  "JetBrains Mono|JetBrainsMono.woff2|https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono:vf@latest/latin-wght-normal.woff2"
)

ok=0; skip=0; fail=0

echo "Fetching distinctive Latin webfonts → $FONT_DIR"
echo

for entry in "${FONTS[@]}"; do
  label="${entry%%|*}"
  rest="${entry#*|}"
  out="${rest%%|*}"
  url="${rest#*|}"
  dest="$FONT_DIR/$out"

  if [ -s "$dest" ]; then
    echo "• $label — already present ($out), skipping."
    skip=$((skip + 1))
    continue
  fi

  # Download to a temp file, validate it is a real woff2 (magic "wOF2"),
  # then move into place — never leave a half-written/HTML-error file.
  tmp="$(mktemp "${dest}.XXXXXX")"
  if curl -fL --retry 2 --connect-timeout 15 --max-time 90 -o "$tmp" "$url" 2>/dev/null \
     && [ "$(head -c 4 "$tmp" 2>/dev/null)" = "wOF2" ]; then
    mv -f "$tmp" "$dest"
    chmod 644 "$dest"   # mktemp lands 0600; make it web-readable
    echo "✓ $label → $out ($(wc -c < "$dest" | tr -d ' ') bytes)"
    ok=$((ok + 1))
  else
    rm -f "$tmp"
    echo "✗ $label — download failed ($url)"
    fail=$((fail + 1))
  fi
done

echo
echo "Done: $ok fetched, $skip skipped, $fail failed."
if [ "$fail" -gt 0 ]; then
  echo
  echo "NOTE: $fail font(s) could not be downloaded (network may be sandboxed or"
  echo "      the CDN was unreachable). The deck STILL renders — assets/fonts.css"
  echo "      degrades gracefully to the system stack (PingFang / Songti / Source"
  echo "      Han / system-ui). Re-run this script later to self-host the"
  echo "      distinctive Latin faces and go fully offline."
fi

# ============================================================================
# OPTIONAL — self-host a SUBSET CJK woff2 (思源黑 / 思源宋) for distinctive
# Chinese display, instead of relying on the system CJK stack.
#
# fonts.css references (optional, used if present):
#   assets/fonts/SourceHanSerifSC-subset.woff2   →  "PPT Han Serif"
#   assets/fonts/SourceHanSansSC-subset.woff2    →  "PPT Han Sans"
#
# A full CJK font is several MB, so ALWAYS subset to the glyphs your deck uses.
# By default we do NOT fetch these — the system CJK stack (PingFang SC / Songti
# SC / Noto Serif CJK) is already high quality and zero-weight.
#
# To self-host a subset (requires Python + fonttools, one-time):
#
#   pip install fonttools brotli
#
#   # 1) Get a source TTF/OTF, e.g. Source Han Serif SC / Noto Serif CJK SC
#   #    (OFL): https://github.com/adobe-fonts/source-han-serif/releases
#   #
#   # 2) Build a text file of every character your deck actually renders, then
#   #    subset to just those glyphs and emit woff2:
#   #
#   #   pyftsubset SourceHanSerifSC-Regular.otf \
#   #     --text-file=deck-characters.txt \
#   #     --flavor=woff2 --layout-features='*' \
#   #     --output-file=assets/fonts/SourceHanSerifSC-subset.woff2
#   #
#   # Or use glyphhanger to auto-collect the glyphs straight from a rendered deck:
#   #   npx glyphhanger ./decks/my-talk/index.html \
#   #     --subset=SourceHanSerifSC-Regular.otf \
#   #     --formats=woff2 --LATIN
#   #
#   # Repeat with Source Han Sans → SourceHanSansSC-subset.woff2 ("PPT Han Sans").
#
# Keep subset files small (target < ~300 KB) so the deck stays light & offline.
# ============================================================================
