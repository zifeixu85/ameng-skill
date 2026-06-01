# design-direction.md — deck 的设计锚点（先声明，再开工）

> 这是整套 deck 的**唯一设计真相**。`ameng-ppt-design` 在动手前会读这份文件；
> 如果项目里没有它，请作者**先把下面的模板填完**再搭页。每一份 deck 都必须有一个
> *被明确声明过*的方向——不是「看着办」，不是默认模板。
>
> 结构移植自 工业纸感基线 的 `设计基线`。把它当 fill-in 模板：复制到
> `decks/<name>/design-direction.md`，按本 deck 改字段，方括号是你要替换的部分。

---

## Project（这份 deck 是什么）

**[一句话：谁、在什么场合、讲什么]**
- 比如：「A梦 在 DeepSea 直播分享《从 Demo 到产品》的配套 16:9 deck」
- 列出关键素材：大纲 / 讲稿 / 已有截图 / 真实数据出处。

---

## Users（讲给谁听）

**[一句话画出听众]**——他们的水位、耐心、审美。
- 例：独立开发者 / AI-native builder：**见过所有模板**，一眼闻得出 AI 味，没耐心读废话。
- 关键含义：这份 deck 必须和「又一个模板」产生**一眼可见的差距**。

---

## Brand Personality（人格）

三个词（默认）：**有主张的 · 已上线的 · 工业质感的**（opinionated / shipped / industrial）

**不是**：友好、活泼、欢快、技术炫技。
**感觉**：像读一篇印在好纸上的技术随笔——自信、安静、精确。

> 想换人格就在这里改三个词，下面所有视觉决策都要服从它。

---

## Register（brand vs product —— 为什么我们能用大字）

impeccable 把界面分两种 register，决定了规则怎么读：

- **brand register**：**design IS the product**——着陆页 / 品牌页 / 演示。允许大字、强 accent、per-section art-direction（每段不同视觉世界）、首屏编排进场。
- **product register**：**design SERVES**——app / 后台 / 表单。克制、一致优先、固定字阶、accent 只用于操作与状态。

**演示 deck 默认是 brand register。** 这是我们能正当用 110px+ 巨标题、暖纸底、强 accent、分段色域的**理论依据**。
因此 impeccable 里那些 **product 视角的通用 web 规则**（`oversized-h1`「长标题别放 display 尺寸」、`cream-palette`「禁奶油底」、固定 rem 字阶、accent 仅操作色）**不直接套用到我们的 hero 页**——它们是 product 的floor，不是 brand 的天花板。
但 register 不是免罪符：brand 的 bar 是**「让人问『这怎么做的』，而不是『哪个 AI 做的』」**（impeccable brand slop test）。大字要承载一句话核心，不是为大而大。

## Aesthetic Direction（美学方向）

**主方向（默认）：Bento 网格 + 暖纸感工业风**。多区块拼接构图，每个 cell 尺寸/权重/内容类型都不同——**没有重复的 3 卡行**，**没有图标-标题-正文模板网格**。

**可选其它方向**（在 [layouts.md](layouts.md) 里都有对应版式）：编辑/杂志 · 瑞士国际主义 · 深色技术分享 · 轻奢竖屏。

---

## Theme（主题）

**默认 Light**（`industrial-paper`，暖奶白纸感底）。
原因：演示/桌面工具在亮环境用；深色 Bento 容易滑向 AI 霓虹套路，亮色更像编辑排版。
**不默认深色**——深色是一种选择（`dark-luxe`），不是省事的退路。
主题清单见 [themes.md](themes.md)。

---

## Anti-References（明确要避开）

- 烂大街蓝色 SaaS 模板
- Vercel / Linear 克隆版深色 + 渐变光球
- AI 套路配色：深背景 + 青 + 紫蓝渐变
- 玻璃拟态的装饰性用法
- 图标-圆角卡片-阴影三件套（清一色卡片网格）
- 标题下面那条装饰性短横线

---

## Color（配色，单一强调色 60-30-10）

