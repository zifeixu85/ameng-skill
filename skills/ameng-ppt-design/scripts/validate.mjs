#!/usr/bin/env node
// ============================================================================
// validate.mjs — ameng-ppt-design discipline linter (zero-dependency, Node ESM)
//
//   node scripts/validate.mjs <deck.html>
//
// Reads the deck HTML as TEXT (no DOM lib) and enforces the house discipline
// from 设计基线 + the skill's token system:
//   FAIL      · a BANNED font name appears anywhere in markup
//   WARN      · hardcoded hex color inside an inline style="" (use tokens / OKLCH)
//   WARN      · 禁蓝 — a blue-hue oklch()/hex used as inline accent/foreground
//   WARN      · <img> without a non-empty alt
//   WARN      · a .slide with no .notes child (missing speaker notes)
//   WARN      · em-dash overuse (≥5 in visible body text)
//   WARN      · eyebrow overuse (>3 .eyebrow elements)
//   WARN      · marketing buzzwords in visible text
//   WARN      · aphoristic「不是X，是Y」cadence (≥3)
//   ADVISORY  · numbered section markers (01/02/03… ≥3 distinct, ≥2 consecutive)
//   INFO      · slide count + how many declare data-accent / data-section
//
// Exit code: 0 on PASS / PASS-WITH-WARNINGS / PASS-WITH-ADVISORIES, 1 on FAIL.
// Only a banned font (FAIL) flips the exit code; every other rule is advisory.
// Line numbers are reported best-effort by mapping match offsets to lines.
//
// Some anti-pattern rules adapted from pbakaus/impeccable (Apache-2.0).
// ============================================================================

import { readFile } from "node:fs/promises";
import { argv, exit } from "node:process";

// ---- CLI -------------------------------------------------------------------
const file = argv[2];
if (!file) {
  console.error("usage: node scripts/validate.mjs <deck.html>");
  exit(2);
}

let html;
try {
  html = await readFile(file, "utf8");
} catch (err) {
  console.error(`cannot read file: ${file}\n  ${err.message}`);
  exit(2);
}

// ---- helpers ---------------------------------------------------------------
// Precompute line-start offsets so any string index → 1-based line number.
const lineStarts = [0];
for (let i = 0; i < html.length; i++) {
  if (html[i] === "\n") lineStarts.push(i + 1);
}
function lineAt(index) {
  // binary search the greatest lineStart <= index
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

const fails = [];
const warns = [];
const advisories = [];
const infos = [];
const add = (bucket, msg) => bucket.push(msg);

// ---- 1. FAIL: banned font names -------------------------------------------
// Ban-list from 设计基线. Case-insensitive substring match in markup.
// Some families have many members (IBM Plex Sans/Serif/Mono, Crimson Pro/Text,
// Cormorant Garamond, …) — match the family root so all variants are caught.
const BANNED_FONTS = [
  "Inter",
  "Roboto",
  "Arial",
  "Open Sans",
  "DM Sans",
  "DM Serif",
  "Plus Jakarta Sans",
  "Outfit",
  "IBM Plex", // any: Sans / Serif / Mono / Condensed
  "Space Mono",
  "Space Grotesk",
  "Instrument Sans",
  "Instrument Serif",
  "Fraunces",
  "Newsreader",
  "Lora",
  "Crimson", // any: Crimson Pro / Crimson Text
  "Playfair Display",
  "Cormorant", // any: Cormorant Garamond / Cormorant Infant / ...
  "Syne",
];

// Whole-token aware: require a word boundary so "Inter" doesn't match
// "Interface" and "Lora" doesn't match "flora"/"explorer". Multi-word names
// keep their internal spaces. Escape regex metacharacters in each name.
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
for (const name of BANNED_FONTS) {
  const re = new RegExp(`(?<![A-Za-z])${escapeRe(name)}(?![A-Za-z])`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    add(
      fails,
      `banned font "${name}" at line ${lineAt(m.index)} — matched "${m[0]}" (use --ppt-display / --ppt-body / --ppt-mono)`,
    );
  }
}

// ---- inline style="" collection (shared by hex + 禁蓝 checks) --------------
// Capture each inline style attribute with its absolute offset.
const inlineStyles = [];
{
  const re = /style\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const value = m[2] !== undefined ? m[2] : m[3] || "";
    inlineStyles.push({ value, index: m.index });
  }
}

// ---- 2. WARN: hardcoded hex in inline style="" -----------------------------
// Tokens / oklch() are preferred. We only flag hex inside the DECK's inline
// styles — never the .css files (where .terminal etc. legitimately use oklch).
const HEX_RE = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b/g;
for (const { value, index } of inlineStyles) {
  let m;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(value)) !== null) {
    const ln = lineAt(index + (m.index >= 0 ? value.indexOf(m[0]) : 0));
    add(
      warns,
      `hardcoded hex ${m[0]} in inline style at line ${ln} — prefer a token (var(--…)) or oklch()`,
    );
  }
}

