#!/usr/bin/env node
// ============================================================================
// intake.mjs — ameng-ppt-design 开工前四道确认闸门的「可见自检」(zero-dep)
//
//   node scripts/intake.mjs <name>          # 无则生成 intake 模板;有则校验是否填完
//
// skill 的开工闸门(内容&观众 / 页数 / 风格 / 比例 + 逐页大纲)本质是给 agent 的
// 指令,没有代码能强制 agent 不跳过。这个脚本把「该想清楚的都想清楚了」变成一个
// 文件 + 一次校验:agent 必须把答案写进 slides/<name>/intake.md(标准通道=用户逐项选过;
// 快速通道=依用户已给的完整大纲推定),跑通(exit 0)才进 Step 2。没填完 → exit 1 列缺项。
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

> 开工前的确认闸门。两种填法,看用户给了多少:
>   · 🅱 标准通道(用户只给题目/一句话/想法):每项都要**用户亲自从编号选项里选过**再填(代答=违规)。
>   · 🅰 快速通道(用户已给完整逐页大纲/讲稿/旧 deck):可按大纲**推定**填,主题默认 industrial-paper、比例 16x9,
>     在下面「目标」处标注「快速通道·依据用户大纲」即可,无需再逐项追问、也不必让用户对大纲再点头。
> 两种填法都要填满整张表 → 才进 Step 2 脚手架。校验:\`node scripts/intake.mjs ${name}\`(全部填好才 exit 0)
> 冒号后写值即可;\`#\` 后是提示,可删可留。

## ① 内容 & 观众 & 素材
- 目标: # 一句话:这份 deck 要让谁、在什么场合、明白/相信什么
- 受众: # 给谁看(投资人 / 同行 / 客户 / 公开分享 …)
- 图片素材: # 必问。无 / 有(列文件或路径,收图走 references/image-handling.md;含品牌 LOGO 时注明→走三槽位,不做水印)

## ② 页数体量（标准通道让用户选;快速通道=大纲自然页数,需合并/拆页交付时说明）
- 档位: # 精简~10 / 标准~18 / 详尽~28 / 自定义 / 依大纲
- 页数: # 具体数字 N

## ③ 风格主题（从 5 套里选一套布局风格;不必开网页,直接报编号/名字）
- 主题: # industrial-paper / neo-brutalist / editorial / dark-luxe / ink-wash

## ④ 主题色（必确认,别永远用默认色!）
- 主题色: # 默认 / 一个色号(#1E5AA8) / 一个描述(商务·暖橙·森林绿·深蓝) / 让我按主题推荐
- 已应用: # 默认=用主题自带色; 否则跑 resolve-accent.mjs 写 accent.css 并在 deck 引入(记「已写 accent.css」)

## ⑤ 比例
- 比例: # 16x9(演讲) / swiss(数据驱动)

## ⑥ 叙事骨架 mode（决定整份 deck 的骨架,选一个;同素材换 mode 骨架完全不同）
- 叙事mode: # pyramid 结论先行(默认,汇报/路演首选) / narrative 故事线(起承转合) / instructional 教学步骤(照着做) / showcase 逐项展示(作品/功能巡览) / briefing 简报速览(信息密度高,少铺陈)

## ⑦ 事实溯源（有真实数字就登记;纯概念 deck 无数据可写「无」）
> 页面上每个真实数据组件(data-hero/bars/donut/funnel/gauge/linechart/…)标 \`data-fact="出处"\`,出处登记到下表;
> 编造/示例数字则标 \`data-scenario\` + 页面放可见「示例数据」标签(validate 会查)。**发散不是编造许可。**
- 有无真实数据: # 有 / 无(纯概念)
| fact | 这个数字说什么 | 出处 | 采集日期 |
|---|---|---|---|
| F1 | # 例:42% 创业失败归因于没有市场需求 | # CB Insights 2021 | # 2026-07-20 |

## ⑧ 逐页大纲（标准通道确认后再搭;快速通道直接来自用户大纲,无需再点头）
1. # 每行一页的标题/要点,行数≈页数
`;

// ---- generate if missing ---------------------------------------------------
if (!existsSync(file)) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, TEMPLATE, "utf8");
  console.log(`✓ 生成 intake 模板 → slides/${name}/intake.md`);
  console.log(`  把「内容/页数/风格/比例 + 逐页大纲」填进去(标准通道=用户选过;快速通道=依大纲推定),再跑一次校验。`);
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

// value after a `- 键:` line, stripped of inline `# 提示` and whitespace.
// Use [ \t]* (NOT \s*) around the value — \s* would swallow the newline on an
// EMPTY field and grab the next line's value, letting a blank gate falsely pass.
function field(label) {
  const re = new RegExp(`^-[ \\t]*${label}[ \\t]*[:：][ \\t]*([^#\\n]*)`, "m");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

const checks = [
  { key: "目标", label: "①内容·目标", val: field("目标") },
  { key: "受众", label: "①受众", val: field("受众") },
  { key: "图片素材", label: "①图片素材(无也要写「无」)", val: field("图片素材") },
  { key: "档位", label: "②页数·档位", val: field("档位") },
  { key: "页数", label: "②页数·N", val: field("页数") },
  { key: "主题", label: "③风格·主题", val: field("主题") },
  { key: "主题色", label: "④主题色(默认/色号/描述/推荐)", val: field("主题色") },
  { key: "比例", label: "⑤比例", val: field("比例") },
  { key: "叙事mode", label: "⑥叙事mode(pyramid/narrative/instructional/showcase/briefing)", val: field("叙事mode") },
];

// outline: count numbered lines that carry real content (after the `1.` marker,
// excluding the template's `# 提示` placeholder). ⑧ is the LAST section so its
// split tail is clean (⑥ mode / ⑦ facts sit above it, no numbered `1.` lines).
const outline = (md.split(/##\s*⑧[^\n]*\n/)[1] || "")
  .split("\n")
  .map((l) => l.match(/^\s*\d+\.\s*([^#\n]*)/))
  .filter((m) => m && m[1].trim().length > 0).length;

const missing = checks.filter((c) => !c.val).map((c) => c.label);
if (outline === 0) missing.push("⑧逐页大纲(≥1 行)");

console.log(`ameng-ppt intake · slides/${name}/intake.md`);
for (const c of checks) console.log(`  ${c.val ? "✓" : "✗"} ${c.label}: ${c.val || "—（缺）"}`);
console.log(`  ${outline ? "✓" : "✗"} ⑧逐页大纲: ${outline} 行`);

if (missing.length) {
  console.log(`\n缺 ${missing.length} 项:${missing.join(" · ")}`);
  console.log(`补齐后再进脚手架。\n\nRESULT: INCOMPLETE`);
  exit(1);
}
console.log(`\n闸门齐全(页数 ${field("页数") || "?"} · 主题 ${field("主题")} · 主题色 ${field("主题色")} · 比例 ${field("比例")} · mode ${field("叙事mode") || "?"} · 大纲 ${outline} 行)。可进 Step 2。`);
console.log(`\nRESULT: OK`);
exit(0);
