---
name: ameng-ppt-design
description: >
  A梦的演示文稿生成器：把大纲、讲稿或想法做成动态网页演示，带图表、动效、演讲者视图和就地编辑，
  并能导出真正可编辑的 PPTX（文字、形状、表格和原生图表都能在 PowerPoint 里改，含讲者备注）。
  六套设计主题：纸墨、夜幕、网格、规格、色块、董事会；二十多种版式；二十多种数据图表。
  用户要「做 PPT / 幻灯片 / slides / deck / 演示 / 路演 / 分享稿 / pitch deck / 技术分享 / 课件 /
  动态网页演示 / 可编辑 PPTX」时使用。用户只给题目时先确认再做；已有完整大纲或讲稿时直接开做。
  做完启动本地服务并给出网址。已有 PPTX 要保留原样修改、套用客户 PPTX 模板、把图片还原成 PPTX、
  或生成讲解视频时改用 ppt-master。
---

# ameng-ppt-design

作者：A梦 (ameng)。可自由使用和分享，请保留署名。

网页是主产物：动态、可放映、可编辑。PPTX 是同一份内容的可编辑源文件。

## 开工：先判断信息够不够

**内容已经能逐页落地**（完整大纲、讲稿、旧 deck）：不问问题，直接做。叙事骨架从内容推定。

**只有题目或一句话**：先问，等回答，不要动手。用 `AskUserQuestion`（没有这个工具就写成编号选项），一次问完：

1. 内容和观众：复述你的理解，问对不对
2. 页数：约 10 / 20 / 30 页，或指定
3. 有没有图片素材、品牌色，或想要的风格（可以不答）

确认后再给一份逐页标题让用户点头，然后开做。没回答就是没确认，不要替用户决定。

**风格不用问。** 内容和风格是分开的：做一份，六套主题都能在网页上一键切换，不重新生成。先按下表选一套，用户看到成品后自己换。

**用户描述了想要的风格，或六套都不满意**：读 [references/custom-style.md](references/custom-style.md)，按规则生成一套新风格，内容不用重做。

| 场合 | 主题 |
|---|---|
| 方寸无尽对客、课程、品牌 | `paper` 纸墨 |
| 发布会、路演、主题演讲 | `noir` 夜幕 |
| 数据汇报 | `swiss` 网格 |
| 技术分享、AI 产品 | `spec` 规格 |
| 社群、创意 | `block` 色块 |
| 诊断、方案、董事会 | `board` 董事会 |

## 流程

1. **定骨架**：读 [references/writing.md](references/writing.md)，选叙事骨架，列出每页要让观众记住什么。
2. **建 deck**：
   ```bash
   node scripts/new-deck.mjs <名字> --theme paper --title "标题" --brand "品牌" [--dir 上级目录]
   ```
   得到一个自带 `kit/` 的独立文件夹，可以移动、打包，以后升级 skill 也不会影响它。用户在某个项目里工作时用 `--dir` 放进项目；否则默认放 skill 的 `slides/`。
3. **写页**：只改 `index.html` 的 `<div class="stage">` 里面。按 [references/layouts.md](references/layouts.md) 选版式，按 [references/charts.md](references/charts.md) 选图表，从 `templates/showcase.html`、`templates/catalog.html` 复制结构。动效默认就有，需要分步显示或跨页变形时看 [references/motion.md](references/motion.md)。
4. **检查**：
   ```bash
   node scripts/check.mjs <deck>            # 必须 RESULT: PASS；提醒逐条处理或说明理由
   node scripts/check.mjs <deck> --invert   # 深浅反转后再查一遍，用户可能按 T
   node scripts/shots.mjs <deck>      # 逐页出图到 <deck>/png
   ```
   检查脚本读真实像素和几何，但判断不了「这页就是丑」。出图后派一个子代理，只给它图片，让它逐页指出拥挤、对不齐、留白失衡、比邻页差的地方，改完再出图。
5. **PPTX 验收**（只为自查，文件不交给用户）：
   ```bash
   node scripts/export.mjs <deck> --pptx --out <临时目录>
   node scripts/ppt-proof.mjs <临时目录>/<名字>.pptx     # 用 PowerPoint 打开，逐页出图
   ```
   看 PowerPoint 渲染出来的页面，有问题回去改 deck。差异和字体规则见 [references/pptx.md](references/pptx.md)。
6. **交付网页**：
   ```bash
   node scripts/serve.mjs <deck>
   ```
   只把网址交给用户，告诉他：页面底部的工具条里，「主题」换风格，「编辑」改内容，「导出」选 PPTX、PDF 或图片。没有这一步不算交付。

**不要主动导出 PPTX、PDF 或图片交给用户。** 导出由用户在网页上选好风格、改完内容后自己点。只有用户明确说“直接导出给我”，或他打不开网页时，才用命令行导出。

## 硬规则

