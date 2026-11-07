# ameng-ppt-design

> 把大纲做成动态网页演示，再导出真正可编辑的 PPTX。
>
> **作者 / Author: A梦 (ameng)** · 自由分享与使用，请保留署名。

- **网页是主产物**：图表自己长出来，文字逐行入场，页面之间有变形过渡，带演讲者视图和网页阅读模式。
- **PPTX 是可编辑源文件**：文字、形状、表格都是原生的；柱状、折线、环形等九类图表是 PowerPoint 原生图表，「编辑数据」能打开内嵌表格；讲者备注和分步动画都带过去。
- **六套设计主题**：纸墨、夜幕、网格、规格、色块、董事会。同一份内容切换主题，气质完全不同。
- **手机遥控**：`node scripts/remote.mjs <deck>`，扫码后手机翻页、看备注和下一页，deck 文件不改动。
- **改动写回文件**：在网页里改字、换图、改图表数据、调页序，都直接存进 `index.html`。

## 快速开始

```bash
node scripts/new-deck.mjs my-talk --theme noir --title "我的分享"
node scripts/serve.mjs slides/my-talk          # 打开本地地址
node scripts/check.mjs slides/my-talk          # 质量检查
node scripts/export.mjs slides/my-talk --pptx  # 导出可编辑 PPTX
```

需要 Node 22 以上和 Chrome。完整说明见 [SKILL.md](SKILL.md)。

## 样张

- [templates/showcase.html](templates/showcase.html)：18 页样张，工具条「主题」切换六套风格
- [templates/catalog.html](templates/catalog.html)：全部图表和版式

## License / 致谢

MIT © **A梦 (ameng)**。字体均为 SIL OFL。内置 [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)、[JSZip](https://github.com/Stuk/jszip)、[modern-screenshot](https://github.com/qq15725/modern-screenshot)（MIT）。原生图表和切换动画的做法参考了 [ppt-master](https://github.com/hugohe3/ppt-master)（MIT）。