- **默认禁蓝**（含淡蓝、靛蓝、青蓝任何变体）。唯一例外：`swiss-intl` 汇报主题用克制蓝，**永不做旗舰默认**。
- **单一强调色**，按 **60-30-10** 稀用（60% 中性底 / 30% 次级 / 10% 强调）。
- 旗舰候选（实现时选一个并坚持到底，base.css 已备好可换的 `--pal-*`）：
  - `ember` 赤陶（偏暖强红橙，旗舰默认） · `cinnabar` 朱砂 · `olive` 苔绿
- 中性色**略带品牌色调**（OKLCH chroma 0.005–0.01 的 warm tint）。
- **禁纯黑、纯白**——用带色相倾向的近黑近白。
- 一律 `oklch()` 定义，**不写 hex / hsl**。
- **「Unnamed ambition becomes beige」**（impeccable `brand.md` 硬规则）：暖底 / 配色**必须 name a real reference**——具体的印刷 / 设计 / 物件参考（如「某印厂的牛皮纸内页」「某技术手册的油墨暖灰」），不是「看着暖一点」。没命名的暖底就是反射式之选，会滑成 AI 奶油色。
  → 本 deck 若用 `industrial-paper` 暖底，**在这里写明它的参考来源**（具体某本书 / 某张纸 / 某个印刷品），而不是只写「暖纸感」。

---

## Typography（字体，含封禁清单）

**封禁列表（逐字照搬，坚决不用）**：
Inter, Roboto, Arial, Open Sans, DM Sans, DM Serif, Plus Jakarta Sans, Outfit,
IBM Plex 全家族, Space Mono, Space Grotesk, Instrument Sans, Instrument Serif,
Fraunces, Newsreader, Lora, Crimson 全家族, Playfair Display, Cormorant 全家族, Syne。

**选定（本 skill 自托管，离线）**：
- Display = **Bricolage Grotesque**（+ CJK 衬线 Source Han Serif）
- Body = **Host Grotesk**（+ CJK 黑体 PingFang / Source Han Sans）
- Mono = **JetBrains Mono**（CLI / 版本号 / 元数据）

字号规则：heading 用 `clamp()` 流体，5 档以上对比（比例 ≥ 1.25）；正文不超过 ~62ch。

---

## Composition（构图）

- 首屏不是居中标题 + CTA，而是**偏置主 cell + 旁边对话性副 cell**（封面默认左文右 terminal）。
- 至少 **3 种 cell 宽度**、**2 种 cell 高度**（bento 用 `col-2/3/4` + `row-2`）。
- 允许一个 cell 当**视觉主角**（大字 / `card--accent` 实色块 / Data Hero），其余克制。
- 辨识度来自**统一圆角 + 统一描边 + 差异化填充**，不是全圆角。
- 允许破格：跨列 quote cell、半透底 code cell。

---

## Motion（动效）

- 首屏一次**编排过的进场**（`anim-stagger` / `data-anim`），之后克制。
- 只动 `transform` 和 `opacity`（外加 `clip-path` / `filter` 的 wipe/blur 入场）。
- 缓动 ease-out-expo（`--ease`），不用 bounce / elastic。
- 尊重 `prefers-reduced-motion`（base.css 与 fx 已内置降级）。

---

## Design Principles（每个决策都要过这五条）

1. **说清楚 > 好看**：每段先回答听众疑问，不做装饰性标题。
2. **首屏只说一件事**：主标题一句话讲清，CTA 具体（不写「Get Started」）。
3. **视觉分层，不是视觉热闹**：一个区域只有一个视觉主角。
4. **结构即说服顺序**：页/cell 的顺序 = 论证顺序（看懂 → 相关 → 信任 → 行动）。
5. **不默认模板**：每一页是刻意构图，不是掉进去的卡片。

---

## Responsive

- **Primary**：演讲大屏（投屏），1280×720 固定舞台，runtime 自动 fit 缩放到任意窗口。
- 9:16 竖屏（720×1280）是**独立比例**，不是缩小版桌面：每屏只讲一件事，字号往大推、留白往狠给。

---

## Accessibility

- WCAG AA 对比度底线（强调色与底色、`card--accent` 上的文字都要够）。
- 尊重 reduced-motion。
- 语义标签优先（`<section class="slide">` / `<blockquote>`），不堆 `<div>`。
- 键盘可达：runtime.js 提供 ← → / F / S / O / T 全键盘放映。
