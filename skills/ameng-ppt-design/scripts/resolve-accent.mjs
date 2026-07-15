#!/usr/bin/env node
// ============================================================================
// resolve-accent.mjs — 用户主题色 → 全套安全 accent 令牌（zero-dep）
//
//   node scripts/resolve-accent.mjs "<输入>" [--name <deck>] [--write]
//
//   <输入> 可以是：
//     · 色号/HEX：  "#1E5AA8" / "1e5aa8" / "#0a7"
//     · 模糊描述：  "商务" "暖橙" "森林绿" "朱砂红" "深蓝" "tech" ...
//
//   输出：一段 CSS 覆盖块，把主题里锁死的 accent 换成用户色，并按我们的
//   --accent / --accent-soft / --accent-block / --accent-block-ink 体系派生，
//   **自适应保证「块底反白/反黑文字」对比度 ≥ 4.5**（投屏可读、达 WCAG AA）。
//
//   --name <deck> --write  → 写到 slides/<deck>/accent.css（deck 在 theme 之后引它）
//   不带 --write 只打印 CSS + 每个令牌的对比度自检，供 agent 贴进 deck <head>。
//
//   颜色数学 = Björn Ottosson OKLab ↔ 线性 sRGB（与 runtime.js 渲染口径一致），
//   不是近似 CIELab。禁蓝只是「没指定时的默认」——用户显式要蓝，就给蓝。
// Exit: 0 成功 · 2 用法/无法解析
// ============================================================================

import { writeFile, mkdir } from "node:fs/promises";
import { argv, exit } from "node:process";
import { dirname } from "node:path";

// ---- sRGB <-> linear -------------------------------------------------------
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

