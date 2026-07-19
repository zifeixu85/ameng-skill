# layouts.md — 版式词汇表

> 四份模板已演示**每一种**版式：`deck-16x9.html`（旗舰，全套）· `layouts-gallery.html`
> （每页一种版式，左下角标版式名，当目录查最方便）· `deck-swiss.html`（瑞士）。
> **做法永远是：从最接近的 `.slide` 块复制，替换内容——不要从零手写。**
> 每个 slide 是 `<section class="slide">`（居中页加 `center`），讲者备注放 `<div class="notes">`。

> 目录：**内容→整页版式决策表 + data-layout 词汇 + 多样性铁律** · 编辑式 chrome · 密度三档与每页内容预算 · 16:9 版式目录 · 瑞士数据版式 · 辅助 class · 动效 · 分段色域 `data-accent` · opt-in canvas 背景 `data-fx` · 导航 / 演示键

---

## 内容 → 整页版式 决策表（每页搭建前先定 `data-layout`）

> 这是治「默认做出来千篇一律套模板」的核心纪律。`diagrams.md` 那张表是**图形级**（内容区里放什么图）；
> 这张是**整页级**（整页长成什么构图）。**每页 `<section class="slide">` 必须标 `data-layout="…"`**，
> 取下表词汇之一——`validate.mjs` 的多样性闸门按它判，**不标 = 闸门看不见 = 整本会悄悄漂回一种版式**。

**先问这一页要干什么 → 选对应版式 → 标 `data-layout`：**

| 这一页要干什么 | 整页版式 | `data-layout` | 关键 class |
|---|---|---|---|
| 开场定调 | 封面 | `cover` | `.center`+`.grid-2`+`.zh-mega`（副 cell 按主题：技术→`.terminal`，非技术→大数/金句/配图） |
| 单一核心论点（居中大字） | 大陈述 | `big-statement` | `.center`+`.h1.measure`+`.hl` |
| 单一论点（偏置陈述） | **非对称双栏** | `asym-split` | `.asym`（窄 `.asym__rail`+宽 `.asym__main`，1px hairline）|
| 章节呼吸 / 转场 | 分节色块 | `section-divider` | `.slide--on-accent`+`background:var(--accent-block)` |
| 一个关键数字 | Data Hero | `data-hero` | `.data-hero`（真实数据+出处） |
| 排名 / 量级（2–5 值） | 条形图 | `bars` | `.bars`+`.bar__fill[--v]`（真实%） |
| 转化 / 漏损 | 漏斗 | `funnel` | `.funnel`（`--w`=真实比例） |
| 顺序 / 流程（3–5 节点） | 流程图 | `flow` | `.flow`/`.flow--v`，落点 `.fn--on` |
| 步骤 / 阶段（4–6 步，无日期） | 步骤器 | `stepper` | `.evo`，关键步 `.ev--on` |
| 演进 / 路线（带年份/里程碑） | **时间轴** | `timeline` | `.timeline`+`.timeline__axis`+`.tl`（落点 `.tl--on`） |
| 定位 / 取舍（两维度） | 2×2 矩阵 | `matrix` | `.matrix2`，落点象限 `.mq--on` |
| 体系 / 架构 / 层级 | 分层图 | `layers` | `.layers`，承重层 `.ly--on` |
| 进度 / 占比（一个 %） | 仪表 / 环 | `gauge` | `.gauge` 半环 / `.donut` 整环 |
| A vs B 有赢家 | 对比 | `comparison` | `.grid-2`，落点侧 `.card--accent` 或 `.zones` |
| 两个并列的面（**无赢家**） | **中性双栏** | `two-col` | `.two-col`（加 `.two-col--rule` 给 1px 竖线） |
| 引言 / 口号 | 金句 | `quote` | `.quote.measure`+`.quote__by` |
| 产品 / UI 展示 | 截图框 | `screenshot` | `.frame.frame--browser.frame--shadow` |
| 代码 / 已上线证据（**仅技术主题**） | 终端证据 | `terminal` | `.terminal`（英文 CLI；非技术主题别用，换大数/金句/指标卡） |
| 一张图占满版面 | **满版图 Hero** | `image-hero` | `.imghero`+`.imghero__scrim`+`.imghero__cap`（叠字落安全区） |
| 多图并置 | **定高图网格** | `image-grid` | `.imggrid`（`--cols`/`--cell-h` 锁高，`.cell--wide` 跨列） |
| 分点 / 维度（≤4，**确实无更强形状**） | 编号卡 | `numbered-cards` | `.grid-3`+`.card.card--num` |
| 一主多副、破网格 | 便当 | `bento` | `.bento`+`.col-*`+`.row-2`，落点格 `.card--accent` |
| 行动召唤 | 收尾 CTA | `close` | `.center`+`.h1`+具体下一步 |

