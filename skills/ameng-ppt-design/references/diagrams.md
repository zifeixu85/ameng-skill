# diagrams.md — turn "walls of text" into pictures

> A fixed 1280×720 stage never shrinks text. Pure-text slides read as dense and
> are hard to see from the back row. Rule of thumb: **if a slide is a list, ask
> whether it's secretly a picture** — a flow, a comparison, a growing scope, a
> hub-and-spoke. One graphic per slide, then verify with `scripts/render.sh`.
> All primitives below are in `assets/components.css` (token-driven, no hex, 禁蓝-safe).

> 目录：内容形状 → 图形 · When to reach for which · Flow / Funnel / Matrix / Gauge / Layers · Stepper · Expanding scope · Two-zone split · Inline SVG — keep colors as tokens · Motion that survives export · Safe-area discipline

## 内容形状 → 图形（每页搭建前必答的一道题）

**写每一页之前先问：这页内容的"形状"是什么？** 按形状选图形，**不许把流程/对比/层级
退化成一排扁卡片 + 小箭头**（那是 AI deck 最常见的偷懒），更不许自造 div 拼装——
组件全在 `components.css`，模板 `layouts-gallery.html` 每个都有可拷的实例页。

| 内容的形状 | 图形 | 组件 |
|---|---|---|
| 顺序 / 流程 / 管线（3–5 节点） | **流程图** | `.flow`（横）/ `.flow--v`（纵），落点 `.fn--on` |
| 步骤 / 阶段 / 生命周期（4–6 步） | **步骤器** | `.evo`，关键步 `.ev--on` |
| 转化 / 筛选 / 漏损 | **漏斗** | `.funnel`，`--w` 按真实数值映射 |
| 定位 / 取舍（两个维度） | **2×2 矩阵** | `.matrix2`，落点象限 `.mq--on` |
| 进度 / 完成度（一个 %） | **仪表盘** | `.gauge`（半环，`--v:0–100`） |
| 体系 / 架构 / 沉淀层级 | **分层图** | `.layers`，`--w` 上窄下宽，承重层 `.ly--on` |
| 对比有明确赢家 | **两区对比** | `.zones`（落点 `.z--r`）/ `.contrast` |
| 排名 / 量级（2–5 个值） | **条形图** | `.bars`，`.fx-grow-x` 长出来 |
| 占比（一个比例） | **环形图** | `.donut` + `.fx-pop` |
| 趋势（随时间变化） | **折线图** | `.linechart` 内联 SVG + `.fx-dash` |
| 一个英雄数字 | **Data Hero** | `.data-hero` + `.fx-pop` |
| 范围扩张 | **扩张条** | `.scope` |

### ⚖️ 两类图分治（关键：什么图需要真数，什么图鼓励多用）

上表分成性质完全不同的两类，纪律也不同：

**① 数据图（需真实可溯源数字）** —— `bars` / `donut` / `funnel` / `gauge` / `linechart` / `data-hero` / `scope`
里面的**数字必须真实**（条形百分比、漏斗各层数值、仪表 %、折线点位）。**没有真实数据就不画这一类**——
不许编数字、不许造假图表（反幻觉红线，不松）。无数可画时退回文字版式或换成下面的概念图。

**② 概念 / 结构图（不需要任何数字，鼓励放手用）** —— `flow` / `evo` / `matrix2` / `layers` / `zones` / `contrast` / 关系 SVG / 双钻
它们画的是**逻辑、顺序、结构、取舍、关系**，不是数量。**没有数据≠只能上文字**——
一段「录音→处理→入库」的流程、一个「里外两套」的结构、一组「过去 vs 现在」的对比，
用概念图比堆文字**更有张力、更好懂、更经得起后排看**。**鼓励对没有数据的内容也画概念图**来增强表达力。

> 一句话：**数据图守真实，概念图放开画。** 别再被「没数据→只能文字」误导——那条只管数据图。

**变化纪律**：相邻两页不用同一种图形；全 deck「纯文字卡片行」页 ≤ 1/3——
连排第三页还是卡片网格，就必须把其中一页改成上表里的图。
**动效纪律**：每个图表都挂入场 fx（条→`.fx-grow-x`、数字/环/表→`.fx-pop`、
SVG 线→`.fx-dash`、行列→父级 `.anim-stagger`）——图表不许静止地"躺"在页上。