// ---- 3. WARN: 禁蓝 — blue-hue color used inline ----------------------------
// Heuristic. Blue lives roughly at OKLCH hue 220–290 (also covers indigo /
// cyan-blue). We scan inline styles for oklch(...) and #hex, convert to an
// approximate hue, and warn if it lands in the blue band AND the property is a
// foreground/accent role (color / background / fill / border / --accent…).
// This is best-effort: OKLCH hue is read directly; hex hue is approximated via
// sRGB→HSL. False positives are possible — treat as a nudge, not a hard rule.
const BLUE_LO = 220;
const BLUE_HI = 290;

function hexToHue(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 1e-6) return null; // grey, no hue
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue; // NOTE: sRGB HSL hue ≈ OKLCH hue only roughly; blue still ~210-260
}

const FG_ROLE_RE = /(?:^|;)\s*(?:color|background(?:-color)?|fill|stroke|border(?:-[a-z]+)?(?:-color)?|--accent[\w-]*|--ink[\w-]*)\s*:/i;

for (const { value, index } of inlineStyles) {
  // Only consider styles that assign a color to a foreground/accent role.
  if (!FG_ROLE_RE.test(value)) continue;

  // oklch( L C H ... ) — hue is the 3rd numeric token.
  const oklchRe = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+([\d.]+)/gi;
  let m;
  while ((m = oklchRe.exec(value)) !== null) {
    const hue = parseFloat(m[1]);
    if (hue >= BLUE_LO && hue <= BLUE_HI) {
      add(
        warns,
        `禁蓝(heuristic): inline oklch hue ${hue} (blue band ${BLUE_LO}–${BLUE_HI}) at line ${lineAt(index)} — house rule forbids blue accents`,
      );
    }
  }

  // #hex foreground colors → approximate hue.
  HEX_RE.lastIndex = 0;
  let hm;
  while ((hm = HEX_RE.exec(value)) !== null) {
    const hue = hexToHue(hm[0]);
    if (hue !== null && hue >= 200 && hue <= 270) {
      add(
        warns,
        `禁蓝(heuristic): inline hex ${hm[0]} ≈ blue hue ${hue.toFixed(0)} at line ${lineAt(index)} — house rule forbids blue accents`,
      );
    }
  }
}

// ---- 4. WARN: <img> without non-empty alt ----------------------------------
{
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|(\S+))/i);
    const alt = altMatch ? (altMatch[2] ?? altMatch[3] ?? altMatch[4] ?? "") : null;
    if (alt === null || alt.trim() === "") {
      add(warns, `<img> without non-empty alt at line ${lineAt(m.index)}`);
    }
  }
}

// ---- 5. slides: count, data-accent / data-section, missing .notes ----------
// Match each <section ... class="... slide ...">…</section> block. A .slide is
// the unit of the deck; we use a tolerant block match by pairing opening
// section tags that carry the "slide" class with their closing </section>.
const slideOpenRe = /<section\b[^>]*\bclass\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi;
let slideCount = 0;
let withAccent = 0;
let withSection = 0;
const missingNotes = [];

let so;
while ((so = slideOpenRe.exec(html)) !== null) {
  const classVal = so[2] ?? so[3] ?? "";
  if (!/\bslide\b/.test(classVal)) continue;
  slideCount++;

  const openTag = so[0];
  // Determine this slide's body: from end of open tag to the next slide's
  // <section …slide…> open, or to </body>/EOF.
  const bodyStart = so.index + openTag.length;
  slideOpenRe.lastIndex = bodyStart; // peek ahead without consuming permanently
  let bodyEnd = html.length;
  let peek;
  const peekRe = new RegExp(slideOpenRe.source, "gi");
  peekRe.lastIndex = bodyStart;
  while ((peek = peekRe.exec(html)) !== null) {
    const pv = peek[2] ?? peek[3] ?? "";
    if (/\bslide\b/.test(pv)) {
      bodyEnd = peek.index;
      break;
    }
  }
  slideOpenRe.lastIndex = bodyStart; // resume main scan right after this open tag
  const body = html.slice(bodyStart, bodyEnd);

  if (/\bdata-accent\s*=/.test(openTag)) withAccent++;
  if (/\bdata-section\s*=/.test(openTag)) withSection++;

  // A .notes child = an element carrying the "notes" class within the body.
  if (!/\bclass\s*=\s*("([^"]*\bnotes\b[^"]*)"|'([^']*\bnotes\b[^']*)')/.test(body)) {
    missingNotes.push({ idx: slideCount, line: lineAt(so.index) });
  }
}