- **深色或饱和色块上的文字一律白色**。只有明黄、奶白这类浅色块用深色字。用 `.is-hot`、`.kpi--hot` 这些现成结构就自动对，不要自己给色块配文字颜色。
- **颜色收敛**：一种主色 + 墨色 + 纸色，最多一种小面积点缀。不按章节轮换整页颜色。
- **内容放在页面中上部**。现场前排人头会挡住屏幕下方，主要文字不要低于 930px（1080 高），也不要让重要内容沉到最下面。版式已经按这个排好，别手动往下推。
- **并列的几列，结构要一样**：每列都有同样的几项（比如都是一句介绍 + 优势 + 劣势），行才对得齐。重点只给一个。
- **分步别掏空第一屏**：先显示主体，只把后几项做成 `data-step`。
- **手绘 SVG 也用 token**：文字写 `fill="var(--ink)"`，色块上的文字写 `var(--on-fill)`，不写死颜色，否则切深浅模式就看不见了。
- **不写 `<style>`，不写死颜色、字号**。只用现成版式和 `var(--token)`。要品牌色就写 `data-accent="#hex"`。
- **数字必须真实**：写 `.source` 标出处；示例数字给 section 加 `data-sample`。没有数据就画概念图，不编数据。
- **标题是一句结论**，中文按语义用 `<br>` 断行。
- **每页有 `.notes`**，写成能直接念的口语。
- 一页一个主角，约 170 字以内，字不小于 21px。
- 图片先用 Read 看过再放，规则见 layouts.md。没有图不画假截图。

## 用户在网页里能做什么

工具条在页面底部，鼠标移过去才出现：

| 操作 | 方式 |
|---|---|
| 翻页、下一步 | ← → 空格，或点屏幕左右边缘 |
| 全部页面 | `O`；右键复制、隐藏、删除，拖动调整顺序 |
| 编辑 | `E`；点文字改字，选中文字可强调，点图片换图，点图表改数据 |
| 换风格、主题色 | 工具条「主题」，一键切换，不重新生成 |
| 讲者备注 | `S` |
| 演讲者视图 | `P`（当前页、下一页、提词、计时；可开观众窗到投影）|
| 手机遥控 | `scripts/remote.mjs` 启动，手机扫码：按钮或左右滑动翻页、分步、备注提词、当前页和下一页预览、计时、跳页 |
| 全屏放映 | `F` |
| 网页阅读模式 | `W`，变成可以滚动的网页 |
| 深浅反转 | `T` |
| 本页历史版本 | 工具条 ⋯ |
| 导出 | 工具条「导出」：可编辑 PPTX、PDF、本页图片、单文件网页 |

从 `serve.mjs` 的地址打开时，所有改动直接写回 `index.html`（`.versions/` 留备份）。所以用户说「我改过了」时，直接读文件。文件被别处改过时页面会提示刷新，不会覆盖。

## 命令一览

```bash
node scripts/new-deck.mjs <名字> [--theme x] [--dir 目录] [--title …] [--brand …]
node scripts/new-style.mjs <deck> <id> --name "中文名" --base paper --decor
node scripts/check.mjs <deck> [--theme x] [--invert] [--json]
node scripts/shots.mjs <deck.html> [--theme x] [--pages 1,3] [--out 目录]
node scripts/export.mjs <deck> --pptx --pdf --png [--fonts safe|design] [--theme x] [--out 目录]
node scripts/ppt-proof.mjs <文件.pptx>
node scripts/bundle.mjs <deck>      # 单文件网页，可直接发送或双击打开
node scripts/serve.mjs <deck>       # 本地地址，编辑写回文件
node scripts/remote.mjs <deck> [--no-public] [--new-token]  # 手机遥控，前台运行，Ctrl-C 停止；不写 deck，旧 deck 也能用
node scripts/upgrade-deck.mjs <deck> # 把 deck 里的 kit/ 升到当前版本
node tests/smoke.mjs                # 改了 kit 之后跑一遍回归
node tests/remote.mjs [deck]        # 改了遥控之后跑一遍，两个真实 Chrome 端到端
```

需要 Node 22 以上和 Chrome。`ppt-proof` 需要 macOS 和 PowerPoint。

## 文件

```
kit/           运行时：core/ 样式，themes/ 六套主题，js/ 放映、图表、编辑、导出，fonts/ 字体
templates/     deck.html 起始页 · showcase.html 18 页样张 · catalog.html 图表与版式目录
scripts/       上面这些命令
references/    layouts · charts · motion · themes · custom-style · pptx · writing
```

## 旧版 deck

2026 年 11 月之前做的 deck 引用 `../../assets/`，继续能打开和放映，不要动 `assets/`。改这些旧 deck 时用旧工具：`scripts/validate.mjs`、`scripts/check-overflow.mjs`、`scripts/render.sh`、`scripts/serve.sh`，文档在 `references/legacy/`。想用新设计就用 `new-deck.mjs` 重做，把内容搬过去。

## 致谢

MIT © A梦 (ameng)。字体均为 SIL OFL：思源黑体、思源宋体（Noto Sans/Serif SC）、得意黑、Archivo、Bricolage Grotesque、Instrument Sans/Serif、Newsreader、JetBrains Mono、Doto。内置 JSZip 和 modern-screenshot（MIT）。原生图表、切换动画的做法参考了 [ppt-master](https://github.com/hugohe3/ppt-master)（MIT）。
