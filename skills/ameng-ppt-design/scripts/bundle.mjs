#!/usr/bin/env node
// bundle.mjs — one self-contained .html: styles, scripts, this theme's fonts and all
// images inlined. Double-click it anywhere, or send it as a single file.
//   node scripts/bundle.mjs <deck-folder|index.html> [--out file.html]
import { readFileSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { locate, MIME } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const input = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
if (!input) { console.error("用法: node scripts/bundle.mjs <deck 文件夹或 index.html> [--out 文件]"); process.exit(2); }
const { file, root } = await locate(input);
const kit = join(root, "kit");
let html = await readFile(file, "utf8");
const theme = (html.match(/data-theme="([\w-]+)"/) || [])[1] || "paper";

async function inlineCss(path) {
  let css = await readFile(path, "utf8");
  const dir = dirname(path), parts = [];
  for (const m of css.matchAll(/@import url\("([^"]+)"\);/g)) parts.push(await inlineCss(join(dir, m[1])));
  css = css.replace(/@import url\("[^"]+"\);\n?/g, "");
  return parts.join("\n") + "\n" + css;
}
const b64 = async (p) => (await readFile(p)).toString("base64");
const themeCss = await readFile(join(kit, "themes", theme + ".css"), "utf8");
const stageCss = await readFile(join(kit, "core", "stage.css"), "utf8");
let css = await inlineCss(join(kit, "kit.css"));

// fonts: keep only faces this theme can reach, embed those
const deckCss = (await Promise.all([...html.matchAll(/<link rel="stylesheet" href="(styles\/[^"]+)">/g)].map((m) => readFile(join(dirname(file), m[1]), "utf8")))).join("\n");
const wanted = (family) => themeCss.includes(family) || stageCss.includes(family) || deckCss.includes(family);
const faces = [...css.matchAll(/@font-face\{font-family:"([^"]+)";src:url\(([^)]+)\)[^}]*\}/g)];
for (const [rule, family, src] of faces) {
  if (!wanted(family)) { css = css.replace(rule, ""); continue; }
  css = css.replace(src, `data:font/woff2;base64,${await b64(join(kit, src))}`);
}

const order = ["js/decor.js", "js/motion.js", "js/charts/core.js", "js/charts/cartesian.js", "js/charts/radial.js", "js/charts/flow.js", "js/diagrams.js", "js/fx.js", "js/loops.js", "js/deck.js", "js/overlays.js", "js/dock.js", "js/presenter.js", "vendor/jszip.min.js", "js/export/ir.js", "js/export/svg.js", "js/export/xml.js", "js/export/charts.js", "js/export/package.js", "js/export/load.js", "js/edit.js"];
const js = (await Promise.all(order.map((f) => readFile(join(kit, f), "utf8")))).join("\n;\n");

// a deck's own styles travel inside the file too
for (const [tag, href] of [...html.matchAll(/<link rel="stylesheet" href="(styles\/[^"]+)">\n?/g)]) {
  html = html.replace(tag, () => "");
  css += "\n" + await readFile(join(dirname(file), href), "utf8");
}
for (const [tag, src] of [...html.matchAll(/<script src="(styles\/[^"]+)"><\/script>\n?/g)]) {
  html = html.replace(tag, () => `<script>\n${readFileSync(join(dirname(file), src), "utf8")}\n</script>\n`);
}

const imgs = [...new Set([...html.matchAll(/src="(?!data:|https?:)([^"]+\.(?:png|jpe?g|webp|gif|svg|mp4|webm))"/gi)].map((m) => m[1]))];
for (const src of imgs) {
  const p = join(dirname(file), src);
  html = html.replaceAll(`src="${src}"`, `src="data:${MIME[extname(p).toLowerCase()]};base64,${await b64(p)}"`);
}
html = html
  .replace(/<link rel="stylesheet" href="[^"]*kit\.css">\n?/, () => `<style>\n${css}\n</style>\n`)
  .replace(/<script src="[^"]*kit\.js"><\/script>\n?/, "")
  .replace("</body>", () => `<script>window.KIT_BASE="";window.KIT_BUNDLED=true;\n${js.replace(/<\/script/g, "<\\/script")}\n</script>\n</body>`);

const name = basename(dirname(file)) === "templates" ? basename(file, ".html") : basename(dirname(file));
const i = args.indexOf("--out"), out = i >= 0 ? args[i + 1] : join(dirname(file), name + ".single.html");
await writeFile(out, html);
console.log(`${out}  ${(((await stat(out)).size) / 1e6).toFixed(1)} MB`);
