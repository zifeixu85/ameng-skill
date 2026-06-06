#!/usr/bin/env node
// ============================================================================
// intake.mjs — ameng-ppt-design 开工前四道确认闸门的「可见自检」(zero-dep)
//
//   node scripts/intake.mjs <name>          # 无则生成 intake 模板;有则校验是否填完
//
// skill 的四道闸门(内容&观众 / 页数 / 风格 / 比例 + 逐页大纲)本质是给 agent 的
// 指令,没有代码能强制 agent 不跳过。这个脚本把「是否已和用户确认」变成一个
// 文件 + 一次校验:agent 必须把用户确认到的答案写进 slides/<name>/intake.md,
// 跑这个脚本通过(exit 0)才进 Step 2 脚手架。没填完 → exit 1 并列出缺哪项。
//
// Exit: 0 已填完整 · 1 有缺项(或刚生成模板待填) · 2 用法/环境错误
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { argv, exit } from "node:process";
import { dirname } from "node:path";

const name = argv[2];
if (!name) {
  console.error("usage: node scripts/intake.mjs <name>");
  exit(2);
}

const root = new URL("..", import.meta.url).pathname;
const file = `${root}slides/${name}/intake.md`;

const TEMPLATE = `# intake · ${name}

> 开工前的四道确认闸门。每一项都要**与用户确认后**再填;填完整 → 才进 Step 2 脚手架。
> 校验:\`node scripts/intake.mjs ${name}\`(全部填好才会 exit 0)
> 冒号后写值即可;\`#\` 后是提示,可删可留。

## ① 内容 & 观众
- 目标: # 一句话:这份 deck 要让谁、在什么场合、明白/相信什么
- 受众: # 给谁看(投资人 / 同行 / 客户 / 公开分享 …)

## ② 页数体量（分档,必须用户确认,别替用户决定）
- 档位: # 精简~10 / 标准~18 / 详尽~28 / 自定义
- 页数: # 具体数字 N

## ③ 风格主题（让用户看着选,3–5 选 1）
- 主题: # industrial-paper / neo-brutalist / editorial / dark-luxe / ink-wash
- 已预览: # 是 — 用户实际看过 preview-themes.sh 或 theme-preview.html 再定的

## ④ 比例
- 比例: # 16x9(演讲) / swiss(数据驱动)

## ⑤ 逐页大纲（按选定页数,确认后再搭建）
1. # 每行一页的标题/要点,行数≈选定页数
`;

// ---- generate if missing ---------------------------------------------------
if (!existsSync(file)) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, TEMPLATE, "utf8");
  console.log(`✓ 生成 intake 模板 → slides/${name}/intake.md`);
  console.log(`  把与用户确认到的「内容/页数/风格/比例 + 逐页大纲」填进去,再跑一次本脚本校验。`);
  console.log(`\nRESULT: TODO（待填）`);
  exit(1);
}

// ---- validate --------------------------------------------------------------
let md;
try {
  md = await readFile(file, "utf8");
} catch (err) {
  console.error(`cannot read ${file}: ${err.message}`);
  exit(2);
}

// value after a `- 键:` line, stripped of inline `# 提示` and whitespace
function field(label) {
  const re = new RegExp(`^-\\s*${label}\\s*[:：]\\s*([^#\\n]*)`, "m");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

const checks = [
  { key: "目标", label: "①内容·目标", val: field("目标") },
  { key: "受众", label: "①受众", val: field("受众") },
  { key: "档位", label: "②页数·档位", val: field("档位") },
  { key: "页数", label: "②页数·N", val: field("页数") },
  { key: "主题", label: "③风格·主题", val: field("主题") },
  { key: "已预览", label: "③已预览", val: field("已预览") },
  { key: "比例", label: "④比例", val: field("比例") },
];

// outline: count numbered lines that carry real content (after the `1.` marker,
// excluding the template's `# 提示` placeholder)
const outline = (md.split(/##\s*⑤[^\n]*\n/)[1] || "")
  .split("\n")
  .map((l) => l.match(/^\s*\d+\.\s*([^#\n]*)/))
  .filter((m) => m && m[1].trim().length > 0).length;

const missing = checks.filter((c) => !c.val).map((c) => c.label);
if (outline === 0) missing.push("⑤逐页大纲(≥1 行)");

console.log(`ameng-ppt intake · slides/${name}/intake.md`);
for (const c of checks) console.log(`  ${c.val ? "✓" : "✗"} ${c.label}: ${c.val || "—（缺）"}`);
console.log(`  ${outline ? "✓" : "✗"} ⑤逐页大纲: ${outline} 行`);

if (missing.length) {
  console.log(`\n缺 ${missing.length} 项:${missing.join(" · ")}`);
  console.log(`补齐后再进脚手架。\n\nRESULT: INCOMPLETE`);
  exit(1);
}
console.log(`\n四道闸门齐全(页数 ${field("页数") || "?"} · 主题 ${field("主题")} · 比例 ${field("比例")} · 大纲 ${outline} 行)。可进 Step 2。`);
console.log(`\nRESULT: OK`);
exit(0);