### ⚖️ 多样性铁律（闸门会逐条查，违反就 WARN——别带着 WARN 交付）

1. **每页必标 `data-layout`**——不标，闸门看不见，整本会漂回一种版式。
2. **相邻页尽量换版式，但同结构系列页可重复**——连排 ≤2 页同版式很正常（一组同型产品、并列对比、「概念→例子」节奏，**保持同排版本就是有意的一致**）。闸门只在**连续 ≥3 页同版式**时轻提醒，且是可忽略的 WARN：是不是有意的系列页，你自己判。**真正要防的是**：把**不同形状**的内容硬塞进同一种偷懒版式（见第 4、5 条）。
3. **全 deck 版式种类**：≥10 页要 **≥6 种**；7–9 页 ≥5 种；4–6 页 ≥3 种。
4. **卡片网格（`numbered-cards`/`bento`/`grid`）合计 ≤ 全 deck 1/3**——它们是 AI deck 的偷懒默认。
5. **卡片网格是兜底，不是默认**：每页先问「是不是流程/对比/层级/趋势/数字/演进/并列」，
   是 → 用上表对应版式（`flow`/`comparison`/`layers`/`bars`/`data-hero`/`timeline`/`two-col`…）；
   只有**真的只是几个并列要点、且无更强形状**时才落 `numbered-cards`。

> 词汇是封闭集：用上表里的值。要新增版式 → 先加进 `components.css` + 本表 + `validate.mjs` 的 `LAYOUT_VOCAB`，
> 否则闸门会以 ADVISORY 提示「不在词汇表」。

---

## 编辑式 chrome（持久框架，旗舰默认）

放在 `.deck__stage` 内、`.slide` 外，整本 deck 共享一套。开 `.deck--chrome` 后 slide 自动避让顶/脚栏。

```html
<div class="deck deck--chrome" data-grain>  <!-- T 键在该主题浅/深间切换；不写 data-themes -->
  <div class="deck__stage">
    <div class="chrome-top">
      <span class="chrome-top__brand">从 DEMO 到产品 · <b>BRAND</b></span>
      <span class="chrome-top__meta">
        <span class="chrome-top__sec">开场 · OPEN</span>
        <span class="chrome-top__page">01 / 10</span><span>T 切主题</span>
      </span>
    </div>
    <div class="chrome-foot"><span><b>SPEAKER</b> …</span><span class="mono">2026.05.30</span></div>
    <!-- .slide 们放这里 -->
  </div>
</div>
```
runtime 自动填 `.chrome-top__page`（页码）和 `.chrome-top__sec`（取当前页 `data-section`）。

## 密度三档与每页内容预算（写内容前先定档，别先写满再修溢出）

每页先定密度档，**全页上屏文字（含标题/标签/数字）不超该档预算**；装不下的细节进
讲者备注 `<div class="notes">`——内容是提炼，不是搬运。

| 档 | 版式 | 全页字数预算（CJK） | 结构上限 |
|---|---|---|---|
| **轻** | big-statement · quote · section-divider · cover | **≤40 字** | 1 句话 + 1 署名/副题 |
| **中** | numbered-cards(3卡) · comparison · data-hero · screenshot · two-zone | **≤120 字** | 3 块；每块 h3 ≤1 行、body ≤2 行 |
| **重** | bento · grid-3/4 · contrast · honest-bars · 列表 | **≤180 字** | ≤4 卡；列表 ≤5 条、每条 ≤1 行 |

**节奏铁律**：**连续重密度页 ≤2**，重后必接轻/中（呼吸感来自密度起伏，不是匀速灌）；
全 deck 轻:中:重 大致 1:2:1，hero（轻）开场收尾。预算超了**先删/拆页**，缩字号是最后手段
（修复优先级见 SKILL.md Step 5：删内容 > 拆页 > `.slide__safe` > `.fit-text`）。

