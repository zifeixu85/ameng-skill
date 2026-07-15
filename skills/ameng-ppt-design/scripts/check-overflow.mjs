#!/usr/bin/env node
// ============================================================================
// check-overflow.mjs — ameng-ppt-design geometry gate (headless, zero-dep)
//
//   node scripts/check-overflow.mjs <deck.html> [WxH]
//
// The text linter (validate.mjs) can't SEE layout, so content that spills past
// the safe zone used to be caught only by eyeballing PNGs. This gate renders the
// deck in headless Chrome with ?audit — runtime.js finalizes entrance animations,
// measures EVERY slide's descendants against its safe box (the slide content box,
// which already encodes the chrome-avoidance zone), and writes a JSON report into
// the DOM. We read it back with --dump-dom and report exact overflow pixels.
//
// Exit code: 0 if every slide fits, 1 if ANY slide overflows (a hard gate),
//            2 on usage / environment error.
//
// Fully offline: only a local Chrome/Chromium, same as render.sh.
// ============================================================================

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { argv, exit, platform } from "node:process";

// ---- CLI -------------------------------------------------------------------
const file = argv[2];
if (!file) {
  console.error("usage: node scripts/check-overflow.mjs <deck.html> [WxH]");
  exit(2);
}
if (!existsSync(file)) {
  console.error(`cannot read file: ${file}`);
  exit(2);
}
const size = argv[3] || "1280x720";
const [W, H] = size.split("x");

// ---- locate Chrome / Chromium ----------------------------------------------
const candidates =
  platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
      ]
    : [];
const fromPath = ["google-chrome", "chromium", "chromium-browser", "google-chrome-stable"]
  .map((c) => {
    const r = spawnSync("command", ["-v", c], { shell: true, encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : null;
  })
  .filter(Boolean);
const chrome = [...candidates, ...fromPath].find((p) => p && existsSync(p));
if (!chrome) {
  console.error(
    "Chrome/Chromium not found. Install it, or check overflow visually:\n" +
      "  open the deck and press G (safe-zone guides + ⚠ overflow badge per slide).",
  );
  exit(2);
}

// ---- render with ?audit and dump the DOM -----------------------------------
const abs = resolve(file);
const url = `file://${abs}?audit#/1`;
const run = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${W},${H}`,
    "--virtual-time-budget=5000",
    "--run-all-compositor-stages-before-draw",
    "--dump-dom",
    url,
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (run.status !== 0 && !run.stdout) {
  console.error(`headless render failed:\n${run.stderr || "(no output)"}`);
  exit(2);
}

// ---- extract #ppt-ovf-report JSON ------------------------------------------
const m = run.stdout.match(
  /<script[^>]*id="ppt-ovf-report"[^>]*>([\s\S]*?)<\/script>/i,
);
if (!m) {
  console.error(
    "no overflow report found — is assets/runtime.js up to date (it must support ?audit)?\n" +
      "fallback: open the deck and press G to inspect overflow visually.",
  );
  exit(2);
}
let report;
try {
  report = JSON.parse(m[1].trim());
} catch (err) {
  console.error(`could not parse overflow report: ${err.message}`);
  exit(2);
}

// ---- report ----------------------------------------------------------------
const slides = report.slides || [];
const bad = slides.filter((s) => s.overflow);
const lowContrast = slides.filter((s) => (s.contrast || []).length > 0);
console.log(`ameng-ppt overflow · ${basename(dirname(abs))}/${basename(abs)}  (stage ${report.w}×${report.h})`);
console.log(
  `slides: ${slides.length} · within safe zone: ${slides.length - bad.length} · overflowing: ${bad.length}` +
    ` · low-contrast: ${lowContrast.length}`,
);

if (bad.length) {
  console.log(`\nOVERFLOW (${bad.length})`);
  for (const s of bad) {
    const dirs = [];
    if (s.top) dirs.push(`↑${s.top}`);
    if (s.bottom) dirs.push(`↓${s.bottom}`);
    if (s.left) dirs.push(`←${s.left}`);
    if (s.right) dirs.push(`→${s.right}`);
    console.log(`  - slide ${String(s.n).padStart(2, "0")}: spills ${dirs.join(" ")} px  · offender: ${s.el || "?"}`);
  }
  console.log(
    `\nFix: shorten copy, drop a row, split into two slides, or shrink the offending block.\n` +
      `Re-check in-browser by pressing G (safe-zone guides + live ⚠ badge).`,
  );
}

// rendered WCAG contrast < 3.0 fails even large text — the green-on-green class
// of bug that static token checks can't see (computed colors, post-theme).
if (lowContrast.length) {
  console.log(`\nCONTRAST < 3.0 (${lowContrast.length} slide(s)) — unreadable text on its band:`);
  for (const s of lowContrast)
    for (const c of s.contrast)
      console.log(`  - slide ${String(s.n).padStart(2, "0")}: ratio ${c.ratio}  · ${c.el}`);
  console.log(
    `Fix: text on an accent fill must use the auto-flip components (.card--accent/.fn--on/.fu--on/.mq--on/.ly--on\n` +
      `give --accent-ink for free) — don't hand-roll colored boxes with hand-picked text colors.`,
  );
}

// vertical balance advisory: a non-center slide whose content leaves a third of
// the safe zone empty at the bottom reads as top-heavy dead space (not a FAIL —
// judge it in the PNG pass; .center statement pages are exempt by design).
const underfilled = slides.filter(
  (s) => !s.center && !s.overflow && s.gapBottom != null && s.gapBottom > (report.h ? (report.h - 84 - 84) : 551) / 3,
);
if (underfilled.length) {
  console.log(`\nADVISORY · top-heavy layout (${underfilled.length} slide(s), bottom third+ of safe zone empty):`);
  for (const s of underfilled)
    console.log(`  - slide ${String(s.n).padStart(2, "0")}: content fills ${s.fill}% · ${s.gapBottom}px dead band at bottom`);
  console.log(`Consider: .center the slide, let the main block .fill, or upgrade the page to a fuller diagram/layout.`);
}

if (bad.length || lowContrast.length) {
  console.log(`\nRESULT: FAIL`);
  exit(1);
}
console.log(`\nRESULT: PASS${underfilled.length ? "-WITH-ADVISORIES" : ""}`);
exit(0);
