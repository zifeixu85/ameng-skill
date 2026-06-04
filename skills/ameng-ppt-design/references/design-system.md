# design-system.md — Token 契约 + 签名原语

> 唯一真相源是 `assets/base.css` 的 `:root`；高阶组件在 `assets/components.css`。
> 铁律：版式 / slide 里**只写 `var(--token)`，绝不硬编码 hex**；主题文件（`assets/themes/*.css`）
> 只覆盖 `:root` 里的 token。加载顺序固定：`fonts.css → base.css → components.css → themes/<x>.css`。

---

## 1. 颜色（全部 OKLCH，无纯黑白）

### Surfaces 表面
| Token | 默认值 | 用途 |
|---|---|---|
| `--bg` | `oklch(98.5% 0.004 95)` | deck / 页面底色 |
| `--surface-1` | `oklch(100% 0 0)` | 抬起的卡片（`.card`） |
| `--surface-2` | `oklch(96% 0.005 95)` | 下沉/弱填充（`.card--soft`、`.tag`、`.bar__track`、`.frame--browser` 栏） |
| `--line` | `oklch(88% 0.006 95)` | 发丝边框 |
| `--line-strong` | `oklch(78% 0.01 95)` | 强分隔线（瑞士风用硬黑） |

### Ink 文字（3 级层级）
| Token | 用途 |
|---|---|
| `--ink-1` | 主文字 / 标题（`.display`/`.h1`/`.stat__num`） |
| `--ink-2` | 次要正文（`.lead`/`.body` 默认） |
| `--ink-3` | 弱化 / 注脚 / 页码（`.muted`） |

### Accent 强调（语义化，不是装饰）
| Token | 用途 |
|---|---|
| `--accent` | 主强调：进度条、`.eyebrow`、`mark`、`.bar__fill`、`.card--accent` 底、`.hl` 高亮带 |
| `--accent-ink` | 落在 accent 上的文字（`.hl--full`、`.card--accent` 内文字） |
| `--accent-2` | 第二数据序列（图表双色） |
| `--accent-soft` | accent 的浅色底（`mark` 背景） |

约束：一个 deck / section **单一强调色，60-30-10**；数据系列 ≤ 2 个强调色。

> **60-30-10 是视觉权重，不是像素占比**——60% 中性底/留白、30% 次级文字与边框、10% 强调落点。强调色「因为稀有才有力」，铺满即失效。
>
> **tinted-neutral chroma `0.005–0.015`**，色相**朝品牌 hue**（accent 是 ember 就朝暖，是 mint 就朝绿），让中性面与品牌色潜意识呼应。
> **警告**（impeccable colorize）：永远朝暖（或永远朝冷）会导致**跨项目同质化**——暖奶白正是当下 AI「奶油色」套路。换品牌色时**中性色 hue 要跟着换**。注：我们 6 主题目前中性多朝暖 hue 60–80，是为「工业纸感」的**已知取舍**，不是反射式默认；做新主题时按其品牌 hue 重设中性倾向。

### 可换强调色调色板（`--pal-*`）
base.css 备好一组可换的 accent，按 `data-accent` 给某段重绑 `--accent`：
`--pal-ember`(45) · `--pal-sand`(75) · `--pal-cinnabar`(30) · `--pal-olive`(130) ·
`--pal-mint`(160) · `--pal-magenta`(348) · `--pal-cyan`(215)。
**禁蓝默认**——`--pal-*` 里没有纯蓝；全场禁蓝，无主题用蓝。

## 2. 字体

族（主题可换，**禁 Inter/Roboto**，见 fonts.css 封禁清单）：
- `--font-display` → 标题（**Bricolage Grotesque（拉丁）+ 黑体（CJK，PingFang / 思源黑）**；serif CJK 仅 `editorial` / `editorial` 两个杂志风主题保留）
- `--font-body` → 正文（Host Grotesk + CJK 黑体）
- `--font-mono` → 数字/代码/元数据（JetBrains Mono，**tabular-nums**）

字号阶（fluid `clamp()`，锚定 1280 宽舞台，**大对比**制造层级）：
`--fs-eyebrow` < `--fs-body` < `--fs-lead` < `--fs-h3` < `--fs-h2` < `--fs-h1` <
**`--fs-display`**（`clamp(3.6rem,1.8rem+6vw,7rem)`）；外加 `--fs-stat`（大数字）。
CJK 巨标题用 `.zh-mega`（`clamp(3.2rem,1.4rem+6vw,7.5rem)`，瑞士式极致字号对比）。

字重：`--w-light 300` / `--w-reg 400` / `--w-med 500` / `--w-semi 600` / `--w-bold 700`。
字距：`--track-tight -0.02em`（大标题收紧） / `--track-wide 0.16em`（仅 eyebrow/label）。
行高：`--leading-tight 1.08` / `--leading-body 1.62`。

### 2.1 字号纪律（借自 impeccable typeset）