**垂直配重铁律（下半页死白 ≠ 留白，4 份独立评审收敛出的头号病灶）**：
- **容器撑满 ≠ 内容够**：`.fill`/等高卡把容器拉满、内容只填顶部 1/4，比不拉满更难看
  （读者第一眼读到「没内容」）。卡/栏内容 <60% 容器高时三选一：**补一个数字锚点**
  （`.stat__num` 大数字 / K 因子 / 百分比，顺带给放映加动效载体）、**收容器高度**、
  **升级成更满的图形版式**。
- 非 `center` 页内容带别悬在上 1/3——底部空过安全区 1/3 时 `check-overflow` 会出
  top-heavy ADVISORY，别无视它。
- 图表页「图太素」同罪：折线要标起止数值、条形厚度用默认（别再调细）、一个数也要配出处。
  数据是主角，就要给主角配戏。

## 16:9 版式目录

| 名称 | 用途 | 关键 class | 提示 |
|---|---|---|---|
| **cover 封面** | 开场定调 | `.slide.center` + `.grid-2` + `.zh-mega`/`.eyebrow`/`.lead`（+副 cell） | 偏置主 cell + 对话副 cell；标题里 `.hl` 圈对比词。**副 cell 按主题选**：技术主题→`.terminal`；**非技术主题→大数字 `.data-hero` / 金句 `.quote` / 配图 `.frame` / 要点**（⚠ 别给非技术 deck 甩英文终端）。**CJK 主标题 ≤ 8–10 字最佳**；更长就拆「主标题+副标题」或改 big-statement；换行在**语义停顿处手动 `<br>`** |
| **big-statement 大论点** | 单一核心论点 | `.slide.center` + `.h1.measure` + `.hl` | 一句话、大字号；关键词用 `.hl` 高亮带，标题陈述结论 |
| **numbered-cards 编号卡** | 分点 / 步骤 / 维度 | `.grid-3.anim-stagger` + `.card.card--num`（`.num`/`.eyebrow`/`.h3`/`.card__tags`） | 差异化填充、统一描边——**不是** icon-card-shadow 网格 |
| **data-hero 数据主角** | 一个关键数字 | `.data-hero`（`.data-hero__num`+`.unit` / `__label` / `__src`） | Swiss KPI，数字占屏宽 ~20%；**必须真实数据 + 出处**，否则换版式 |
| **screenshot 截图** | 产品/UI 展示 | `.grid-2` + `.frame.frame--browser.frame--shadow`（`.frame__placeholder`） | 统一框 + 统一阴影；没图用诚实占位，**不画假 UI**（见 screenshot-framing.md） |
| **honest-bars 条形图** | 真实数据对比 | `.bars.anim-stagger` + `.bar`/`.bar__track`/`.bar__fill[--v]`/`.bar__val` | 纯 CSS，`--v` 填真实百分比；副系列 `--accent-2`、参照 `--ink-3` |
| **comparison 对比** | A vs B 取舍 | `.grid-2`，弱侧 `.card--soft` + 落点侧 `.card--accent` | 右侧 `card--accent` 实色块是唯一落点，替你说出推荐项 |
| **quote 金句** | 引言 / 口号 | `.quote.measure` + `.quote__by` | 大字、留白、一个署名；常配 `data-anim="blur"` |
| **section-divider 分节** | 章节呼吸点 | `.slide.center` + `style="background:var(--accent)"` + `data-accent="…"` | 整页强调色，文字翻 `--accent-ink`；chrome 分段标签跟着切 |
| **bento 便当格** | 一主多副、破网格 | `.bento.fill` + `.col-2/.col-3/.col-4` + `.row-2`，落点格 `.card--accent` | 非均匀但吸附 6 列底栅；最后一格用 accent 收住视线 |
| **asym-split 非对称双栏** | 单一论点（偏置陈述） | `.asym`（`.asym__rail` 窄 + `.asym__main` 宽，1px hairline）；换边 `.asym--flip` | 5:7 偏置本身制造张力；窄栏放标号/eyebrow/小注，宽栏放大结论。区别于均分 `.grid-2` |
| **two-col 中性双栏** | 两个并列的面（**无赢家**） | `.two-col`（加 `.two-col--rule` 给 1px 竖线）；两栏 `.eyebrow`+`.h3`+`.body` | 两栏等权、各表一面。**无 accent 落点**——那是 comparison/zones 的活。用于背景/现状/定义/边界 |
| **timeline 时间轴** | 演进 / 路线（带年份/里程碑） | `.timeline` + 首个 `<i class="timeline__axis">` + `.tl`（`.tl__date`/`.tl__t`/`.tl__d`），落点 `.tl--on` | axis 是静态 hairline；节点自动错峰入场。**带真实日期**才用它，否则用 `.evo` 步骤器 |
| **image-hero 满版图** | 一张图占满版面 | `.imghero`（`<img>`+`.imghero__scrim`+`.imghero__cap`）；`.obj-*` 对准主体 | scrim 渐变保叠字对比（`--scrim`/`--on-media` 中性色禁蓝安全）；**关键文字落安全区**。无图诚实占位 |
| **image-grid 定高图网格** | 多图并置 | `.imggrid`（`--cols`/`--cell-h` 锁高，`object-fit:cover`）；`.cell--wide` 跨两列 | **用 cqw 锁高、不用 aspect-ratio**；多图对齐同一基线。无图用 `.frame__placeholder` |

