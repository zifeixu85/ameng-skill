# layouts.md — 版式词汇表

> 四份模板已演示**每一种**版式：`deck-16x9.html`（旗舰，全套）· `layouts-gallery.html`
> （每页一种版式，左下角标版式名，当目录查最方便）· `deck-swiss.html`（瑞士）。
> **做法永远是：从最接近的 `.slide` 块复制，替换内容——不要从零手写。**
> 每个 slide 是 `<section class="slide">`（居中页加 `center`），讲者备注放 `<div class="notes">`。

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

## 16:9 版式目录

| 名称 | 用途 | 关键 class | 提示 |
|---|---|---|---|
| **cover 封面** | 开场定调 | `.slide.center` + `.grid-2` + `.zh-mega`/`.eyebrow`/`.lead` + `.terminal` | 默认左文右终端（偏置主 cell + 对话副 cell）；标题里 `.hl` 圈对比词。**CJK 主标题 ≤ 8–10 字最佳**；更长就拆成「主标题 + 副标题」或改用 big-statement；标题需换行时在**语义停顿处手动 `<br>`**，别让它自动断在词中间 |
| **big-statement 大论点** | 单一核心论点 | `.slide.center` + `.h1.measure` + `.hl` | 一句话、大字号；关键词用 `.hl` 高亮带，标题陈述结论 |
| **numbered-cards 编号卡** | 分点 / 步骤 / 维度 | `.grid-3.anim-stagger` + `.card.card--num`（`.num`/`.eyebrow`/`.h3`/`.card__tags`） | 差异化填充、统一描边——**不是** icon-card-shadow 网格 |
| **data-hero 数据主角** | 一个关键数字 | `.data-hero`（`.data-hero__num`+`.unit` / `__label` / `__src`） | Swiss KPI，数字占屏宽 ~20%；**必须真实数据 + 出处**，否则换版式 |
| **screenshot 截图** | 产品/UI 展示 | `.grid-2` + `.frame.frame--browser.frame--shadow`（`.frame__placeholder`） | 统一框 + 统一阴影；没图用诚实占位，**不画假 UI**（见 screenshot-framing.md） |
| **honest-bars 条形图** | 真实数据对比 | `.bars.anim-stagger` + `.bar`/`.bar__track`/`.bar__fill[--v]`/`.bar__val` | 纯 CSS，`--v` 填真实百分比；副系列 `--accent-2`、参照 `--ink-3` |
| **comparison 对比** | A vs B 取舍 | `.grid-2`，弱侧 `.card--soft` + 落点侧 `.card--accent` | 右侧 `card--accent` 实色块是唯一落点，替你说出推荐项 |
| **quote 金句** | 引言 / 口号 | `.quote.measure` + `.quote__by` | 大字、留白、一个署名；常配 `data-anim="blur"` |
| **section-divider 分节** | 章节呼吸点 | `.slide.center` + `style="background:var(--accent)"` + `data-accent="…"` | 整页强调色，文字翻 `--accent-ink`；chrome 分段标签跟着切 |
| **bento 便当格** | 一主多副、破网格 | `.bento.fill` + `.col-2/.col-3/.col-4` + `.row-2`，落点格 `.card--accent` | 非均匀但吸附 6 列底栅；最后一格用 accent 收住视线 |

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

## 动效

- 逐元素入场：`data-anim="fade|rise|wipe|blur"`（不写则默认 `fade-up`），仅 slide 激活时触发。
- 逐项错峰：父级加 `.anim-stagger`，子元素按 nth-child 自动延迟（最多 6 项）。
- `prefers-reduced-motion` 下全部关闭，无需额外处理。

## 分段色域 `data-accent`（每段一个色）

在 `.slide` 上设 `data-accent="ember|sand|cinnabar|olive|mint|magenta|cyan"`，该段把 `--accent` 重绑到对应 `--pal-*`。配合 `data-section="开场 · OPEN"` 给每段命名，chrome / 进度条会跟当前页自动同步色与分段标签。**一段一个 accent，守 60-30-10。**

## opt-in canvas 背景 `data-fx`

默认全关。在 `.slide` 里放一层 `.slide-fx` 并标 `data-fx`，hero 区才会动：
```html
<div class="slide-fx" data-fx="dot-field" data-fx-density="0.6" data-fx-speed="0.5"></div>
```
已注册的 fx：`dot-field`（瑞士点阵漂移）· `contour`（杂志等高线）。需在 runtime.js 后引入对应 `assets/fx/*.js` + `assets/fx-runtime.js`。fx 只在该页 `.is-active` 时跑、失活即停，颜色读 `--accent/--ink-3/--line-strong`，`prefers-reduced-motion` 下只画一帧静态。坐在内容之下，不拦指针。

## 导航 / 演示键（runtime.js）

`→/↓/Space/PageDown` 下一页 · `←/↑/PageUp` 上一页 · `Home/End` 首尾 · `F` 全屏 · `S` 讲者备注浮层 · `O` 概览缩略图 · `T` 浅色/深色切换 · `?`/`H` 快捷键帮助 · `Esc` 关浮层。点击舞台右/左 1/3 也可翻页。`#/N` 深链定位到第 N 页（`render.sh` 用它逐页截图）。
