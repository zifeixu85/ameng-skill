# image-prompts.md — 重做/重绘截图与插画的 prompt 模板

> 当一张截图风格不搭、分辨率不够、或你需要的是示意图而非真实界面时，用下面的 prompt
> 模板**按 deck 的工业暖纸调性**重新生成。移植自 归藏 image-prompts 的精神。
>
> **工具无关**：这些是给你手上**任何**图像工具的文字 prompt（国内可用的图像后端优先，
> 不强制任何外部 API、不绑某一家）。生成后按 [screenshot-framing.md](screenshot-framing.md) 套框入页。

---

## 统一的品牌锚（每条 prompt 都带上）

把这段「品牌锚」拼进每一条 prompt，确保产出留在调性内：

> Visual style: industrial editorial, warm off-white paper background (not pure white),
> a single warm ember/terracotta accent color, near-black warm ink for text.
> **No blue, no purple gradients, no neon, no AI-glow, no glassmorphism, no stock-photo gloss.**
> Restrained shadows, unified corner radius, film-grain texture, lots of breathing room.
> Flat or subtly tactile, looks printed on good paper. OKLCH-grade muted palette.

如果 deck 用了别的主题，把「ember/terracotta」换成该主题的强调色（swiss → signal red、
editorial → muted rose、obsidian → teal），其余约束不变。

---

## 模板 1 · 白板式讲解图（whiteboard explainer）

> A hand-drawn whiteboard-style explainer diagram showing **[把流程/概念写清，如：idea → 验证页 → 真实信号]**.
> Loose marker strokes, simple boxes and arrows, handwritten-feel labels in Chinese,
> warm ember accent for the one key step, everything else in near-black ink on warm paper.
> Generous white space, no clutter, no icons-in-circles cliché.
> [品牌锚]

用途：把一段口头逻辑变成一张「黑板讲解」图，替代密集文字页。

## 模板 2 · 干净产品截图重设计（clean product-shot redesign）

> Redesign this product UI screenshot in a clean, editorial style:
> warm off-white surface, single ember accent for the primary action only,
> generous spacing, one unified corner radius, hairline borders, no drop-shadow stacking.
> Keep the real content and data **[描述要保留的真实信息]**, only restyle the visual shell.
> Desktop app aesthetic, looks shipped and maintained, not a template.
> [品牌锚]

用途：原界面是蓝色 SaaS 模板味、或风格与 deck 冲突时，重塑外壳但**保留真实数据**（不要让模型编造数字）。

## 模板 3 · 数据/示意图插画（data / diagram illustration）

> A minimal data illustration / schematic for **[要表达的关系，如：先验证 vs 先开发的成本曲线]**.
> Information-design aesthetic: thin precise lines, a calm dot-grid or contour background,
> one ember accent line for the highlighted series, all other series in muted gray ink.
> Swiss/technical feel, tabular-looking numbers, real labels **[列出真实坐标轴/标签]**, no fake values.
> [品牌锚]

用途：替代 `.bars` 撑不下的复杂关系图。**只画真实数据**——把真实数值写进 prompt，不让模型瞎填。

## 模板 4 · 封面 hero 图（cover hero image）

> A cover hero illustration for a tech talk titled **[标题]**.
> Industrial editorial poster feel: large warm-paper field, subtle film grain,
> one bold ember shape or contour motif as the focal point, lots of negative space
> reserved on the left for a headline overlay. Calm, confident, opinionated — not busy, not corporate-cheerful.
> 16:9, high resolution, ≥1600px long edge.
> [品牌锚]

用途：封面或分节页背景。给标题留出叠字的负空间（配合 `.bg-fade` 不抢文字）。

---

## 使用要点

- **先选对模板，再填方括号**：把 deck 里那一页的真实主题/数据填进 `[…]`，越具体越像。
- **比例与尺寸**：长边 ≥ 1600px；16:9 deck 出 16:9 图。
- **真实优先**：模板 2/3 涉及数据时，把真实数值/标签写进 prompt，**绝不让模型编造**（违反 anti-slop 红线）。
- **生成后入页**：按 [screenshot-framing.md](screenshot-framing.md) 套 `.frame`，命名 `images/NN-语义.ext`，同名覆盖迭代。
- **对不齐就重来**：一次出多张时风格各异，挑一条 prompt 批量重生成，比逐张修更省事。
