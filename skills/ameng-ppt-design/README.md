# ameng-ppt-design

> 有设计主见的 HTML 演示文稿/PPT 生成器 —— 全离线、可放映、**可就地编辑、可一键导出**。
>
> **作者 / Author: A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

把大纲/讲稿/想法做成静态 HTML 幻灯片：OKLCH token 系统 + 6 主题 + 版式库 + 16:9/9:16/Swiss +
自托管 distinctive 字体 + 键盘放映。强制 anti-slop（禁蓝、单 accent 60-30-10、禁 Inter/Playfair、**只画真实数据**）。

## 比普通 HTML deck 多的两件事（右上角工具栏）

| ✎ 编辑 | ⤓ 导出 |
|--------|--------|
| 点任意文字**就地修改** | 一键 **PDF**（打印引擎，OKLCH 完美） |
| **保存**到本地（刷新仍在） | 可编辑 **PPTX**（PptxGenJS，近似保真） |
| **存历史**为可恢复的版本快照 | **PNG**（当前页/全部，html2canvas） |
| **历史**抽屉：浏览 + 恢复 + 删除 | **HTML**（含编辑，放回目录即用） |

> 工具栏仅屏幕可见；放映/导出/打印时自动隐藏。编辑与版本存在本浏览器 localStorage，离线、不上传。

## 快速开始

```bash
./scripts/fetch-fonts.sh                       # 可选：一次性装字体，之后全离线
./scripts/new-ppt.sh my-talk 16x9              # 9x16 / swiss 亦可 → slides/my-talk/index.html
open slides/my-talk/index.html                 # 放映 / 右上角编辑 / 右上角导出
node scripts/validate.mjs slides/my-talk/index.html   # 纪律自检
./scripts/render.sh slides/my-talk/index.html pdf      # 像素级 PDF（本地 Chrome）
```

导出 PPTX/PNG 用到的库已内置 `assets/vendor/`；若缺失：
```bash
./scripts/fetch-export-libs.sh                 # 下载 pptxgenjs + html2canvas（PDF/HTML 不需要）
```

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
│             · fonts.css + fonts/ · vendor/ (PptxGenJS+html2canvas) · themes/*.css · fx/
├── templates/  ppt-16x9 · ppt-9x16 · ppt-swiss · layouts-gallery
├── scripts/    new-ppt.sh · fetch-fonts.sh · fetch-export-libs.sh · render.sh · validate.mjs
└── references/ 8 篇按需加载的设计/版式/纪律文档
```

## License / 致谢

MIT © **A梦 (ameng)**。内置 vendor：[PptxGenJS](https://github.com/gitbrent/PptxGenJS)（MIT）、[html2canvas](https://github.com/niklasvh/html2canvas)（MIT）。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
