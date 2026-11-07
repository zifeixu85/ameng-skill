#!/usr/bin/env node
// new-style.mjs — start a custom style for one deck, on top of the closest built-in theme.
// Writes <deck>/styles/<id>.css (+ .js with --decor) with every token ready to edit, and turns it on.
//   node scripts/new-style.mjs <deck> <id> --name "中文名" --base paper [--decor]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exists, locate } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const [input, id] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--") || args[i - 1] === "--decor");
const base = opt("base", "paper"), name = opt("name", id);
if (!input || !/^[a-z][\w-]*$/.test(id || "")) { console.error('用法: node scripts/new-style.mjs <deck> <英文id> --name "中文名" --base paper|noir|swiss|spec|block|board [--decor]'); process.exit(2); }
const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themeFile = join(skill, "kit", "themes", base + ".css");
if (!(await exists(themeFile))) { console.error("没有这个基础主题: " + base); process.exit(2); }
const { file } = await locate(input);
const deck = dirname(file), dest = join(deck, "styles", id + ".css");
if (await exists(dest)) { console.error("已存在: " + dest); process.exit(1); }

/* copy the base theme's tokens, so every value is visible and nothing is forgotten */
const src = await readFile(themeFile, "utf8");
const scoped = `.deck[data-theme="${base}"][data-style="${id}"]`;
const blocks = [...src.matchAll(/\.deck\[data-theme="[\w-]+"\](?: \.slide\[data-tone="(\w+)"\])? \{\n?([^}]*)\}/g)]
  .filter((m) => /--(bg|ink|accent|brand)\b/.test(m[2]))
  .map((m) => `${scoped}${m[1] ? ` .slide[data-tone="${m[1]}"]` : ""} {\n  ${m[2].trim().replace(/\n\s*/g, "\n  ")}\n}`);
const css = `/* ${name}：为这份 deck 定制的风格，基于 ${base}。规则见 references/custom-style.md。
   改这里的颜色、字体和气质。版式、图表、动效、导出都继承，不用重写。
   不要改字号上限。--brand 是带文字的色块，要深到白字清楚。 */
${blocks.join("\n")}

/* 这一套独有的处理写在下面，选择器都以 .deck[data-style="${id}"] 开头 */
`;
await mkdir(join(deck, "styles"), { recursive: true });
await writeFile(dest, css);
if (args.includes("--decor")) {
  await writeFile(join(deck, "styles", id + ".js"), `/* ${name}：装饰和节奏。decor 返回的是真实 DOM/SVG，会导出成可编辑形状。 */
window.DeckStyles = window.DeckStyles || {};
window.DeckStyles[${JSON.stringify(id)}] = {
  tones: { section: "dark", closing: "dark" },            // 哪些页型默认换底
  motion: { title: "lines", item: "fade", stagger: 90, dur: 900, gap: 200 },
  decor: function (slide, layout, ctx) {
    if (layout === "cover") return "";                     // 返回 HTML 字符串
    return "";
  }
};
`);
}
let html = await readFile(file, "utf8");
const extra = `<meta name="deck-style" content="${id}|${name.replace(/[|"<>]/g, "")}|${base}">\n<link rel="stylesheet" href="styles/${id}.css">\n` + (args.includes("--decor") ? `<script src="styles/${id}.js"></script>\n` : "");
html = html.replace(/(<script src="[^"]*kit\.js"><\/script>\n)/, `$1${extra}`);
html = html.replace(/(<main class="deck"[^>]*?)\s+data-style="[^"]*"/, "$1").replace(/(<main class="deck"[^>]*?)\bdata-theme="[\w-]+"/, `$1data-theme="${base}" data-style="${id}"`);
await writeFile(file, html);
console.log(dest);
