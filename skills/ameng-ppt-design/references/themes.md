# themes.md — 主题选择，什么场景用哪个

> 6 个主题都在 `assets/themes/`，每个文件只覆盖 `:root` token + 极少量结构微调，意图注释在第一行。
> 选主题：模板里硬编码 `<link id="theme-link" href="../assets/themes/<x>.css">`（设计时定一个，不在放映时换主题）。
> 放映按 **`T`** 在该主题的**浅色（`:root`）⇄ 深色（`.deck[data-theme="dark"]`）**之间切换——不再是多主题循环。
> 文字色由 `base.css` 的 `.deck { color: var(--ink-1) }` 统一继承，所以深色块只要重定义了 `--ink-1` 标题就会自动翻白（详见 design-system.md §8 的「文字色继承的坑」）。
>
> **禁蓝默认**：旗舰永远不是蓝。`blueprint`（蓝）只用于报告/咨询场景，绝不当 flagship 默认。

---

## 旗舰：industrial-paper

**默认主题、整套 skill 的人格所在。** 暖纸感 light + `ember` 单一强调色 + 工业质感——
像一篇印在好纸上的技术随笔（参考 工业纸感基线 `设计基线`）。

| 维度 | 取值 |
|---|---|
| 适用场景 | 技术随笔 / 产品分享 / 路演 / 有主张的演讲——「opinionated · shipped · industrial」 |
| 字体方向 | Display = Bricolage Grotesque（拉丁）+ 黑体（CJK，PingFang / 思源黑）；Body = Host Grotesk + CJK 黑体（serif CJK 仅 editorial-ink / porcelain 保留） |
| 强调色 | `--accent = --pal-ember`（赤陶暖红橙），副色 `--pal-olive`；统一圆角 4/10/16px（bento 辨识度） |
| 推荐比例 | 16:9 |
| 配 grain | **是**——`data-grain` 默认开，亮色自动翻深色噪点 |

**深色变体**：放映按 `T` 即在 `.deck` 上加/去 `data-theme="dark"`，切到**暖 espresso 深底**（同暖纸色相，不是冷蓝）+ ember 提亮 + 颗粒调淡——标题、正文、chrome 全部正确翻色（继承自 `.deck { color }`）。这是 工业纸感 深色 slides 的等价物，无需换主题文件。

---

## 其它主题速查

| 主题 | 适用场景 | 字体方向 | 强调色 | 推荐比例 | grain |
|---|---|---|---|---|---|
| **editorial-ink** | 观点稿 / 深度分享 / 品牌·人文叙事 | 衬线大标题 + CJK sans 正文 | 砖红 + 墨蓝副色，低圆角 3/6/10px | 16:9 | 可选 |
| **swiss-signal** | 数据 / 结论先行 / 严谨汇报 / 产品原则 | 全无衬线（Helvetica Neue / PingFang） | 信号红 + 黑作第二强调，**零圆角**、硬黑网格线、无阴影 | 16:9 | 可选 |
| **obsidian-tech** | 技术分享 / 工程评审 / 开发者向 | 无衬线 + 等宽点缀（eyebrow 用 mono） | 青 teal + lime 第二序列，深色但克制 | 16:9 | 可选 |
| **porcelain** | 小红书图文 / 生活方式 / 品牌种草 / 温柔叙事 | 衬线标题 + CJK sans，大留白（大 `--pad`） | 雾玫瑰 + sage 副色，大圆角 10/18/28px | **9:16** | 否（留白做氛围） |
| **blueprint** | 商业汇报 / 投资材料 / 咨询风 / 周报（**唯一允许蓝**） | 无衬线 + JetBrains Mono 数字 | 企业蓝 + teal 第二序列，全局 `tabular-nums` | 16:9 | 否 |

## 逐个说明

### editorial-ink — 杂志/编辑风
暖纸底 + 衬线大标题 + 单一砖红强调，crisp 低圆角。适合「观点 + 人味」的内容稿、品牌叙事。带一个克制的墨蓝副色，仅用于第二数据序列。

### swiss-signal — 瑞士国际主义
纯白 + 无衬线 + 红色信号 + 强网格，**零圆角、无阴影**——靠网格和字距做层级。`.card` 用 `--line-strong` 描边，黑作第二「强调色」。适合数据先行、结论先行、严谨汇报、产品原则。配 `deck-swiss.html` 模板。

### obsidian-tech — 深色技术
近黑底 + 青 teal 强调 + 等宽点缀，`.eyebrow` 切成等宽小写。深色但克制（非霓虹滥用），lime 作第二序列。适合技术分享、工程评审、开发者向。

### porcelain — 轻奢/小红书
暖白瓷底 + 柔雾玫瑰 + 大留白 + 大圆角，`--pad` 更大。**配 9:16 竖屏尤佳**，是小红书图文/生活方式种草的默认（`deck-9x16.html` 默认即此主题）。

### blueprint — 数据/咨询（report-only 蓝）
冷中性 + 企业蓝 + 表格数字纪律（`.stat__num/.bar__val/td/.num` 全 `tabular-nums`）。克制的咨询风设计系统（参考 getsentry / mckinsey），配「只画真实数据」纪律最佳。**这是禁蓝默认里唯一的蓝色例外，仅用于汇报，绝不当旗舰。**

## 选择提示
- 不确定 → 16:9 选 **industrial-paper**（旗舰，最有人格）；正式汇报选 **blueprint** 或 **swiss-signal**；竖屏选 **porcelain**。
- 一份 deck **只定一个主题**（硬编码 `#theme-link`）；放映 `T` 只在该主题的浅/深之间切，不跨主题。