// ---- linear sRGB -> OKLab (Ottosson) ---------------------------------------
function linToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}
// ---- OKLab -> linear sRGB --------------------------------------------------
function oklabToLin(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// ---- hex -> OKLCH ----------------------------------------------------------
function hexToOklch(hex) {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = toLin(parseInt(h.slice(0, 2), 16) / 255);
  const g = toLin(parseInt(h.slice(2, 4), 16) / 255);
  const b = toLin(parseInt(h.slice(4, 6), 16) / 255);
  const [L, A, B] = linToOklab(r, g, b);
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

// ---- OKLCH -> WCAG relative luminance (for contrast) -----------------------
function oklchLuminance(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  let [r, g, bl] = oklabToLin(L, a, b);
  // clamp out-of-gamut to [0,1] in linear space, then WCAG luminance
  r = Math.min(1, Math.max(0, r)); g = Math.min(1, Math.max(0, g)); bl = Math.min(1, Math.max(0, bl));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
function contrast(c1, c2) {
  const l1 = oklchLuminance(c1.L, c1.C, c1.H), l2 = oklchLuminance(c2.L, c2.C, c2.H);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
const fmt = (c) => `oklch(${(c.L * 100).toFixed(1)}% ${c.C.toFixed(3)} ${c.H.toFixed(0)})`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---- 模糊描述 / 色词 → OKLCH 锚色 ------------------------------------------
// 用户显式选蓝就给蓝；禁蓝只约束「没指定时的默认」。值为 [L,C,H]。
const MOOD = {
  // 主题/行业
  商务: [0.58, 0.09, 70], business: [0.58, 0.09, 70],
  科技: [0.66, 0.13, 210], tech: [0.66, 0.13, 210], 互联网: [0.66, 0.13, 210],
  金融: [0.55, 0.13, 25], finance: [0.55, 0.13, 25], 投资: [0.55, 0.13, 25],
  教育: [0.64, 0.13, 165], education: [0.64, 0.13, 165], 培训: [0.64, 0.13, 165],
  健康: [0.64, 0.12, 150], health: [0.64, 0.12, 150], 医疗: [0.62, 0.11, 200],
  环保: [0.6, 0.14, 135], 可持续: [0.6, 0.14, 135], green: [0.6, 0.14, 135],
  活力: [0.7, 0.18, 45], energy: [0.7, 0.18, 45], 创业: [0.7, 0.18, 45], 运动: [0.66, 0.18, 30],
  奢华: [0.7, 0.09, 85], luxury: [0.7, 0.09, 85], 高端: [0.7, 0.09, 85],
  中式: [0.55, 0.17, 30], 国风: [0.55, 0.17, 30], 传统: [0.55, 0.17, 30],
  文艺: [0.58, 0.08, 40], editorial: [0.5, 0.15, 28],
  // 纯色词
  红: [0.58, 0.19, 27], 红色: [0.58, 0.19, 27], red: [0.58, 0.19, 27], 朱砂: [0.55, 0.19, 30], 朱砂红: [0.55, 0.19, 30],
  橙: [0.68, 0.16, 50], 橙色: [0.68, 0.16, 50], 暖橙: [0.7, 0.16, 55], orange: [0.68, 0.16, 50],
  黄: [0.85, 0.17, 95], 黄色: [0.85, 0.17, 95], yellow: [0.85, 0.17, 95], 金: [0.74, 0.12, 85], 金色: [0.74, 0.12, 85], gold: [0.74, 0.12, 85],
  绿: [0.62, 0.15, 145], 绿色: [0.62, 0.15, 145], green2: [0.62, 0.15, 145], 森林绿: [0.52, 0.12, 150], 墨绿: [0.48, 0.1, 155],
  青: [0.68, 0.12, 200], 青色: [0.68, 0.12, 200], teal: [0.66, 0.12, 195], 蓝绿: [0.66, 0.12, 195],
  蓝: [0.55, 0.13, 250], 蓝色: [0.55, 0.13, 250], blue: [0.55, 0.13, 250], 深蓝: [0.45, 0.12, 255], navy: [0.4, 0.1, 255], 天蓝: [0.7, 0.12, 235],
  紫: [0.55, 0.16, 305], 紫色: [0.55, 0.16, 305], purple: [0.55, 0.16, 305], violet: [0.55, 0.16, 305],
  粉: [0.72, 0.13, 0], 粉色: [0.72, 0.13, 0], pink: [0.72, 0.13, 0], 玫红: [0.6, 0.2, 5],
  棕: [0.5, 0.08, 60], 棕色: [0.5, 0.08, 60], brown: [0.5, 0.08, 60], 咖啡: [0.45, 0.06, 55],
};

function resolveInput(input) {
  const t = input.trim();
  if (/^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(t)) {
    const o = hexToOklch(t);
    if (o) return { src: `hex ${t}`, ...o };
  }
  // fuzzy: exact key, else substring (longest key first), else any color word contained
  const keys = Object.keys(MOOD).sort((a, b) => b.length - a.length);
  let key = keys.find((k) => k === t) || keys.find((k) => t.includes(k));
  if (key) { const [L, C, H] = MOOD[key]; return { src: `描述「${input}」→ ${key}`, L, C, H }; }
  return null;
}

// ---- 自适应派生：保证 block 上反色文字 ≥ 4.5 -------------------------------
function derive(base) {
  const H = base.H;
  // --accent：保留用户色相，亮度/彩度收进可用区间（既显他的色，又不过暗过淡）
  const accent = { L: clamp(base.L, 0.5, 0.74), C: clamp(base.C, 0.08, 0.2), H };
  // --accent-ink：accent 当背景时其上的文字（hl--full）。亮 accent 配黑字，深 accent 配白字
  const white = { L: 0.985, C: 0.005, H };
  const black = { L: 0.2, C: 0.02, H };
  const accentInk = contrast(white, accent) >= contrast(black, accent) ? white : black;
  // --accent-soft：淡色域
  const accentSoft = { L: clamp(base.L + 0.28, 0.9, 0.95), C: clamp(base.C * 0.35, 0.03, 0.08), H };

  // --accent-block：全场统一实色块（分节页/accent 卡）。浅色相(黄)保持亮+黑字；
  // 其余加深+白字。然后自适应推 L 直到反色文字对比度 ≥ 4.5。
  const lightHue = base.L >= 0.72;       // 黄/浅金这类本就浅的色
  let block, ink;
  if (lightHue) {
    block = { L: clamp(base.L, 0.82, 0.9), C: clamp(base.C, 0.12, 0.19), H };
    ink = { L: 0.18, C: 0.02, H };       // 黑字
    for (let i = 0; i < 24 && contrast(ink, block) < 4.5; i++) block.L = Math.min(0.93, block.L + 0.01);
  } else {
    block = { L: clamp(base.L * 0.72, 0.3, 0.42), C: clamp(base.C, 0.1, 0.17), H };
    ink = { L: 0.985, C: 0.005, H };     // 白字
    for (let i = 0; i < 24 && contrast(ink, block) < 4.5; i++) block.L = Math.max(0.22, block.L - 0.01);
  }
  return { accent, accentInk, accentSoft, accentBlock: block, accentBlockInk: ink };
}

// ---- main ------------------------------------------------------------------
const input = argv[2];
if (!input || input.startsWith("--")) {
  console.error('usage: node scripts/resolve-accent.mjs "<#hex | 模糊描述>" [--name <deck>] [--write]');
  console.error('  e.g. node scripts/resolve-accent.mjs "#1E5AA8"   /   "商务"   /   "暖橙"');
  exit(2);
}
const base = resolveInput(input);
if (!base) {
  console.error(`无法解析「${input}」。给个色号(#1E5AA8)或常见描述(商务/暖橙/森林绿/深蓝…)。`);
  exit(2);
}
const d = derive(base);
const cssVars = [
  `  --accent: ${fmt(d.accent)};`,
  `  --accent-ink: ${fmt(d.accentInk)};`,
  `  --accent-soft: ${fmt(d.accentSoft)};`,
  `  --accent-block: ${fmt(d.accentBlock)};`,
  `  --accent-block-ink: ${fmt(d.accentBlockInk)};`,
].join("\n");
// 覆盖块：盖过主题的 data-accent 锁色（同特异度，后加载即胜）。.deck 兜底单色。
const css = `/* 用户主题色覆盖 — 由 resolve-accent.mjs 生成：${base.src}
   引在 #theme-link 之后即可生效。block 反色文字对比度已自检 ≥ 4.5。 */
.deck, .deck[data-accent], .slide[data-accent] {
${cssVars}
}
`;

const cInk = contrast(d.accentInk, d.accent);
const cBlock = contrast(d.accentBlockInk, d.accentBlock);
console.log(css);
console.log(`# 自检 · 来源 ${base.src}`);
console.log(`#   accent-ink  on accent  : ${cInk.toFixed(2)}:1  ${cInk >= 4.5 ? "✓AA" : cInk >= 3 ? "△大字" : "✗"}`);
console.log(`#   block-ink   on block   : ${cBlock.toFixed(2)}:1  ${cBlock >= 4.5 ? "✓AA" : "✗"}`);
console.log(`# RESULT: ${cBlock >= 4.5 ? "OK" : "CHECK"}`);

const nameIdx = argv.indexOf("--name");
if (argv.includes("--write") && nameIdx > -1 && argv[nameIdx + 1]) {
  const name = argv[nameIdx + 1];
  const root = new URL("..", import.meta.url).pathname;
  const file = `${root}slides/${name}/accent.css`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, css, "utf8");
  console.log(`\n✓ 写入 → slides/${name}/accent.css（在 deck <head> 的 #theme-link 之后加：<link rel="stylesheet" href="accent.css">）`);
}
exit(0);
