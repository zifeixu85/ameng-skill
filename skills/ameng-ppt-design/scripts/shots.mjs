#!/usr/bin/env node
// shots.mjs — render every slide to PNG in its final (post-animation) state.
//   node scripts/shots.mjs <deck.html> [--theme noir] [--out dir] [--pages 1,3,5] [--scale 1] [--sheet]
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "./lib/cdp.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && !/^\d/.test(a) && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
if (!file) { console.error("usage: shots.mjs <deck.html> [--theme x] [--out dir] [--pages 1,2] [--scale 1]"); process.exit(2); }
const theme = opt("theme");
const out = resolve(opt("out", join(dirname(file), "png" + (theme ? "-" + theme : ""))));
mkdirSync(out, { recursive: true });
const page = await launch({ scale: parseFloat(opt("scale", "1")) });
const watchdog = setTimeout(() => { console.error("超时：页面没有响应"); page.close().finally(() => process.exit(1)); }, 150000);
await page.goto(pathToFileURL(resolve(file)).href + "?static");
if (theme) await page.eval(`Deck.setTheme(${JSON.stringify(theme)})`);
const n = await page.eval("Deck.slides.length");
const want = opt("pages") ? opt("pages").split(",").map(Number) : Array.from({ length: n }, (_, i) => i + 1);
for (const p of want) {
  if (process.env.SHOTS_TRACE) console.error("page", p);
  await page.eval(`Deck.go(${p - 1},{instant:true,force:true,step:99})`);
  await page.sleep(90);
  await page.png(join(out, `slide-${String(p).padStart(2, "0")}.png`), writeFileSync);
}
if (page.logs.length) console.error([...new Set(page.logs)].slice(0, 12).join("\n"));
clearTimeout(watchdog);
await page.close();
console.log(`${want.length} pages → ${out}`);
