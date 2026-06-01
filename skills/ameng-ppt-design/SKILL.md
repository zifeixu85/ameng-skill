---
name: ameng-ppt-design
description: >
  有设计主见的 HTML 演示文稿/PPT 生成器：把大纲/讲稿/想法做成全离线、可放映的静态 HTML 幻灯片，
  并内置「右上角悬浮工具栏」——✎ 编辑（点任意文字就地改，点「完成」自动存一个可恢复的版本，
  历史里带 diff 对比）+ ⤓ 导出（逐页截图拼装成 PDF / PPTX，保全部样式；PNG；完整自包含 HTML）。
  工业纸感 + 杂志/瑞士双风 + 叙事弧 + 反 AI 味纪律：OKLCH token 系统 + 6 主题 + 版式库 +
  16:9/9:16/Swiss + 自托管 distinctive 字体（禁 Inter/Playfair）+ 键盘放映 + 逐页 PNG 自检 +
  validate 纪律校验。产物是用户真看得见的 HTML，可放映、可就地编辑、可一键导出多种格式。
  当用户要「做 PPT / 幻灯片 / slides / deck / 演示 / 路演 / 分享稿 / 小红书图文 / pitch deck /
  技术分享」时触发。
  关键词：ppt / 幻灯片 / slides / deck / presentation / 演示文稿 / 演讲稿 / 路演 / pitch deck /
  keynote / 分享稿 / 小红书图文 / 竖屏 / 瑞士风 / 杂志风 / HTML 演示 / 就地编辑 / 导出 PDF PPTX。
version: "1.0.0"
metadata:
  author: A梦 (ameng)
  homepage: https://github.com/zifeixu85/ameng-skill#ameng-ppt-design
---

# ameng-ppt-design — 有设计主见的 HTML 演示生成器

> 作者 / Author: **A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

把文本/大纲/想法做成**有设计主见、全离线、可放映**的静态 HTML 演示。
一个 OKLCH token 系统（`assets/base.css` + `assets/components.css`）+ 一个主题 = 一套外观；
一个版式块 = 一种页型。**始终从模板复制，不从零写。**

比普通 HTML deck 多两件事，都在**右上角悬浮工具栏**（默认只是一个低调的 `⋯` handle，hover 才展开；
随主题明暗自动变色；不占内容位）：

- **✎ 编辑** —— 点任意文字就地修改；点「**完成**」退出并**自动存一个版本**（localStorage，刷新仍在）；「**历史**」里带 **diff 对比**，可一键恢复。
- **⤓ 导出** —— **逐页截图→拼装**：**PDF**（jsPDF）/ **PPTX**（每页整图）保全部样式 · **PNG**（当前页 / 全部 zip）· **HTML**（样式字体内联，完整自包含）。

## 给你什么

- **OKLCH token 设计系统**：`base.css`（tokens + slide 原语 + 行内高亮带 `.hl` + film grain + 分段 accent 色域）+ `components.css`（编辑式 chrome / terminal / 截图框 / 编号卡 / Swiss Data Hero / 离线背景）
- **6 套主题**（`assets/themes/*.css`）：**`industrial-paper`（旗舰：暖纸 + ember + grain，带深色变体）** · `editorial-ink`（杂志）· `swiss-signal`（瑞士国际主义）· `obsidian-tech`（深色技术）· `porcelain`（轻奢/小红书）· `blueprint`（数据/咨询，仅此一处用蓝）
- **三种比例/模板**：`ppt-16x9.html`（旗舰）· `ppt-9x16.html`（竖屏 小红书/短视频）· `ppt-swiss.html`（瑞士数据风）· `layouts-gallery.html`（版式目录）
- **右上角工具栏**：`assets/editor.js`（就地编辑 + 本地保存 + 版本历史）+ `assets/export.js`（PDF/PPTX/PNG/HTML 导出）+ `assets/toolbar.css`
- **自托管 distinctive 字体**：Bricolage Grotesque（display）/ Host Grotesk（body）/ JetBrains Mono（mono）+ 思源黑/宋（CJK）。`scripts/fetch-fonts.sh` 一次性下载 → 之后全离线。**禁 Inter/Roboto/Playfair/Cormorant/IBM Plex**。
- **键盘放映运行时**（`runtime.js`）：← → / Space / F 全屏 / S 讲者备注 / O 总览 / T 浅色⇄深色 / ? 帮助 / `#/N` 深链
- **纪律工具**：`scripts/render.sh`（逐页 PNG / 像素级 PDF）· `scripts/validate.mjs`（封禁字体/硬编码 hex/禁蓝/缺 alt/缺备注 校验）

## 动手前必做：① 声明方向 ② 三问澄清

