# anti-slop-checklist.md — 反 AI 味的纪律闸门

> 这是质量闸门，不是建议。融合 工业纸感 `设计基线`（人格 / 反参考 / 字体封禁 /
> 禁蓝 / 单 accent 60-30-10 / 禁纯黑白 / 只用 OKLCH）+ anthropic「反 AI 味」（禁标题装饰线 /
> 禁清一色卡片网格 / 克制阴影圆角）+ getsentry/mckinsey「只画真实数据」（无真实数据 → 文字版式，
> 绝不编造数字或假图表）+ 子代理逐页视觉 QA。
>
> 用法：搭页时对照；交付前走最后的「逐页核对闸门」。**任何一项不过，就改，别交付。**

---

## 配色

- [ ] 颜色全部用 `var(--token)`，**deck/版式里没有任何硬编码 hex / hsl**（只有主题文件 `:root` 里才写 OKLCH 字面量）。
- [ ] **默认禁蓝**（淡蓝 / 靛蓝 / 青蓝任何变体）。全场无例外。
- [ ] **单一强调色**，按 60-30-10 稀用——强调色出现在「需要被看见」的地方，不铺满。
- [ ] **没有紫色渐变 / AI 霓虹**（深背景 + 青 + 紫蓝渐变 = 立刻判负）。
- [ ] **禁纯黑、纯白**：底色和文字都是带色相倾向的近黑近白（OKLCH chroma > 0）。
- [ ] 强调色用作**语义**（强调 / 数据落点），不是装饰；数据系列 ≤ 2 个强调色（`--accent` + `--accent-2`），其余用 `--ink-3`。

## 字体

- [ ] **没有出现封禁字体**：Inter, Roboto, Arial, Open Sans, DM Sans/Serif, Plus Jakarta, Outfit, IBM Plex*, Space Mono/Grotesk, Instrument*, Fraunces, Newsreader, Lora, Crimson*, Playfair Display, Cormorant*, Syne。
- [ ] Display = Bricolage Grotesque，Body = Host Grotesk，Mono = JetBrains Mono（或主题指定的 CJK 栈），**都自托管 / 系统栈，无 Google Fonts、无 CDN**。
- [ ] 字号有 **5 档以上 scale 对比**（`--fs-eyebrow` 到 `--fs-display` / `.zh-mega`），层级靠尺度，不靠堆色。
- [ ] 标题用 `--font-display`、数字用 `--font-mono`（`tabular-nums` 对齐）。

## 版式层级

- [ ] **没有标题下的装饰性短横线**。
- [ ] **没有清一色卡片网格**（图标-标题-正文重复三卡行）——用 `card--num` 差异化填充，或 `.bento` 破网格。
- [ ] 阴影 / 圆角**克制**：一个 deck 一套圆角家族（主题已定），阴影只在确需层级处用。
- [ ] 间距有**节奏**（用 `--s-*` 阶），不是每处都一样的 padding。
- [ ] 一页 / 一个区域**只有一个视觉主角**；其余降噪成支撑。
- [ ] 标题**陈述结论**，不是主题词（「先验证再开发」优于「验证方法」）。

### eyebrow / 编号 / copy 护栏（借自 impeccable 反 AI 味）

- [ ] **eyebrow/kicker 护栏**：全 deck tracked-caps eyebrow **≤ 2–3 个**，只用于封面 / 分段 hero 页。普通页用尺度 / 位置 / `.card__tags` 做层级，**别给每个标题都戴小帽**（impeccable `repeated-section-kickers`：≥3 个 uppercase+tracked label 紧贴 heading 即判 AI scaffolding）。
- [ ] **编号标记护栏**：`.card--num`（01/02/03）只用于**内容本身是有序序列**的页（真实流程 / 时间线），**全 deck ≤1 处编号序列**；不要当通用 section kicker（impeccable `numbered-section-markers`：≥3 个连号 advisory）。
- [ ] **em-dash 不滥用**：英文正文 em-dash（`—` / `--`）**≥5 即 AI cadence tell**（impeccable 实现阈值）——英文语境改用逗号 / 冒号 / 句号 / 括号。中文破折号「——」作为正当中文标点可保留，但也别滥用。
- [ ] **无 marketing buzzword / 口号腔**：禁「赋能 / 打造 / streamline / empower / supercharge / world-class / next-generation」等套话；「不是 X，是 Y」对比句式全文 **≤2 次**（impeccable `aphoristic-cadence` ≥3 即判）。

## 数据诚实（红线）