> **密集网格（bento / grid-3 / grid-4）容量铁律**：一屏 **≤4 卡**，每卡 `h3` ≤1 行、`body` ≤1–2 行。**装不下就拆成两页，别硬塞**——固定尺寸 deck 不会自动缩字，内容超出安全区会撞页脚（见 [anti-slop-checklist.md](anti-slop-checklist.md) P0 溢出）。
>
> **`.card--accent`（强调色块）**：内部所有文字会**自动转浅色**（ink-on-accent），直接写文字即可，**不要手动设深色**（手动深色会和反白底撞、看不清）。
>
> **CJK 文本宽度**：正文 `max-width` 已为 CJK 调宽（lead 52ch / body 72ch）。**不要再给 CJK 段落设更窄的内联 `max-width`**，否则有空间也会提前折行、断在词中间。
| **close / CTA 收尾** | 行动召唤 | `.slide.center` + `.grid-2` + `.h1` + `.terminal` | 一个**具体**下一步动作，不写「Get Started」 |

## 瑞士数据版式（`ppt-swiss.html` · Swiss Data Hero）

- **极致字号对比**：`.zh-mega` 巨标题 + `.body` 极小正文，~5 倍尺度差，层级靠尺度不靠颜色。
- **整块强调**：`.hl--full`（整块红底白字）是全场唯一信号色。
- **硬黑网格线**：`.rule` 改 `background:var(--line-strong)` 加粗作分隔；对比页用一条共享黑边把两栏锁进同一矩形。
- **满铺装饰背景**：`.bg-dots.bg-fade` 绝对定位 `inset:0;z-index:0`，内容相对定位压在其上。

## 辅助 class

布局：`.stack`（竖向间距，`--gap` 调）· `.cluster`（横向 wrap）· `.spread`（两端对齐、底对齐）· `.fill`（撑满剩余高度）· `.center`（垂直居中满高）· `.grid-2/3/4` · `.bento`+`.col-2/3/4`+`.row-2` · `.measure`（阅读宽上限）。
表面/排版：`.card` · `.card--soft`（下沉无边框）· `.card--accent`（强调底 + 反白字）· `.tag`（药丸）· `.rule`（分隔线）· `.eyebrow`（小标签）· `.lead`（导语）· `.body`（正文）· `.muted`（弱化）· `.accent` · `<mark>`（浅底高亮）· `.hl`/`.hl--full`（行内高亮带）。

## 动效（AUTO-MOTION：默认全自动，零标签）

**写普通 HTML 就有动效，不用挂任何标签**——活动页的内容块按文档顺序自动上浮错峰；
多项容器（grid/bento/cards/bars/flow/funnel/layers/matrix2/timeline/asym/two-col/imggrid/
kpi-row/donut-row/zones/contrast/split/ul/ol）改为其**子项**逐个错峰（`--i` 级联最多 **12** 项）；
柱 `.bar__fill` 自动生长、大数字（`.data-hero__num/.donut__val/.gauge__val/.kpi__num/.stat__num`）自动 pop 弹入。