if (missingNotes.length > 0) {
  add(
    warns,
    `${missingNotes.length} slide(s) missing speaker .notes: ` +
      missingNotes.map((s) => `#${s.idx}(line ${s.line})`).join(", "),
  );
}

add(
  infos,
  `slides: ${slideCount} · with data-accent: ${withAccent} · with data-section: ${withSection}`,
);

// ---- text-content prep (shared by the AI-slop copy rules) ------------------
// Strip everything that is NOT human-readable prose so CLI flags (`--watch`),
// CSS custom props (var(--x)), <code> snippets and the .terminal/.cmd blocks
// don't masquerade as copy. We remove, in order:
//   comments → <script>/<style> → .terminal/.cmd blocks → <code> → all tags.
// What remains is approximately the visible body text of the deck.
function stripToVisibleText(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    // drop whole elements whose class contains terminal / cmd (CLI evidence
    // blocks legitimately carry --flags and dashes we don't want to count).
    .replace(
      /<([a-z][\w-]*)\b[^>]*\bclass\s*=\s*("[^"]*\b(?:terminal|cmd)\b[^"]*"|'[^']*\b(?:terminal|cmd)\b[^']*')[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    )
    // drop inline <code>…</code> (var(--x), --flags inside prose).
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}
const visibleText = stripToVisibleText(html);

// ---- 6. WARN: em-dash overuse ----------------------------------------------
// Count em-dashes「—」and standalone「--」in visible body text. ≥5 reads as an
// AI cadence tell (impeccable threshold). Standalone「--」requires non-space on
// both sides so CSS/CLI residue that slipped through doesn't count, and so the
// CJK「——」(two em-dashes) only registers as the single「—」occurrences it is.
{
  let count = 0;
  const re = /—|(?<=\S)--(?=\S)/g;
  while (re.exec(visibleText) !== null) count++;
  if (count >= 5) {
    add(
      warns,
      `em-dash overuse: ${count} em-dashes (—/--) in visible text — AI cadence tell at ≥5; ` +
        `prefer commas/colons/periods. (advisory: Chinese「——」is legit punctuation, so this is a nudge, not a hard rule)`,
    );
  }
}

// ---- 7. WARN: eyebrow overuse ----------------------------------------------
// Our guardrail: ≤2–3 tracked-caps kickers per deck (cover / section heroes
// only). Repeating tiny uppercase labels above every heading = AI scaffolding.
{
  const re = /\bclass\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  let eyebrowCount = 0;
  while ((m = re.exec(html)) !== null) {
    const classVal = m[2] ?? m[3] ?? "";
    if (/\beyebrow\b/.test(classVal)) eyebrowCount++;
  }
  if (eyebrowCount > 3) {
    add(
      warns,
      `eyebrow overuse: ${eyebrowCount} .eyebrow elements — house guardrail is ≤2–3 tracked-caps kickers ` +
        `(cover / section heroes only); use scale & position for hierarchy, don't put a kicker on every heading`,
    );
  }
}

// ---- 8. WARN: marketing buzzwords ------------------------------------------
// Generic SaaS / 套话 in visible text. Each is an instant AI tell — say what the
// product literally does instead. CJK terms are matched as substrings; Latin
// terms require word boundaries so e.g. "leverage" doesn't catch "leveraged".
{
  const BUZZWORDS = [
    "赋能", "打造", "赛道", "闭环", "抓手", "心智",
    "streamline", "empower", "supercharge", "world-class",
    "enterprise-grade", "next-generation", "cutting-edge",
    "seamless", "leverage", "robust", "holistic",
  ];
  const isLatin = (w) => /^[a-z-]+$/i.test(w);
  const hits = [];
  for (const word of BUZZWORDS) {
    const pat = isLatin(word)
      ? new RegExp(`(?<![A-Za-z])${escapeRe(word)}(?![A-Za-z])`, "gi")
      : new RegExp(escapeRe(word), "g");
    const n = (visibleText.match(pat) || []).length;
    if (n > 0) hits.push(`${word}×${n}`);
  }
  if (hits.length > 0) {
    add(
      warns,
      `marketing buzzword(s) in visible text: ${hits.join(", ")} — ` +
        `pick a specific verb + noun that says what it literally does`,
    );
  }
}

// ---- 9. WARN: aphoristic「不是X，是Y」cadence -------------------------------
// Manufactured-contrast constructions read as AI cadence, not voice: once is
// fine, the pattern (≥3) is the tell. Covers 不是…是…/不是…而是…/X 不是 Y.
{
  let count = 0;
  // 不是 … （是 | 而是） … — the comma/word between is tolerated.
  const reNotBut = /不是[^。！？；\n]{0,40}?(?:，|,)?\s*(?:而是|是)/g;
  while (reNotBut.exec(visibleText) !== null) count++;
  if (count >= 3) {
    add(
      warns,
      `aphoristic cadence: ${count}「不是X，是Y」/「不是…而是…」contrastive constructions — ` +
        `house guardrail is ≤2; once is voice, the pattern is the AI tell`,
    );
  }
}

// ---- 10. ADVISORY: numbered section markers (01 / 02 / 03 …) ---------------
// ≥3 distinct two-digit markers 01–12 with ≥2 consecutive (e.g. 01,02,03) in
// visible text reads as AI editorial scaffolding. OK for genuine ordered
// sequences (real流程 / timeline) — hence advisory, never a warn/fail.
{
  const re = /\b(0[1-9]|1[0-2])\b/g;
  const seen = new Set();
  let m;
  while ((m = re.exec(visibleText)) !== null) seen.add(m[1]);
  if (seen.size >= 3) {
    const sorted = [...seen].sort();
    let consecutive = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (parseInt(sorted[i], 10) === parseInt(sorted[i - 1], 10) + 1) consecutive++;
    }
    if (consecutive >= 2) {
      add(
        advisories,
        `numbered section markers: ${sorted.slice(0, 8).join(", ")}${sorted.length > 8 ? ", …" : ""} ` +
          `(${seen.size} distinct, ${consecutive} consecutive) — OK only for a genuine ordered sequence; ` +
          `don't use 01/02/03 as generic section kickers`,
      );
    }
  }
}

