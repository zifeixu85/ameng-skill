# 版式

一个 `data-layout` = 一种页面任务。先问这一页要让观众记住什么，再选版式。所有版式都在 12 栏网格上，主题改外观，不改 HTML 结构。样例都在 [templates/showcase.html](../templates/showcase.html) 和 [templates/catalog.html](../templates/catalog.html)，需要时从那里复制。

每页的 `<section>` 上写：

```html
<section class="slide" data-layout="chart" data-section="诊断" data-sample>
  …
  <aside class="notes">这一页的口播稿，写成能直接念出来的话。</aside>
</section>
```

## 选哪个版式

| 这页要做的事 | data-layout | 关键结构 |
|---|---|---|
| 开场定调 | `cover` | `.meta`（左右两段）· `h1.title` · `p.lead` |
| 告诉观众今天讲什么 | `agenda` | `.title` · `ol.agenda > li > .n + div > b + .d` |
| 换章节，让人喘口气 | `section` | `.sec-num` · `.title` · `.lead` |
| 一句话核心判断 | `statement` | `.title` · `.lead` |
| 一句有分量的原话 | `quote` | `blockquote.title` · `.by` |
| 一个数字说明一切 | `number` | `.hero`（可带 `<small>` 单位）· `.side > .title + .body + .source` |
| 三四个指标一起看 | `kpis` | `.title` · `.kpis > .kpi`（第一个可加 `.kpi--hot`）|
| 结论 + 一张图 | `chart` | `.title` · `.side > .point × 2 + .source` · `figure.chart`（加 `data-flip` 图放左）|
| 图大到要占满 | `chart-full` | `.title` · `figure.chart` |
| 两张图或两段并排 | `duo` | `.title` · `.col × 2 > h3 + 内容` |
| 以前 / 现在 | `versus` | `.title` · `.versus > .versus__side × 2` |
| 三四个并列要点 | `points` | `.title` · `.points > .point-col > .n + h3 + p` |
| 有先后的步骤 | `steps` | `.title` · `.steps > .step > .step__dot + h3 + p`（重点步加 `.is-hot`）|
| 时间线、路线图 | `timeline` | `.title` · `.timeline > .tl > .tl__when + h3 + p` |
| 循环、飞轮 | `cycle` | `.title` · `.ring > .ring__node × 3–6` |
| 一个核心连多方 | `cycle` | `.ring` 里再加 `.ring__core` |
| 两个维度分四类 | `matrix` | `.title` · `.matrix > .mx × 4 + .matrix__x + .matrix__y` |
| 层级、架构 | `layers` | `.title` · `.layers > .layer > b + span`（金字塔加 `data-pyramid`）|
| 逐项对比 | `table` | `.title` · `table.data` |
| 给几档选择 | `tiers` | `.title` · `.tiers > .tier`（推荐档加 `.is-hot`）|
| 图片是主角 | `image-full` | `.media > img` · `.caption-box` |
| 一图一事 | `image-split` | `.copy` · `.media > img` |
| 讲产品界面 | `shot` | `.copy > .title + .callout` · `.window > .window__bar + img` |
| 讲代码 | `code` | `.title` · `pre.code`（只放讲到的几行）|
| 收尾，给行动 | `closing` | `.title` · `.next` |

## 排版规矩

- 标题写结论，不写主题词：「卡点集中在交付之后」好过「卡点分析」。
- 中文标题按语义手动断行，用 `<br>`。不要让一个词被拆到两行，也不要让最后一行只剩一个字。
- 关键词用 `<em>`，一个标题里最多一处。
- 一页一个视觉主角。相邻两页换版式，同结构的系列页除外。
- 数字用 `.hero`、`.kpi__value` 时会自动从 0 滚上去。
- 不写 `<style>`，不写死颜色和字号。需要新形状时先看 [charts.md](charts.md) 和这张表，再组合现有结构。

## 页面的高度

现场前排人头会挡住屏幕下方。封面、章节、论点、金句、大数字、结尾都排在中间偏上，步骤和时间线也一样。主要文字不要低于 930px，只有出处、页码可以放在下面。版式已经排好，不要用 `margin-top`、`align-self:end` 把内容往下推，也不要把一句话单独放到页面底部。

## 字号范围

字号由主题统一管，不要手写。这些上限所有主题共用，`check.mjs` 超过就拦下；内容放不下时大标题和大数字会自动缩小。

| 用途 | 上限（舞台 px）| 在 PPT 里 |
|---|---|---|
| 大数字 `.hero` | 288 | 144pt |
| 章节编号 `.sec-num` | 200 | 100pt |
| 封面、结尾标题 | 136 | 68pt |
| 论点页、章节标题 | 96 | 48pt |
| 金句 | 84 | 42pt |
| 指标数字 | 112 | 56pt |
| 页面标题 | 68 | 34pt |
| 正文 | 34 | 17pt |
| 最小字 | 21 | 10.5pt |

## 字数

一页不超过约 170 字。讲不完的放进 `.notes`，上屏的是提炼。连续两页都很满之后，下一页要轻。

## 图片

1. 拷进 deck 的 `images/`，用相对路径，写 `alt`。
2. 先用 Read 看图：比例、主体在哪、是照片还是信息图。
3. 照片可以裁（`image-full`、`image-split` 默认 cover，用 `style="object-position:50% 30%"` 对准主体）。信息图、表格、全屏界面不能裁，放进 `shot` 的 `.window`，或换一个比例合适的版式。
4. 长边小于 1600px 的图不要放进满版位。图上压字一定要用 `.caption-box`。
5. 没有图就不放图，不画假截图。
6. 讲产品时优先放动的：录屏放进 `.window`（写法见 `motion.md`）。截图和录屏里的品牌名、账号、客户名、人名、真实数据要先打码。
