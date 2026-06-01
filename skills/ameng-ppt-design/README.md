# ameng-ppt-design

> 有设计主见的 HTML 演示文稿/PPT 生成器 —— 全离线、可放映、**可就地编辑、可一键导出**。
>
> **作者 / Author: A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

把大纲/讲稿/想法做成静态 HTML 幻灯片：OKLCH token 系统 + 6 主题 + 版式库 + 16:9/9:16/Swiss +
自托管 distinctive 字体 + 键盘放映。强制 anti-slop（禁蓝、单 accent 60-30-10、禁 Inter/Playfair、**只画真实数据**）。

## 比普通 HTML deck 多的两件事（右上角工具栏）

| ✎ 编辑 | ⤓ 导出（逐页整页截图→拼装，连角标/小标题/页脚都进图） |
|--------|--------|
| 点任意文字**就地修改**；**讲者备注**可改、保留、**不计入版本** | **PDF**（每页整图合成，jsPDF） |
| 点「**完成**」对**正文改过的页**各存一版（刷新仍在） | **PPTX · 图片版**（每页满版整图，高保真） |
| **历史只看当前页**：默认版=版本1 + diff 旧→新；**≥2 版才显示数字角标** | **PPTX · 可编辑（保真版）**：装饰转底图 + 文字可在 PPT 改、无重影 |
| 悬浮 `⋯`，移到屏幕顶部即展开，随主题变色 | **PNG**（当前页 / 全部 zip）· **HTML**（自包含单文件） |

> dock 默认只是个低调 `⋯`，移到屏幕最上面一条或 hover 即展开、不挡内容；**全屏放映时连同快捷键提示一起隐藏**（纯内容）。
> 编辑与版本存本浏览器 localStorage，离线、不上传。导出逐页整页截图（modern-screenshot，OKLCH 保真）再拼装，背景/高亮带/grain/chrome 一个都不丢。
> 键盘：`1–9` 跳页 · `0`/`O` 总览 · `F` 全屏 · `S` 备注 · `T` 明暗。

## 快速开始

```bash
./scripts/fetch-fonts.sh                       # 可选：一次性装字体，之后全离线
./scripts/new-ppt.sh my-talk 16x9              # 9x16 / swiss 亦可 → slides/my-talk/index.html
open slides/my-talk/index.html                 # 放映 / 右上角编辑 / 右上角导出
node scripts/validate.mjs slides/my-talk/index.html   # 纪律自检
./scripts/render.sh slides/my-talk/index.html pdf      # 像素级 PDF（本地 Chrome）
```

导出库已内置 `assets/vendor/`（开箱离线可用）；要刷新：
```bash
./scripts/fetch-export-libs.sh                 # modern-screenshot + jspdf + pptxgenjs + jszip
```
> 浏览器导出在 `http://`（本地服务器）下最稳；直接 `file://` 双击可能被浏览器拦截截图，改用本地服务器或 `render.sh`。

## 主题 & 比例

- 主题：`industrial-paper`（旗舰）· `editorial-ink`（杂志）· `swiss-signal`（瑞士）· `obsidian-tech`（深色技术）· `porcelain`（轻奢/小红书）· `blueprint`（数据/咨询）
- 比例：`16x9`（演讲）· `9x16`（小红书/竖屏）· `swiss`（数据驱动）

## 安装

整库装见仓库根 README。单独装这一个：

```bash
cp -r skills/ameng-ppt-design ~/.claude/skills/ameng-ppt-design
```

其它宿主（OpenClaw / Hermes / Codex）：把目录放进各自 skills 目录即可。

## 文件结构

```
ameng-ppt-design/
├── SKILL.md / README.md
├── assets/   base.css · components.css · toolbar.css · runtime.js · editor.js · export.js
│             · fonts.css + fonts/ · vendor/ (modern-screenshot+jspdf+pptxgenjs+jszip) · themes/*.css · fx/
├── templates/  ppt-16x9 · ppt-9x16 · ppt-swiss · layouts-gallery
├── scripts/    new-ppt.sh · fetch-fonts.sh · fetch-export-libs.sh · render.sh · validate.mjs
└── references/ 8 篇按需加载的设计/版式/纪律文档
```

## License / 致谢

MIT © **A梦 (ameng)**。内置 vendor（全 MIT）：[modern-screenshot](https://github.com/qq15725/modern-screenshot)、[jsPDF](https://github.com/parallax/jsPDF)、[PptxGenJS](https://github.com/gitbrent/PptxGenJS)、[JSZip](https://github.com/Stuk/jszip)。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