**先读/填 [references/design-direction.md](references/design-direction.md)**：品牌人格、反参考、配色（单 accent 60-30-10、**禁蓝**默认）、封禁字体、构图、设计原则。每份演示都要有声明的方向。

然后确认三件事（或基于已有内容给有主见的默认再确认）：

1. **内容 & 观众 & 页数** —— 讲什么、给谁、几页？（15min≈10 页 / 30min≈20 页 / 45min≈25-30 页）
2. **主题** —— 默认 `industrial-paper`。技术分享→`obsidian-tech`；瑞士数据→`swiss-signal`；小红书→`porcelain`（配 9:16）；正式报表→`blueprint`。
3. **比例** —— 16:9（演讲）/ 9:16（手机·小红书）/ swiss（数据驱动）。

## 工作流

### Step 0 · 一次性装字体（可选）
```bash
./scripts/fetch-fonts.sh          # 下载 distinctive woff2，之后全离线（不跑也能用：优雅回退系统 CJK 栈）
```

### Step 1 · 叙事弧 + 节奏
用叙事弧排页：**Hook → Context → Core → Shift → Takeaway**；hero 页与普通页交替。详见 [references/authoring-guide.md](references/authoring-guide.md)。

### Step 2 · 脚手架
```bash
./scripts/new-ppt.sh my-talk 16x9     # 或 9x16 / swiss → 生成 slides/my-talk/index.html
open slides/my-talk/index.html
```

### Step 3 · 选主题 + 分段色域
硬编码 `#theme-link` 选定主题；放映时 `T` 键在该主题浅/深之间切换。给每段设 `data-section` + `data-accent`，chrome 自动跟随切色域。见 [references/themes.md](references/themes.md)。

### Step 4 · 逐页搭建（核心规则）
- **从模板复制最接近的 `.slide` 块**替换内容，不从零写。版式见 [references/layouts.md](references/layouts.md)。
- **用 token 不用 hex**；**禁蓝**（除 blueprint）。
- **一页一个核心信息**；标题陈述结论。行内高亮带 `.hl` 只圈关键短语，全场一个 accent。
- 截图走 [references/screenshot-framing.md](references/screenshot-framing.md)；没图用 `.frame__placeholder`（不造假 UI）。
- **数据必须真实可溯源**；无真实数据 → 文字版式，绝不编数字/假图表。
- 讲者备注写进 `<div class="notes">`（`S` 看）。

### Step 5 · 自检（必做闸门）
```bash
node scripts/validate.mjs slides/my-talk/index.html     # 封禁字体/硬编码hex/禁蓝/alt/备注
./scripts/render.sh slides/my-talk/index.html 10        # 逐页 PNG（9:16 加 720x1280）
```
逐页看 PNG，对照 [references/anti-slop-checklist.md](references/anti-slop-checklist.md)：溢出？对比度？AI 味？**有问题就改。**

### Step 6 · 编辑 & 导出 & 交付
见下节「右上角工具栏」。HTML 可键盘放映 / 投屏 / 发链接。

## 右上角悬浮工具栏（编辑 & 导出）

打开任意生成的演示，右上角默认只有一个低调的 `⋯` handle（**仅屏幕可见**，放映/导出/打印时自动隐藏）。
**hover 或点它** → 展开浮层（ghost 文字按钮，随明暗主题变色，不固定占位、不挡内容）：

### ✎ 编辑 → 完成（自动存版本）
- 点「编辑」进入编辑模式 → 标题/正文/标签等文字出现虚线框，**点进去直接改**。
- 点「**完成**」：退出编辑 + **自动把当前内容存成一个带时间戳的版本**（localStorage，按文件路径区分；下次打开自动还原）。`Esc` 同效。
- 「**历史**」：右侧抽屉列出每个版本，**显示与上一版的文字差异（P3：旧 → 新）**，便于判断恢复哪一版；可**恢复**或删除。
- 编辑模式下方向键/空格/快捷键归文字光标所有，不会误翻页或触发放映快捷键。
- 「**全屏**」：进入放映（点按手势，避开浏览器对 F 键全屏的限制；F 键依然可用）。

> 编辑只动文字，不动结构/样式。要换版式仍是改 HTML。版本只存在本地，离线、不上传。

### ⤓ 导出（逐页截图 → 拼装，保全部样式）
导出统一走「**先把每页渲染成高清 PNG（modern-screenshot，OKLCH 保真），再拼装**」——
所以背景/高亮带/截图框/grain 等样式**一个都不丢**（不像浏览器打印会丢背景）：
- **PDF**：每页整图按精确比例合成（jsPDF）。
- **PPTX**：每页一张满版整图（PptxGenJS）——放映/演示用最稳。
- **PNG**：当前页单张，或全部打包成 **zip**（JSZip）。
- **HTML（完整）**：把当前（含编辑）的演示导出成**自包含** `.html`——所有 CSS 内联、字体 base64 嵌入、运行时内联，单文件独立打开即带全样式、可键盘放映。