## When to reach for which（速查全表）

| If the content is… | Use | Class / shape |
|---|---|---|
| an ordered pipeline (3–5 nodes) | flow diagram | `.flow` / `.flow--v` (key node `.fn--on`) |
| conversion / filtering | funnel | `.funnel` + `.fu` (real `--w:%`, 落点 `.fu--on`) |
| 2-axis positioning | 2×2 matrix | `.matrix2` (quadrants `.mq`, 落点 `.mq--on`) |
| progress toward a goal | gauge dial | `.gauge` (set `--v:0–100`) |
| system / hierarchy strata | layer stack | `.layers` + `.ly` (`--w` narrows upward) |
| ranked values (2–5) | horizontal bars | `.bars` + `.bar` (fill `--v:%`, add `.fx-grow-x`) |
| a single percentage / ratio | donut ring | `.donut` (set `--v:0–100`, add `.fx-pop`) |
| a trend over time | line chart | `.linechart` inline `<svg>` (points from real data) |
| one hero number | big KPI | `.data-hero` (`.data-hero__num.fx-pop`) |
| an ordered process (3–6 steps) | horizontal stepper | `.evo` + `.ev` (mark key node `.ev--on`) |
| a boundary / scope that grows | expanding bars | `.scope` + `.sc` (set inline `width:%`) |
| A-vs-B with a clear winner | two-zone split | `.zones` (落点 side = `.z--r` accent) |
| A↔B pairs, must read far | big contrast table | `.contrast` + `.cr` |
| tools / products | faux-browser cards | `.prod` (no fake screenshot) |
| a method/relationship | inline `<svg>` | see snippets below |
| an example under a label | example chip | `.ex` → `<span class="ex"><b>例</b> Foo</span>` |
| stage order in a card grid | corner badge | `.nbadge` (1/2/3/4) |
| a person / contact | round avatar + QR | `.avatar-ring`, `.qr` (crop QR to its matrix first) |

### Donut ring (single percentage) — pure CSS, real data only
```html
<div class="donut-row">
  <div class="donut fx-pop" style="--v:73"><span class="donut__val">73<span class="unit">%</span></span></div>
  <div><p class="h3">完成率</p><p class="body muted">来源：…（真实出处）</p></div>
</div>
```
`--v` = 0–100. Ring color = `--accent`, track = `--surface-2`. `.fx-pop` scales it in.

### Line chart (trend) — inline `<svg>`, points authored from real numbers
```html
<svg class="linechart" viewBox="0 0 320 150" preserveAspectRatio="none" role="img" aria-label="…趋势">
  <line class="lc-grid" x1="8" y1="130" x2="312" y2="130"/>
  <polygon class="lc-area" points="12,30 112,70 212,102 308,124 308,130 12,130"/>  <!-- area: line pts + 2 baseline pts -->
  <polyline class="lc-line" points="12,30 112,70 212,102 308,124"/>                 <!-- the trend line -->
  <circle class="lc-dot" cx="308" cy="124" r="4.5"/>                                 <!-- last point -->
</svg>
```
Map each real value to `y` (smaller `y` = higher). No real series → don't draw it.

## Flow / Funnel / Matrix / Gauge / Layers（新图形，gallery 6b–6f 页可直接拷）

