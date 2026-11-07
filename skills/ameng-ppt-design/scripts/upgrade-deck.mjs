#!/usr/bin/env node
// upgrade-deck.mjs — refresh a deck's private kit/ to this skill's version. Slides are untouched.
//   node scripts/upgrade-deck.mjs <deck-folder>
import { cp, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exists } from "./lib/deckfs.mjs";

const input = process.argv[2];
if (!input) { console.error("用法: node scripts/upgrade-deck.mjs <deck 文件夹>"); process.exit(2); }
const deck = resolve(input), skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!(await exists(join(deck, "kit", "kit.js")))) { console.error("这不是新版 deck（没有 kit/）: " + deck); process.exit(1); }
const old = join(deck, ".kit-old");
await rm(old, { recursive: true, force: true });
await rename(join(deck, "kit"), old);
try {
  await cp(join(skill, "kit"), join(deck, "kit"), { recursive: true });
  await rm(old, { recursive: true, force: true });
  console.log("已升级: " + deck);
} catch (e) {
  await rm(join(deck, "kit"), { recursive: true, force: true });
  await rename(old, join(deck, "kit"));
  console.error("升级失败，已恢复原样: " + e.message);
  process.exit(1);
}
