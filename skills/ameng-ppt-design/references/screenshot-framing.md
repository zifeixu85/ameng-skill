# screenshot-framing.md — 截图美化子系统

> 裸贴一张产品截图，是 deck 里最常见的「demo 味」来源。这份指南把截图升级成
> 「印在好纸上」的水准。融合 归藏 screenshot-beautification + 工业纸感 framed-card。
> 组件定义在 `components.css`（`.frame*` / `.frame__placeholder`），背景在 base/components（`.bg-dots`/`.bg-paper`）。

---

## 三档框（统一框 + 统一阴影）

| class | 效果 | 何时用 |
|---|---|---|
| `.frame` | 圆角 + 发丝边 + `--shadow-2` 的卡片框 | 任何裸图的最低标准 |
| `.frame--browser` | 在 `.frame` 上加假浏览器栏（顶部 2rem + 交通灯点） | 网页 / Web 应用截图 |
| `.frame--shadow` | 把阴影升到 `--shadow-3`（更深） | 需要从纸面「浮起」的 hero 截图 |

```html
<div class="frame frame--browser frame--shadow">
  <img src="images/01-dashboard.png" alt="部署后的实时面板">
</div>
```

**铁律：一份 deck 里所有截图用同一套框 + 同一档阴影。** 混用框/阴影是廉价感的来源。
`.frame img` / `.frame__shot` 已设 `width:100%;height:auto`，图片自动贴合框。
**图片比例 ≠ 版位比例**（用户给的高图/竖图/信息图）→ 别用裸 `.frame` 硬放，
走 [image-handling.md](image-handling.md) 的 `.frame--cover`（裁切对主体）/ `.frame--contain`（留白配底色）决策树。

## 裁切原则

- **裁掉无关 chrome**：浏览器地址栏、操作系统任务栏、空白边——`.frame--browser` 已经给了一条统一的假栏，原图自带的就裁掉，别叠两层。
- **底部裁切**：长截图保留**有信息的上半部**，底部裁成干净的水平边，让框收口整齐；不要让滚动条/半截内容出现在框底。
- **统一宽高比**：同一页并排的两张截图，裁成同一比例（如都 16:10），视觉才齐。
- **不放大糊图**：宁可裁紧，不要把小图拉大到模糊。

## 摆放：放在 hero 背景上

把框放在 `.bg-dots` / `.bg-paper` 的 hero 区，让截图「悬浮」在有氛围的底上，而不是飘在纯白里：

```html
<section class="slide center">
  <div class="bg-dots bg-fade" style="position:absolute;inset:0;z-index:0"></div>
  <div class="grid-2" style="position:relative;z-index:1;align-items:center">
    <div class="stack">…文案…</div>
    <div class="frame frame--browser frame--shadow"><img src="images/01-shot.png" alt="…"></div>
  </div>
</section>
```
`.bg-fade` 让背景向下淡出，不与下方文字打架。背景只铺 hero 页，不要整本都铺。

## 没图时：诚实占位（绝不造假 UI）

图还没到位时，用 `.frame__placeholder`，**永远不要画一个假界面冒充真截图**：

```html
<div class="frame frame--browser frame--shadow">
  <div class="frame__placeholder">images/01-dashboard.png · 1600px 宽</div>
</div>
```
占位文字写清**期望的文件名和尺寸**，方便后补。

## 图片资产规范

- **命名**：`images/NN-语义.ext`（如 `images/03-deploy-log.png`），编号便于排序、语义便于检索。
- **尺寸**：长边 **≥ 1600px**（截图框在 1280 舞台上 ~2x 渲染，render.sh 又 ×2，太小会糊）。
- **格式**：照片/真实截图用 **JPG**（体积小）；需要透明背景的 UI / 图标用 **PNG**。
- **总量**：整个 deck 的 `images/` 控制在 **< 10MB**（放映/打印才不卡）。
- **覆盖最稳**：迭代时**同名覆盖**（`images/03-deploy-log.png` 反复替换），HTML 引用不用改，最不易出错。
- HTML 里给 `<img>` 显式 `width`/`height` 防布局抖动；首图可 `loading="eager"`，其余 `loading="lazy"`。

## 何时该重做截图

出现下面任一情况，别凑合——去 [image-prompts.md](image-prompts.md) 重拍/重绘：

- 截图风格与 deck 调性冲突（比如蓝色 SaaS UI 进了禁蓝的暖纸 deck）。
- 原图分辨率不够（< 1600px 长边）或带水印 / 测试数据 / 真实隐私信息。
- 需要的是**示意图 / 流程图 / 概念插画**，而不是真实界面——这类该按品牌调性生成，而不是网上找一张风格不搭的。
- 多张截图来自不同来源、风格各异——统一重做一套，比硬框更省事。