- **模块化比例选一个并贯彻**：命名比例 `1.25`（major third）/ `1.333`（perfect fourth）/ `1.5`（perfect fifth）——一份 deck 只用一个比例排字阶，别混。**旗舰建议 1.333**（perfect fourth，对比够狠又不撕裂）。
- **`clamp()` 上界护栏**：`max ≤ 2.5 × min`，超了大屏会「喊叫」、破坏缩放/reflow。自检：`--fs-display` `3.6→7rem` 比值 1.94，合规。
- **ALL-CAPS tracking 区间 `0.05–0.12em`**：只给短 uppercase label / eyebrow / 拉丁小标，**不给 body**（正文 tracking > 0.05em 会打散字组、拖慢阅读）。注意：我们 `--track-wide` 默认 0.16em **偏大，应收到 0.12em 上界**。CJK 永不加 wide tracking。
- **暗底文字补偿三轴**（落到 `dark-luxe` / `industrial-paper[data-theme=dark]` 直接用）：浅字落暗底会显得更轻，**三轴一起补**——`line-height +0.05~0.1`、`letter-spacing +0.01~0.02em`、body 字重 **+1 档**（如 reg→med）。只补一轴不够。

## 3. 间距 / 圆角 / 阴影

间距阶（**4pt 体系**，刻意非均匀）：
`--s-1 .25` `--s-2 .5` `--s-3 .75` `--s-4 1` `--s-5 1.5` `--s-6 2` `--s-7 3` `--s-8 4.5` `--s-9 6.5`（rem）
≈ `4/8/12/16/24/32/48/72/104px`——是 4pt 体系（impeccable layout 推荐 4pt 而非 8pt：8pt 太粗，常缺 8→16 之间的 12）。
节奏数值（借自 impeccable layout）：**相关元素 8–12px**（紧），**区块/分组间 48–96px**（松）——靠这个反差造层级，别每处一样 padding。
圆角：`--r-1 6` `--r-2 12` `--r-3 20`（px）`--r-pill 999`。一个 deck 只用**一个圆角家族**（主题整体改写）。
阴影：`--shadow-1`（极轻） / `--shadow-2`（卡片/`.frame`/`.terminal`） / `--shadow-3`（弹层/`.frame--shadow`）。克制。

> **暗模式深度来自表面亮阶，不靠发光/阴影**（impeccable colorize）：暗底主题（`dark-luxe`）的层次用 **3 档 L** 表达——如 `15% / 20% / 25%`，**同 hue、同 chroma，只变 L**，越抬起越亮。禁「深底 + 彩色 box-shadow 发光」（那是 AI 暗模式套路，见 [anti-slop-checklist.md](anti-slop-checklist.md)）。

## 4. 舞台几何 & 动效

- `--slide-w` / `--slide-h`：固定舞台。16:9 = `1280×720`。
- `--pad`：slide 内边距 `clamp(2.5rem,1rem+4vw,5.5rem)`；`--content-max 1100px`（阅读宽上限）。
- 缩放：`.deck__stage` 用 `transform: scale(var(--fit))`，`runtime.js` 按窗口算 `--fit`，像素稳定。
- 动效：`--dur 480ms` / `--ease cubic-bezier(0.16,1,0.3,1)`。`prefers-reduced-motion` 已内置关闭。
- **缩略图总览（`O` / `0`）= 标准做法**：每页是该 slide 的**等比实拍预览**，不是文字列表。`runtime.js` 把每页 `cloneNode` 进一个迷你 `.deck.deck--chrome.ppt-exporting > .deck__stage` 骨架（带同样 `data-grain`/`data-theme`），这样全局选择器照常命中、`ppt-exporting` 把入场动效定格到结束帧（柱状图/图形都满帧）；再用 JS `scaleThumbs()` 按格子宽算 `scale = 格子宽 / --slide-w`（origin 左上），自适应列宽、窗口缩放重算。每张下方 `编号 + 标题` caption，当前页 accent 高亮。新建/改版式无需额外处理，自动获得此预览。

## 5. 签名原语（工业纸感 DNA）

- **行内高亮带 `.hl`**：`<span class="hl">关键短语</span>`——accent 实色带坐在文字**之下**，略微 `skewX(-3deg)` 破格。`.hl--full` 整块上色（文字翻成 `--accent-ink`），用于巨标题里的「句读」。
- **胶片颗粒 `data-grain`**：在 `.deck` 上加 `data-grain` 开启 SVG 噪点叠加（暖纸氛围）。亮色主题（`data-theme="light"` 或 `.is-light`）自动翻成深色乘法噪点。
- **分段色域 `data-accent`**：在 `.slide`（或 `.deck`）上设 `data-accent="ember|sand|cinnabar|olive|mint|magenta|cyan"`，该段把 `--accent` 重绑到对应 `--pal-*`。runtime 会把当前页的 `data-accent` 上抛到 `.deck`，让 chrome / 进度条跟着换色。
- **阅读宽 `.measure`**：`max-width: var(--content-max)`，给长标题/正文兜底。

## 6. components.css 组件清单