```html
<!-- 流程图：真箭头 + 唯一落点。竖排：.flow--v -->
<div class="flow anim-stagger">
  <div class="fn"><div class="fn__t">输入</div><div class="fn__d">原始素材</div></div>
  <div class="fa"></div>
  <div class="fn fn--on"><div class="fn__t">知识库</div><div class="fn__d">落点</div></div>
  <div class="fa"></div>
  <div class="fn"><div class="fn__t">产出</div></div>
</div>

<!-- 漏斗：左对齐(无 margin-inline:auto，左边与标题齐)。--w=value/max 绝对占比。
     bar(.fu__bar) 里放 label+value；转化率 .fu__r 放 bar 外侧右边(对上一步:7200/10000=72%)。 -->
<div class="funnel anim-stagger" style="max-width:60rem">
  <div class="fu" style="--w:100%"><div class="fu__bar"><span class="fu__t">曝光</span><span class="fu__v">10,000</span></div></div>
  <div class="fu" style="--w:72%"><div class="fu__bar"><span class="fu__t">点击</span><span class="fu__v">7,200</span></div><span class="fu__r">72%</span></div>
  <div class="fu fu--on" style="--w:16%"><div class="fu__bar"><span class="fu__t">成交</span><span class="fu__v">1,600</span></div><span class="fu__r">42%</span></div>
</div>

<!-- 2×2 矩阵：markup 顺序 = 左上/右上/左下/右下；包一层 .slide__safe 防溢出 -->
<div class="matrix2 fill" data-anim="rise">
  <div class="mx-y">价值</div>
  <div class="mq">…</div><div class="mq mq--on">…落点…</div>
  <div class="mq">…</div><div class="mq">…</div>
  <div class="mx-x">实现难度 →</div>
</div>

<!-- 仪表盘（半环，进度感）；占比感用 .donut -->
<div class="gauge fx-pop" style="--v:68"><div class="gauge__val">68<span class="unit">%</span></div></div>
<div class="gauge__cap">迁移进度 · 出处</div>

<!-- 分层图：--w 上窄下宽；承重层 .ly--on -->
<div class="layers anim-stagger" style="max-width:46rem;margin-inline:auto">
  <div class="ly" style="--w:46%"><span class="ly__t">产出层</span></div>
  <div class="ly ly--on" style="--w:68%"><span class="ly__t">知识库层</span><span class="ly__d">落点</span></div>
  <div class="ly" style="--w:100%"><span class="ly__t">原始素材层</span></div>
</div>
```

落点节点（`.fn--on/.fu--on/.mq--on/.ly--on`）内文字自动翻 `--accent-ink`，
**别再手动设色**。数据型图（funnel/gauge/donut/bars/linechart）只画真实数据。

## Stepper (process line)

```html
<div class="evo fill anim-stagger">
  <div class="ev"><span class="ev__dot">1</span><div class="ev__v">生成</div><div class="ev__d">让 AI 画出来</div></div>
  <div class="ev"><span class="ev__dot">2</span><div class="ev__v">控制</div><div class="ev__d">稳定、批量、可控</div></div>
  <div class="ev ev--on"><span class="ev__dot">3</span><div class="ev__v">协作</div><div class="ev__d">参与设计过程</div></div>
</div>
```

## Expanding scope (boundary widening)

```html
<div class="scope fill anim-stagger">
  <div class="sc" style="width:40%"><span class="sc__t">界面</span><span class="sc__d">· 按钮 · 排版</span></div>
  <div class="sc" style="width:70%"><span class="sc__t">流程</span><span class="sc__d">· 路径 · 异常</span></div>
  <div class="sc sc--on" style="width:100%"><span class="sc__t">系统</span><span class="sc__d">· 冷启动 · 交付</span></div>
</div>
```

## Two-zone split (A vs B)

```html
<div class="zones fill">
  <div class="z z--l"><div class="z__ic">A · 可自动化</div><div class="z__h">存量问题</div>
    <div class="z__list"><span>规范</span><span>清单</span></div></div>
  <div class="z z--r"><div class="z__ic">B · 靠判断</div><div class="z__h">增量问题</div>
    <div class="z__list"><span>用户是谁</span><span>哪个假设先验证</span></div></div>
</div>
```

## Inline SVG — keep colors as tokens

Inline `<svg>` inherits CSS custom props, so use `fill="var(--accent)"`,
`stroke="var(--line-strong)"`, `fill="var(--ink-1)"`. Give it `role="img"` +
`aria-label`. Size with `style="width:100%;max-width:980px;height:auto"`.

### Double-diamond (Design Council 双钻)

