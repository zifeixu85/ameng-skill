#!/usr/bin/env node
// new-deck.mjs — scaffold a self-contained deck: its own copy of kit/, so it opens
// anywhere, can be moved or zipped, and never changes when the skill is upgraded.
//   node scripts/new-deck.mjs <name> [--theme paper] [--dir parent-folder] [--title "…"] [--brand "…"]
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exists } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const name = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!name) { console.error('用法: node scripts/new-deck.mjs <名字> [--theme paper|noir|swiss|spec|block|board] [--dir 上级目录] [--title "标题"] [--brand "品牌"]'); process.exit(2); }
const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const theme = opt("theme", "paper");
if (!["paper", "noir", "swiss", "spec", "block", "board"].includes(theme)) { console.error("没有这个主题: " + theme); process.exit(2); }
const dest = join(resolve(opt("dir", join(skill, "slides"))), name);
if (await exists(join(dest, "index.html"))) { console.error("已存在: " + dest); process.exit(1); }
await mkdir(join(dest, "images"), { recursive: true });
await cp(join(skill, "kit"), join(dest, "kit"), { recursive: true });
const title = opt("title", name), brand = opt("brand", "");
const html = (await readFile(join(skill, "templates", "deck.html"), "utf8"))
  .replaceAll("{{title}}", title).replaceAll("{{theme}}", theme).replaceAll("{{brand}}", brand);
await writeFile(join(dest, "index.html"), html);
console.log(dest);
