---
name: ameng-ppt-design
description: >
  有设计主见的 HTML 演示文稿/PPT 生成器：把大纲/讲稿/想法做成全离线、可放映的静态 HTML 幻灯片，
  并内置「右上角悬浮工具栏」——✎ 编辑（点任意文字就地改，点「完成」自动存一个可恢复的版本，
  历史里带 diff 对比）+ ⤓ 导出（逐页截图拼装成 PDF / PPTX，保全部样式；PNG；完整自包含 HTML）。
  工业纸感 + 杂志/瑞士双风 + 叙事弧 + 反 AI 味纪律：OKLCH token 系统 + 5 主题 + 版式库 +
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
- **5 套差异化主题**（`assets/themes/*.css`，**不是换皮**——排版/构图/密度/装饰/气质都不同，见 [references/themes.md](references/themes.md)）：**`industrial-paper`（旗舰：暖纸 + grain + 软色带，中密度）** · `neo-brutalist`（粗野：黑框 + 硬投影 + 实心色块，零圆角）· `editorial`（杂志：衬线 + 疏朗 + 首字下沉 + 细下划线）· `dark-luxe`（暗调：渐变底 + 毛玻璃 + 暖金辉光）· `swiss-intl`（瑞士：超大字 + 左对齐网格 + 红色关键词 + 极简）
- **三种比例/模板**：`ppt-16x9.html`（旗舰）· `ppt-9x16.html`（竖屏 小红书/短视频）· `ppt-swiss.html`（瑞士数据风）· `layouts-gallery.html`（版式目录）
- **右上角工具栏**：`assets/editor.js`（就地编辑 + 本地保存 + 版本历史）+ `assets/export.js`（PDF/PPTX/PNG/HTML 导出）+ `assets/toolbar.css`
- **自托管 distinctive 字体**：Bricolage Grotesque（display）/ Host Grotesk（body）/ JetBrains Mono（mono）+ 思源黑/宋（CJK）。`scripts/fetch-fonts.sh` 一次性下载 → 之后全离线。**禁 Inter/Roboto/Playfair/Cormorant/IBM Plex**。
- **键盘放映运行时**（`runtime.js`）：← → / Space / F 全屏 / S 讲者备注 / O 总览 / T 浅色⇄深色 / ? 帮助 / `#/N` 深链
- **纪律工具**：`scripts/render.sh`（逐页 PNG / 像素级 PDF）· `scripts/validate.mjs`（封禁字体/硬编码 hex/禁蓝/缺 alt/缺备注 校验）

## 动手前必做：① 声明方向 ② 三问澄清

**先读/填 [references/design-direction.md](references/design-direction.md)**：品牌人格、反参考、配色（单 accent 60-30-10、**禁蓝**默认）、封禁字体、构图、设计原则。每份演示都要有声明的方向。

然后确认三件事（或基于已有内容给有主见的默认再确认）：

1. **内容 & 观众 & 页数** —— 讲什么、给谁、几页？（15min≈10 页 / 30min≈20 页 / 45min≈25-30 页）
2. **主题** —— **先开 `templates/theme-preview.html` 直观对比再定**。默认 `industrial-paper`；要态度→`neo-brutalist`；叙事/品牌→`editorial`（也最配 9:16）；夜场/产品发布→`dark-luxe`；数据/强排版→`swiss-intl`。
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

### Step 3 · 选主题（先看，再定）+ 分段色域
**别让用户只凭文字选主题** —— 打开 **`templates/theme-preview.html`**（`open` 或本地服务器），
顶部一排按钮可**实时切换 5 套主题 + 明暗**，同一页代表性内容直接对比，看准了再定。
（5 套主题的静态预览图见 `screenshots/`，README 里有画廊。）
选定后在模板里硬编码 `#theme-link`；放映时 `T` 键在该主题浅/深之间切换。给每段设 `data-section` + `data-accent`，chrome 自动跟随切色域。见 [references/themes.md](references/themes.md)。

### Step 4 · 逐页搭建（核心规则）
- **从模板复制最接近的 `.slide` 块**替换内容，不从零写。版式见 [references/layouts.md](references/layouts.md)。
- **用 token 不用 hex**；**禁蓝**（默认全场禁蓝）。
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

