# 动效

默认已经有动效：翻到一页时，标题、要点、图表按主题的节奏依次出现，不用写任何东西。下面这些是需要时才加的。

## 页面里的循环动效

网页版的重点。入场结束后页面继续有节奏地动，自动生效，不用写：

| 内容 | 循环方式 |
|---|---|
| 循环图 `.ring` | 光点沿环走，走到哪个节点哪个节点轻轻放大，连线流动 |
| 中心辐射 | 信号从中心沿连线发到各节点 |
| 步骤 `.steps`、时间线 `.timeline` | 光点沿主线走，依次点亮每一站 |
| 高亮项 `.is-hot`、`.kpi--hot` | 周期性向外扩一圈 |
| 折线和指标卡的小趋势 | 末端数据点呼吸 |
| 桑基图 | 色带里有流动的光 |

手绘 SVG 想动起来：给线加 `class="flow"`（虚线流动）。关掉：`<section data-loop="off">`，或写在 `.deck` 上。循环不进 PPTX，也不写进文件；编辑时自动停，系统开启「减少动态效果」时不运行。

## 动态截图

讲产品时优先用动的：把录屏放进 `.window`。

```html
<div class="window"><div class="window__bar"><i></i><i></i><i></i></div>
  <video src="images/demo.mp4" autoplay loop muted playsinline></video></div>
```

GIF 直接用 `<img>`。录屏里的品牌名、账号、客户名、人名、真实数据要先打码。导出 PPTX 时视频变成当前这一帧。

## 分步显示（点一下出一步）

```html
<div class="step" data-step="1">…</div>
<div class="step" data-step="2">…</div>
```

→ / 空格先走完本页的步骤再翻页，← 会退回。导出 PPTX 时变成 PowerPoint 的点击动画（淡入）。

第一屏要能讲：先显示主体，只把后几项做成分步。整页主体都藏起来，翻到这页时就是一片空白，`check.mjs` 会提醒。

## 单个元素的入场方式

`data-in="fade|rise|left|right|pop|zoom|blur|wipe|drop|lines|none"`。`lines` 是逐行从遮罩里升起，适合大标题。

## 跨页变形

两页里同一个元素写同一个 key，翻页时它会平滑移动、变大变小：

```html
<div class="hero" data-morph="price">…</div>
```

导出 PPTX 时用 PowerPoint 的「平滑」切换，对象按 `!!price` 配对。

## 翻页方式

`<section data-transition="fade|push|zoom|none">`，或写在 `.deck` 上作为默认。

## 背景动效

主题自带：夜幕的日出光（WebGL）、纸墨的晕墨、规格的旋转刻度盘、色块的几何形跨页移动。放映时才动，导出时定格。

## 什么时候少用

- 汇报和客户决策页：内容先于动效，用 `board` 主题或 `data-motion="off"`。
- 一页里只有一个主角在动。不给每个元素都加特效。
- 系统开启「减少动态效果」时，所有动效自动停掉。

## 网页阅读模式

按 `W`，整份变成可以滚动的网页，内容滚到才播放入场。适合发链接让人自己看。