```html
<svg viewBox="0 0 920 300" style="width:100%;max-width:980px;height:auto"
     role="img" aria-label="双钻：理解问题 定义问题 探索方案 验证方案">
  <polygon points="20,150 230,40 440,150 230,260" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width="2"/>
  <polygon points="440,150 650,40 880,150 650,260" fill="var(--accent)" fill-opacity="0.16" stroke="var(--accent)" stroke-width="2"/>
  <circle cx="440" cy="150" r="7" fill="var(--accent)"/><circle cx="880" cy="150" r="7" fill="var(--accent)"/>
  <text x="230" y="22" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">理解问题</text>
  <text x="440" y="292" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">定义问题</text>
  <text x="650" y="22" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">探索方案</text>
  <text x="880" y="292" text-anchor="middle" font-size="22" font-weight="700" fill="var(--accent)">验证方案</text>
</svg>
```

### Hub-and-spoke (you orchestrating agents)

```html
<svg viewBox="0 0 360 300" style="width:100%;max-width:360px;height:auto"
     role="img" aria-label="设计师在中心编排多个 Agent">
  <line x1="180" y1="150" x2="72" y2="58" stroke="var(--line-strong)" stroke-width="2"/>
  <!-- ...more spokes... -->
  <circle cx="72" cy="58" r="34" fill="var(--surface-1)" stroke="var(--line-strong)" stroke-width="2"/>
  <text x="72" y="64" text-anchor="middle" font-size="16" fill="var(--ink-2)">研究</text>
  <circle cx="180" cy="150" r="48" fill="var(--accent)"/>
  <text x="180" y="146" text-anchor="middle" font-size="19" font-weight="700" fill="var(--accent-ink)">你</text>
</svg>
```

## Motion that survives export (bars/rings that "draw themselves")

Animated charts are great on screen but a trap for export: the in-browser ⤓ export
activates each slide then snapshots ~2 frames later — far short of a 0.7s bar grow —
so a naive chart exports **blank or half-drawn**. (`render.sh` dodges this via a virtual
time budget; the browser export has none.) Two rules make motion export-safe:

1. **Use the built-in entrance primitives**, not hand-rolled keyframes:
   `.fx-grow-x` (horizontal bars · on `.bar__fill`, width via `--v`),
   `.fx-grow-y` (vertical bars), `.fx-pop` (big numbers / rings / nodes),
   `.fx-breathe` (idle pulse), `.fx-dash` (SVG flow line). They fire only on `.slide.is-active`.
2. **If you must hand-roll a keyframe, author it with `both` fill** and base the element's
   resting style on the END frame (e.g. bar height = full, keyframe animates *from* `scaleY(.06)`).

Why `both` matters: base.css finalizes motion for both `prefers-reduced-motion` **and**
`.deck.ppt-exporting` by collapsing `animation-duration` to ~0. With `both`/`forwards` fill the
element then holds its **end** frame instantly (full bar), so every snapshot is settled.
`animation: none` would instead revert to the *from* state (collapsed) — don't use it for entrances.

Belt-and-suspenders: `export.js` also calls `document.getAnimations().finish()` on each slide right
before snapshot (infinite loops get `.pause()` instead). modern-screenshot inlines
`getComputedStyle(node)` — incl. `transform` — onto the clone, so a *finished* animation means the
exported image gets the settled transform regardless of CSS-timing or a stale cached stylesheet.
If you ever see a chart export half-drawn, first **hard-refresh** so the latest `export.js`/`toolbar.css` load.

```html
<div class="bars">
  <div class="life-col"><div class="fx-grow-y" style="height:28%"></div><span>问题定义</span></div>
  <div class="life-col"><div class="fx-grow-y" style="height:100%"></div><span>界面生成</span></div>
</div>
```

## Safe-area discipline (why slides overflow)

`.deck--chrome .slide` content must live in roughly **y ∈ [85, 636]** of the 720 stage
(top bar + footer eat the rest). The stage does **not** auto-shrink text, so a nested
grid of tall cards spills both up (over the title) and down (under the footer),
especially with `align-items:center`. Checklist:

- one core idea + one graphic per slide; lists ≤ 4 rows, card body ≤ 2 lines
- prefer a graphic primitive over a 6-item bullet list
- after building, run `scripts/render.sh deck.html` and look at **every** PNG
- numeric gate (optional): in devtools, the bbox of every non-`.notes` element
  should sit within `[76, 644]`; anything outside is an overflow to fix