// ---- 11. WARN/ADVISORY: highlight / block contrast (inline literal colors) -
// The signature highlight (.hl--full / .card--accent / mark) puts text ON a
// color block — so the text color must contrast with the BAND, not the page.
// Token combos resolve at render (and the per-palette --accent-ink now follows
// the band), but HAND-ROLLED inline colors can't be checked at render time, so
// catch them here: any element whose inline style sets BOTH a foreground color
// and a background to literal oklch()/#hex → compute WCAG contrast.
//   < 3.0  → WARN (fails even large text)   · 3.0–4.5 → ADVISORY (ok only大字)
{
  // OKLCH → relative luminance (Ottosson matrices); hex → luminance.
  const oklchY = (L, C, H) => {
    const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    return 0.2126 * Math.max(0, R) + 0.7152 * Math.max(0, G) + 0.0722 * Math.max(0, B);
  };
  const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const hexY = (hex) => {
    let h = hex.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    const r = srgb2lin(parseInt(h.slice(0, 2), 16) / 255);
    const g = srgb2lin(parseInt(h.slice(2, 4), 16) / 255);
    const b = srgb2lin(parseInt(h.slice(4, 6), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const colorY = (str) => {
    const ok = str.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i);
    if (ok) {
      let L = parseFloat(ok[1]); if (ok[2] === "%") L /= 100;
      return oklchY(L, parseFloat(ok[3]), parseFloat(ok[4]));
    }
    const hx = str.match(/#[0-9a-fA-F]{3,8}\b/);
    return hx ? hexY(hx[0]) : null;
  };
  const ratio = (y1, y2) => (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
  const grab = (style, prop) => {
    const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"));
    return m ? m[1].trim() : null;
  };
  for (const { value, index } of inlineStyles) {
    const fg = grab(value, "color");
    const bg = grab(value, "background(?:-color)?");
    if (!fg || !bg) continue;
    const yf = colorY(fg), yb = colorY(bg);
    if (yf == null || yb == null) continue;        // skip token/keyword colors
    const cr = ratio(yf, yb);
    if (cr < 3.0)
      add(warns, `low-contrast inline text-on-color at line ${lineAt(index)}: ratio ${cr.toFixed(2)} (<3) — ` +
        `text "${fg}" on "${bg}" is unreadable; pick a lighter/darker text for this band`);
    else if (cr < 4.5)
      add(advisories, `borderline inline contrast at line ${lineAt(index)}: ratio ${cr.toFixed(2)} ` +
        `(ok for large bold text ≥3, fails body ≥4.5) — text "${fg}" on "${bg}"`);
  }
}

// ---- report ----------------------------------------------------------------
function section(title, items) {
  if (items.length === 0) return;
  console.log(`\n${title} (${items.length})`);
  for (const it of items) console.log(`  - ${it}`);
}

console.log(`ameng-ppt validate · ${file}`);
section("FAIL", fails);
section("WARN", warns);
section("ADVISORY", advisories);
section("INFO", infos);

const result =
  fails.length > 0
    ? "FAIL"
    : warns.length > 0
      ? "PASS-WITH-WARNINGS"
      : advisories.length > 0
        ? "PASS-WITH-ADVISORIES"
        : "PASS";
console.log(`\nRESULT: ${result}`);
exit(fails.length > 0 ? 1 : 0);