右上角**常驻**一排**低调的文字按钮**（`编辑 · 导出 · 全屏 · 历史`，**仅屏幕可见**，随明暗主题变色；放映/导出/打印时自动隐藏）。默认半透明、不抢内容，hover 变清晰。

### ✎ 编辑 → 完成（自动存版本）
- 点「编辑」进入编辑模式 → 标题/正文/标签等文字出现虚线框，**点进去直接改**。
- **讲者备注**：按 `S` 打开备注浮层，**直接点进去就能改**（默认可编辑、自动保存、放映时也按 `S` 看）。**备注会保留但不计入版本**（改备注不产生新版本）。
- 点「**完成**」：退出编辑 + **对「本次正文有改动的页」各自动存一个版本**；**恢复/回到已有内容不会重复生成版本**（去重）。`Esc` 同效。
- 「**历史**」：只列**当前页**的版本，**最早一条永远是「默认版本（初始）」= 版本 1**，往上是每次改动；每条**显示与上一版的文字差异（旧 → 新）**，可**恢复**（恢复内容时保留你当前的备注）或删除。「历史」按钮**仅当本页有 ≥2 个版本（即真改过）时**才显示数字角标。
- 编辑模式下方向键/空格/快捷键归文字光标所有，不会误翻页或触发放映快捷键。**编辑中切换页面**：若本页有未保存改动，会弹窗让你选「**保存并切换 / 丢弃修改 / 取消**」，不会偷偷带着未保存内容乱翻。
- 「**全屏**」：进入放映（点按手势，避开浏览器对 F 键全屏的限制；F 键依然可用）。**全屏=纯内容**：dock、快捷键提示、toast 全部隐藏。

> 编辑只动文字，不动结构/样式。要换版式仍是改 HTML。版本只存在本地，离线、不上传。

### ⤓ 导出（逐页截图 → 拼装，保全部样式）
导出统一走「**逐页激活后整页截图（modern-screenshot，OKLCH 保真），再拼装**」——
截的是**整个 stage**，所以背景/满版底色/高亮带/截图框/grain/**角标·小标题·页脚 chrome** 都进图，**一个都不丢**（不像浏览器打印会丢背景）：
- **PDF**：每页整图按精确比例合成（jsPDF）。
- **PPTX · 图片版**：每页一张满版整图（PptxGenJS）——放映/演示用最稳、最保真。
- **PPTX · 可编辑（分层版）**：每页拆成多个对象 —— ①**背景图**（页底色/分段色/grain）②**装饰图**（终端/截图框/图表等，**文字抽走**、透明底）③**顶部进度条**和**每个文字高亮色块各自单独成图**（便于在 PPT 里单独移动/替换）④**可编辑文字框**。所以**文字一律不切图、可在 PPT 里改**，装饰尽量还原（字体会被 PowerPoint 替换、个别位置可能略偏）。要 100% 保真用「图片版」，要改字用这版。
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
- [themes.md](references/themes.md) — 5 主题何时用
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
│   └── themes/*.css        (5 主题)
├── templates/              (ppt-16x9 / ppt-9x16 / ppt-swiss / layouts-gallery)
├── scripts/                (new-ppt.sh / fetch-fonts.sh / fetch-export-libs.sh / render.sh / validate.mjs)
├── references/             (8 篇，按需加载)
└── slides/<name>/          (你生成的演示，含 images/；已 gitignore)
```

## 键盘速查
```
← → Space PgUp PgDn Home End  翻页   1–9 跳到第 N 页   0 / O 幻灯片总览
F 全屏放映（自动隐藏所有操作 UI）  S 讲者备注  T 浅色/深色
? / H 快捷键帮助   #/N 深链(render.sh 用它逐页导出)
```

## 中国可用性 & 安全
全离线：纯静态 HTML/CSS/JS + 自托管字体 + 本地 localStorage，无外部 API/CDN/凭证/数据外发。
`render.sh` 仅本地 headless Chrome；`fetch-fonts.sh` / `fetch-export-libs.sh` 仅一次性下载资源。

## License / 致谢
MIT © **A梦 (ameng)**。可自由使用、修改、分享，请保留署名。
内置 `assets/vendor/`（全 MIT）：[modern-screenshot](https://github.com/qq15725/modern-screenshot)、[jsPDF](https://github.com/parallax/jsPDF)、[PptxGenJS](https://github.com/gitbrent/PptxGenJS)、[JSZip](https://github.com/Stuk/jszip)。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