- [ ] 每个数字 / 图表都有**真实、可溯源的出处**（写进 `.data-hero__src` 或脚注 / `.notes`）。
- [ ] **没有真实数据 → 改用文字版式**（大论点 / 金句 / 对比），**绝不编造数字、绝不造假图表**。
- [ ] 条形图 `--v` 是真实百分比；模板里的「示例·需替换」占位已换成真实值或删除。
- [ ] 截图没图时用 `.frame__placeholder`，**绝不画假 UI 截图**。
- [ ] 个人体验 / 非临床数据**如实标注**（如「* 个人体验，非临床数据」），不冒充权威。

## 动效

- [ ] 只动 `transform` / `opacity`（含 `clip-path`/`filter` 的 wipe/blur 入场），不动布局属性。
- [ ] 首屏一次编排入场，之后克制；缓动用 `--ease`（ease-out-expo），不用 bounce/elastic。
- [ ] `prefers-reduced-motion` 下降级（base.css + fx 已内置，自检时确认未被覆盖）。
- [ ] `data-fx` canvas 背景是 opt-in 且**坐在内容之下**，不压低可读性。

## 可访问性

- [ ] 强调色与底色、`card--accent` 上文字对比度达 WCAG AA（深色主题尤其查 `--ink-2/3`）。
- [ ] 用语义元素（`.slide` 是 `<section>`、引用用 `<blockquote>`），不堆 `<div>`。
- [ ] 键盘全程可放映（← → / F / S / O / T 已由 runtime 提供，确认未破坏）。

---

## 严重度分级（先改 P0，往下排）

「发现问题就改」也要有优先级。命中后按这条线排序，别在 polish 上耗到漏掉溢出：

| 级别 | 范畴 | 处置 |
|---|---|---|
| **P0** | 溢出 / 错位 / 数据造假 / 对比度不达标（WCAG AA） | **必改**，不改不交付 |

**P0 补充（内容级溢出与封面标题）：**

- [ ] **P0 溢出**：任何内容超出安全区，或与页眉 / 页脚 chrome 重叠 → **必改**（缩内容或拆页）。逐页看 render PNG 时**重点查最后一行 / 最后一卡是否被裁**。密集网格装不下就拆两页，固定尺寸 deck 不会自动缩字。
- [ ] **封面/大标题必须全宽**：`zh-mega` 每个汉字 ~99px，塞进 `grid-2` 半栏（~520px）只能放 ~5 字/行，6–7 字就**反复折行**（手动 `<br>` 也救不了，因为容器本身就不够宽）。**长 CJK 标题一律走全宽 stack**，终端/配图放标题**下方**的 `grid-2` 行（`align-items:end`），别和标题并排抢宽度。半栏放标题只允许 ≤5 汉字/行 的极短标题。
- [ ] **封面标题长度**：CJK 主标题 **>10 字**，或折成 **>2 行且断在词中间** → 改短，或在语义停顿处手动 `<br>`（别让浏览器自动断）。
| **P1** | AI tell（标题装饰线 / 清一色卡片 / 紫渐变 / 禁用字体 / 蓝/ eyebrow 滥用 / 编号滥用 / buzzword / em-dash≥5） | **应改** |
| **P2** | 一致性（圆角家族 / 间距节奏 / accent 段切换） | **考虑** |
| **P3** | polish（微动效 / 光学对齐 / 留白微调） | **可选** |

## 提交前逐页核对闸门

跑 `./scripts/render.sh <deck.html> <count>` 出逐页 PNG，**对每一页**逐条问：

1. **这一页只有一个核心信息吗？**（多于一个 → 拆页）
2. **标题陈述了结论吗？**（还是只写了主题词 → 改写成结论句）
3. **页面里每个数字都有出处吗？**（没有 → 删掉或换文字版式）
4. **有没有任何硬编码 hex / 不来自 token 的颜色？**（有 → 换 `var(--…)`）
5. **出现了禁用字体 / 蓝色/ 紫渐变 / 标题装饰线 / 清一色卡片网格了吗？**（有任何一个 → 判负，重做该页）
6. **截图是真图还是诚实占位？有没有假 UI？**（造假 → 撤掉）
7. **PNG 里有溢出 / 错位 / 对比度不足吗？**（有 → 修，重渲染）

**发现问题就改，改完重新渲染。这个闸门不许跳过。** 任一项不过，回到 [authoring-guide.md](authoring-guide.md) 重改该页。

> 可选 advisory 交叉检查：`node ~/.claude/skills/impeccable/scripts/detect.mjs --json <deck>`（40+ 条确定性规则，覆盖上面多数 AI tell）。它是参考，不替代逐页 PNG 自检；本 skill 的硬纪律以 `scripts/validate.mjs` + 本闸门为准。