导出库**仓库已内置** `assets/vendor/`（committed，开箱离线可用，全 MIT）。要刷新/重装：
```bash
./scripts/fetch-export-libs.sh        # modern-screenshot + jspdf + pptxgenjs + jszip
```
> 注：浏览器导出在 `http://`（含本地服务器）下最稳；若直接 `file://` 双击打开，浏览器安全策略可能拦截截图/字体读取，
> 此时改用本地服务器（`python3 -m http.server`），或用 `scripts/render.sh` 出像素级 PNG/PDF。

## 纪律红线（anti-slop，完整见 references/）

- **只用 OKLCH**；**禁 Inter/Roboto/Playfair/Cormorant/IBM Plex**；字体自托管离线。
- **禁蓝**（默认）；**单 accent 60-30-10**；禁纯黑纯白。
- **只画真实数据**：无可溯源数据 → 文字版式，不编数字、不造假图表。
- 不加标题装饰线；阴影/圆角克制；统一圆角+统一描边+差异化填充。
- 大字号 scale 对比制造层级；**说清楚 > 好看**；不默认模板。
- 已内置 `prefers-reduced-motion` 降级与键盘可达性。

## 渐进式加载（按需读 references/）

- [design-direction.md](references/design-direction.md) — 品味锚点（先读/先填）
- [anti-slop-checklist.md](references/anti-slop-checklist.md) — 纪律闸门
- [design-system.md](references/design-system.md) — token + 组件完整清单 + 新建主题
- [themes.md](references/themes.md) — 6 主题何时用
- [layouts.md](references/layouts.md) — 版式与 helper class
- [authoring-guide.md](references/authoring-guide.md) — 叙事弧 + 完整流程 + 实例
- [screenshot-framing.md](references/screenshot-framing.md) — 截图美化
- [image-prompts.md](references/image-prompts.md) — 配图/重做截图 prompt

## 文件结构

```
ameng-ppt-design/
├── SKILL.md / README.md
├── assets/
│   ├── base.css            (OKLCH token + slide 原语 + .hl + grain + 分段 accent + 打印分页)
│   ├── components.css      (chrome / terminal / frame / card--num / data-hero / 背景)
│   ├── toolbar.css         (悬浮 dock / 编辑态 / 版本抽屉+diff / toast / 截图辅助)
│   ├── fonts.css + fonts/  (自托管 @font-face，无网络)
│   ├── runtime.js          (键盘放映 + fit + 备注 + 总览 + 切明暗 + chrome + 色域)
│   ├── editor.js           (悬浮 dock + 就地编辑 + 完成自动存版本 + 历史 diff + 全屏)
│   ├── export.js           (逐页截图→拼装：PDF / PPTX / PNG / 完整 HTML)
│   ├── vendor/             (modern-screenshot + jspdf + pptxgenjs + jszip；MIT)
│   ├── fx-runtime.js + fx/ (opt-in Canvas 背景，默认关)
│   └── themes/*.css        (6 主题)
├── templates/              (ppt-16x9 / ppt-9x16 / ppt-swiss / layouts-gallery)
├── scripts/                (new-ppt.sh / fetch-fonts.sh / fetch-export-libs.sh / render.sh / validate.mjs)
├── references/             (8 篇，按需加载)
└── slides/<name>/          (你生成的演示，含 images/；已 gitignore)
```

## 键盘速查
```
← → Space PgUp PgDn Home End  翻页   F 全屏  S 备注  O 总览
T 浅色/深色   ? / H 快捷键帮助   #/N 深链(render.sh 用它逐页导出)
```

## 中国可用性 & 安全
全离线：纯静态 HTML/CSS/JS + 自托管字体 + 本地 localStorage，无外部 API/CDN/凭证/数据外发。
`render.sh` 仅本地 headless Chrome；`fetch-fonts.sh` / `fetch-export-libs.sh` 仅一次性下载资源。

## License / 致谢
MIT © **A梦 (ameng)**。可自由使用、修改、分享，请保留署名。
内置 `assets/vendor/`（全 MIT）：[modern-screenshot](https://github.com/qq15725/modern-screenshot)、[jsPDF](https://github.com/parallax/jsPDF)、[PptxGenJS](https://github.com/gitbrent/PptxGenJS)、[JSZip](https://github.com/Stuk/jszip)。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