| 组件 | 关键 class | 说明 |
|---|---|---|
| 编辑式 chrome | `.deck--chrome` + `.chrome-top` / `.chrome-foot`（含 `.chrome-top__brand/meta/sec/page`） | 持久顶/脚元数据栏，放在 `.deck__stage` 内、`.slide` 外；runtime 填页码与分段标签。开 `.deck--chrome` 后 slide 自动避让、并隐藏自动注入的 `.slide__num`。 |
| 终端 | `.terminal`（子元素 `.cmd` / `.ok` / `.comment`） | 深底等宽「已上线」证据块，含交通灯点；`.cmd` 前缀 `$ `（accent 色），`.ok` 后缀 ` ✓`。 |
| 截图框 | `.frame` / `.frame--browser` / `.frame--shadow` / `.frame__placeholder`（`.frame img` / `.frame__shot`） | 统一框 + 统一阴影的截图美化；`--browser` 加假浏览器栏，无图时用 `.frame__placeholder`（**不画假 UI**）。 |
| 编号卡 | `.card--num`（`.num` / `.eyebrow` / `.card__tags`） | mono 编号挂右上角、衬线标题、底部 mono 标签——差异化填充，非图标卡片网格。 |
| Swiss Data Hero | `.data-hero`（`.data-hero__num` / `__label` / `__src`） | KPI 当视觉主语（数字 `clamp` 到 ~16rem，占屏宽 ~20%），配 label + **真实出处**。 |
| 离线背景 | `.bg-dots` / `.bg-grid` / `.bg-paper` / `.bg-fade` | 纯 CSS 渐变/点阵背景（无网络）；`.bg-fade` 向下淡出，只铺在 hero 区。 |
| fx canvas 层 | `.slide-fx`（配 `data-fx`） | 全幅画布层，默认关；见 [layouts.md](layouts.md) 的 `data-fx`。 |

> base.css 里还有：`.stat`/`.quote`/`.tag`/`.rule`/`.bars`(`.bar`/`.bar__track`/`.bar__fill`/`.bar__val`)、
> 布局 helper（`.stack`/`.cluster`/`.spread`/`.center`/`.grid-2/3/4`/`.bento`+`.col-*`/`.row-2`）、
> 卡片（`.card`/`.card--soft`/`.card--accent`）。完整 helper 列表见 [layouts.md](layouts.md)。

## 7. 铁律

1. 版式里**只写 `var(--token)`**，不写 hex / hsl。
2. 主题文件**只覆盖 `:root` token**（外加极少量结构微调，见下）。不在主题里重写整块布局。
3. 颜色一律 **OKLCH**，禁紫色渐变，默认禁蓝。
4. 加载顺序固定：`fonts.css → base.css → components.css → themes/<x>.css`。

## 8. 如何新建一个主题

1. 复制任一 `assets/themes/*.css`（推荐从 `industrial-paper.css` 起）。
2. 顶部留一行意图注释（风格 / 适用场景）。
3. 在 `:root` 里**只覆盖需要变的 token**：颜色、`--ppt-display/body/mono`、必要的 `--r-*`/`--track-*`/`--shadow-*`/`--pad`。
4. 颜色**只用 OKLCH**，遵守封禁字体清单与禁蓝默认；中性色带 0.005–0.01 的 warm/brand tint。
5. 需要时追加极少量结构微调（示例：neo-brutalist `.card` 用粗黑边框 + 硬投影、零圆角；editorial 卡片改顶部发丝线 + 首字下沉；ink-wash 给 `.eyebrow` 加朱砂描边、`.hl` 改朱批晕染——差异要够大）。
6. **加深色变体**（`T` 键浅/深切换的另一半）：在主题文件末尾写一个 `.deck[data-theme="dark"] { … }` 块，**重定义** `--bg / --surface-* / --line* / --ink-1/2/3 / --accent*`（深底用暖/冷要跟 light 同色相，别突然冷蓝；`--ink-1` 要在深底上够亮，禁纯黑底）。需要时再补 `--shadow-*` 和 `.deck[data-theme="dark"][data-grain] .deck__stage::after { opacity:.25 }`（深色下颗粒调淡）。
7. **文字色继承的坑（必读）**：标题（`.h1/.zh-mega` 等）**不写自己的 color**，靠继承。`base.css` 已在 **`.deck { color: var(--ink-1) }`** 处统一兜底——因为 `data-theme="dark"` 加在 `.deck` 上，而 `body` 是 `.deck` 的祖先，文字色若只挂在 `body` 上会在深色作用域**外**解析、停在浅色墨色 → 标题在深底上隐形。所以：**别把正文色只写在 `body`/`html` 上**；只要主题在 `.deck[data-theme="dark"]` 里重定义了 `--ink-1`，继承的标题会自动翻白。`.lead/.body/.hl` 各自显式 `color:var(--ink-*)` 不受影响。
8. 交付：把模板 `#theme-link` 的 `href` 锁成这个主题文件即可；放映 `T` 在该主题的 `:root`（浅）与 `.deck[data-theme="dark"]`（深）之间切换，不再是多主题循环。
