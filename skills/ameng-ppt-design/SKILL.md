---
name: ameng-ppt-design
description: >
  有设计主见的 HTML 演示文稿/PPT 生成器：把大纲/讲稿/想法做成全离线、可放映的静态 HTML 幻灯片，
  并内置「右上角工具栏」——✎ 编辑（点任意文字就地改、保存到本地、存可恢复的历史版本）
  + ⤓ 导出（一键 PDF / 可编辑 PPTX / PNG / HTML）。
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

比普通 HTML deck 多两件事，都在**右上角工具栏**：

- **✎ 编辑** —— 点任意文字就地修改；**保存**到本地（localStorage，刷新仍在）；**存历史**为可恢复的版本快照。
- **⤓ 导出** —— 一键 **PDF**（浏览器打印引擎，OKLCH 完美）/ 可编辑 **PPTX** / **PNG** / **HTML（含编辑）**。

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

## 右上角工具栏（编辑 & 导出）

打开任意生成的演示，右上角有两个控件（**仅屏幕可见**，放映/导出/打印时自动隐藏）：

### ✎ 编辑
- 点「编辑」进入编辑模式 → 标题/正文/标签等文字出现虚线框，**点进去直接改**。
- **保存**：写入本浏览器（localStorage，按文件路径区分）；下次打开自动还原你的编辑。
- **存历史**：把当前内容存成一个带时间戳的**版本快照**。
- **历史**：右侧抽屉列出所有版本，可**恢复**（整份回退到该版本）或删除。
- **完成**：退出编辑模式（编辑保留）。`Esc` 也可退出。
- 编辑模式下方向键/空格/快捷键归文字光标所有，不会误翻页或触发放映快捷键。

> 编辑只动文字，不动结构/样式。要换版式仍是改 HTML。版本快照存在本地，离线、不上传。

### ⤓ 导出
- **PDF**：走浏览器打印引擎，OKLCH **完美还原**、零依赖、全离线。一键。
- **PPTX**：自托管 PptxGenJS 生成**可编辑** PowerPoint（按真实布局放文本框 + 图片，**近似保真**；要像素级再用 `render.sh`）。
- **PNG（当前页 / 全部）**：自托管 html2canvas 出图（近似；本设计用 OKLCH，浏览器截图库可能不支持时会提示改用 `render.sh` 出像素级 PNG）。
- **HTML（含编辑）**：把当前（含你的编辑）导出成 `.html`，放回 deck 目录即保留样式。

PPTX/PNG 用到的库**一次性**装好即可离线（仓库已内置 `assets/vendor/`；若缺失运行）：
```bash
./scripts/fetch-export-libs.sh        # 下载 pptxgenjs + html2canvas 到 assets/vendor/（PDF/HTML 不需要）
```
**像素级保真路线**（推荐做正式 PDF/PNG）：
```bash
./scripts/render.sh slides/my-talk/index.html pdf       # 逐页 @2x 合成、精确比例、纯本地 Chrome
./scripts/render.sh slides/my-talk/index.html png        # 逐页 PNG
```

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
│   ├── toolbar.css         (右上角工具栏 / 编辑态 / 版本抽屉 / toast)
│   ├── fonts.css + fonts/  (自托管 @font-face，无网络)
│   ├── runtime.js          (键盘放映 + fit + 备注 + 总览 + 切明暗 + chrome + 色域)
│   ├── editor.js           (就地编辑 + 本地保存 + 版本历史)
│   ├── export.js           (导出 PDF / PPTX / PNG / HTML)
│   ├── vendor/             (PptxGenJS + html2canvas，离线导出用；MIT)
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
内置 `assets/vendor/`：[PptxGenJS](https://github.com/gitbrent/PptxGenJS)（MIT）、[html2canvas](https://github.com/niklasvh/html2canvas)（MIT）。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