- **退出**：单元素 `data-anim="none"`；整 deck `.deck[data-automotion="off"]`。
- **手动点睛**：`data-anim="fade|rise|wipe|blur"` 覆盖默认；显式分组错峰用 `.anim-stagger`。
- **⛔ 新增动画必须 ≤1600ms 且 `both` fill**——否则破坏四条导出定帧路径（工具栏导出 / render.sh VTB / @media print / reduced-motion）。
- 导出 / 打印 / audit / `prefers-reduced-motion` 下全部定格**结束帧**，无需额外处理。

### 版式 → 入场 recipe（语义动效对照，别全场一个 fade）

| 版式 / 组件 | 入场效果 | 怎么用 |
|---|---|---|
| `bars` 柱状 | 柱生长 | 自动（`.bar__fill` grow-x）；纵向柱手动 `.fx-grow-y`（origin bottom） |
| `data-hero` / `kpi-row` / `stat` / `donut` / `gauge` 大数字 | pop 弹入 | 自动；其它元素要弹入手动加 `.fx-pop` |
| `flow` / `funnel` / `layers` / `timeline` / `evo` | 节点按序点亮 | 自动（容器子项错峰） |
| `linechart` / 关系连线 SVG | **描线 draw-in** | path/polyline 加 `.fx-draw`（可用 `--draw-len` 给准确 path 长度，默认 900） |
| donut 环 | 画环到目标值 | `ppt-ring`（donut 组件内置，`--ring-circ` 周长） |
| `image-grid` / `bento` / `cards` | 逐格错峰上浮 | 自动 |
| quote / 分节页 | 整块 blur→清晰 | 手动 `data-anim="blur"`（一本 deck 用 1–2 次，点睛不滥用） |
| hero / 封面氛围 | canvas 背景漂移 | opt-in `data-fx`（见下节） |

## 分段色域 `data-accent`（每段一个色）

在 `.slide` 上设 `data-accent="ember|sand|cinnabar|olive|mint|magenta|cyan"`，该段把 `--accent` 重绑到对应 `--pal-*`。配合 `data-section="开场 · OPEN"` 给每段命名，chrome / 进度条会跟当前页自动同步色与分段标签。**一段一个 accent，守 60-30-10。**

> **实色块全场一色（`--accent-block`）**：`card--accent / z--r / fn--on / fu--on / ly--on / mq--on / sc--on`
> 这些「承重色块」**不跟分段色走**——它们统一用主题定义的深化色 + 近白反白字（≥4.5 对比），
> 整本 deck 一个块色。分段色只染 chrome / 进度条 / eyebrow / `.hl` 高亮带。
> 块内文字**不要手动设色**，组件自动用 `--accent-block-ink` 反白。

## opt-in canvas 背景 `data-fx`

默认全关。在 `.slide` 里放一层 `.slide-fx` 并标 `data-fx`，hero 区才会动：
```html
<div class="slide-fx" data-fx="dot-field" data-fx-density="0.6" data-fx-speed="0.5"></div>
```
已注册的 fx：`dot-field`（瑞士点阵漂移）· `contour`（杂志等高线）。需在 runtime.js 后引入对应 `assets/fx/*.js` + `assets/fx-runtime.js`。fx 只在该页 `.is-active` 时跑、失活即停，颜色读 `--accent/--ink-3/--line-strong`，`prefers-reduced-motion` 下只画一帧静态。坐在内容之下，不拦指针。

## 导航 / 演示键（runtime.js）

`→/↓/Space/PageDown` 下一页 · `←/↑/PageUp` 上一页 · `Home/End` 首尾 · `F` 全屏 · `S` 讲者备注浮层（可编辑、可拖高，与演讲者视图同一份内容）· `O` 概览缩略图 · `T` 浅色/深色切换 · **`P` 演讲者视图**（提词 + 排练计时 + 配速灯 + 自动弹 `?audience` 观众窗，双窗同步；需 http://）· **`V`** 演讲者视图布局（当前大/下一页大/仅一屏）· **`R`** 重置排练计时 · `?`/`H` 快捷键帮助 · `Esc` 关浮层。点击舞台右/左 1/3 也可翻页。`#/N` 深链定位到第 N 页（`render.sh` 用它逐页截图）。
