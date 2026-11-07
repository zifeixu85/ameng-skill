# 导出 PPTX

用户在网页工具条的「导出」里自己导出，这样拿到的是他选好风格、改完内容之后的版本。要从 `serve.mjs` 给的地址打开，图片才读得到。

下面的命令用于交付前自查，输出放临时目录。只有用户明确要求时才把命令行导出的文件交给他。

```bash
node scripts/export.mjs <deck> --pptx --out <临时目录>              # 通用字体，任何电脑打开都一致
node scripts/export.mjs <deck> --pptx --fonts design --out <临时目录>   # deck 自己的字体，要先在电脑上装好
node scripts/ppt-proof.mjs <临时目录>/<name>.pptx    # 用本机 PowerPoint 打开并逐页出图（macOS）
```

## 网页到 PowerPoint 的对应

| 网页 | PowerPoint |
|---|---|
| 文字 | 文本框，保留字号、粗细、颜色、渐变、高亮、行距和断行 |
| 第一个 `.title` | 真正的标题占位符，大纲视图和无障碍读得到 |
| 色块、边框、圆角、阴影、渐变 | 形状 |
| `.kpi`、`.step`、`.mx` 这类成组内容 | 组合，可以整体拖动 |
| `table.data` | 原生表格 |
| `bar` `hbar` `line` `area` `donut` `pie` `radar` `scatter` `bubble` | 原生图表，「编辑数据」打开内嵌工作簿 |
| 其余图表、SVG 线条 | 可编辑形状和文字 |
| 图片 | 图片，保留裁切和圆角 |
| WebGL 背景 | 定格成一张图 |
| `.notes` | 讲者备注 |
| `data-step` | 点击淡入动画 |
| `data-morph` | 平滑切换 |
| 页码 | 页码字段，调整顺序后自动变 |
| 主题色和字体 | 写进 PowerPoint 主题，可在「设计」里一键换 |

## 需要知道的差异

- 默认用 Office 自带字体（微软雅黑、Arial、Georgia，宋体系用 Songti SC），和网页的字体不同，文字宽度略有差别。标题按网页的断行固定；长段落按框宽自动换行。
- `--fonts design` 只写字体名，不嵌入字体。对方电脑没装时 PowerPoint 会替换。
- 入场动画不导出，只导出你用 `data-step` 明确写的分步。自动动画放到 PowerPoint 里只会显得吵。
- 中文着重号在 PowerPoint 里变成主色文字。
- 动态背景导出后是一张定格图片，在 PowerPoint 里换主题色时它不会跟着变。

## 交付前

跑一遍 `ppt-proof.mjs`，看 PowerPoint 真实渲染的页面。网页好看不代表 PPTX 好看。这一步是自查，文件不交给用户。
