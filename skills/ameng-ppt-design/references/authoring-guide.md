# authoring-guide.md — 从大纲到 deck 的完整流程

把一份内容大纲变成可放映 HTML deck 的端到端步骤。核心节奏：**先声明方向 → 装字体 →
脚手架 → 选主题 + 配色域 → 逐页复制改文 → 截图美化 → 逐页自检 → 交付**。

---

## 0. 先声明 design-direction（动手前必做）

打开 [design-direction.md](design-direction.md)，复制成 `decks/<name>/design-direction.md`，
把模板填完：Project / Users / Brand Personality / Aesthetic / Theme / Anti-References /
Color / Typography / Composition / Motion / Principles / Responsive / Accessibility。

不确定就用默认（opinionated·shipped·industrial + 暖纸 Bento + light + ember 单 accent + 禁蓝）。
**没有声明过的方向，不许开搭页。**

## 1. 规划叙事弧 + 页数 + 主题节奏

**叙事弧**（每份 deck 都按这条线排页）：
`Hook（钩住）→ Context（为什么相关）→ Core（核心论证）→ Shift（转折/反直觉）→ Takeaway（行动）`

**页数规划**（按时长）：

| 时长 | 页数 |
|---|---|
| 15 min | ≈ 10 页 |
| 30 min | ≈ 20 页 |
| 45 min | ≈ 25–30 页 |

**主题节奏表**（hero / non-hero 交替，给眼睛呼吸）：

| 节奏角色 | 版式 | 出现位置 |
|---|---|---|
| hero（视觉重） | cover / data-hero / section-divider / quote | 段首、转折、结尾 |
| non-hero（信息密） | numbered-cards / bars / comparison / screenshot | 论证主体 |

规则：**连续两页不要都是 hero，也不要连续三页都是密集信息**。分节页（整页 accent）当呼吸点。

## 2. 装字体（一次性，可选）

字体自托管离线。`fonts.css` 期望 `assets/fonts/*.woff2` 存在，由 `scripts/fetch-fonts.sh`
一次性下载填充（之后完全离线）：

```bash
./scripts/fetch-fonts.sh          # 一次性拉取 Bricolage/Host/JetBrains woff2
```

> 跳过这步也能用：`fonts.css` 的字体栈会**优雅回退到系统 CJK**（PingFang / Source Han /
> 系统 mono），只是少了 Bricolage 的辨识度。脚本是一次性下载，之后全离线。
> **绝不**为了字体去引 Google Fonts / CDN——那违反离线与封禁清单纪律。

## 3. 脚手架

```bash
./scripts/new-deck.sh <name> [16x9|9x16|swiss]   # 默认 16x9；swiss=瑞士数据风
```
生成 `decks/<name>/index.html`（资源路径已修正为 `../../assets/`）+ `decks/<name>/images/`。
三种模板：`16x9`（旗舰工业纸感）/ `9x16`（竖屏 小红书）/ `swiss`（瑞士数据风）。

## 4. 选主题 + 给每段设色域

- 选主题：改 `index.html` 的 `<link id="theme-link" href="../../assets/themes/<x>.css">`（设计时定一个）。
- 浅/深：放映按 `T` 在该主题的浅色（`:root`）⇄ 深色（`.deck[data-theme="dark"]`）之间切换；不跨主题、不读 `data-themes`。
- **分段色域**：给每一段的 slide 设 `data-section="调试 · DEBUG"` + `data-accent="cinnabar"`，
  让 chrome 标签和强调色随段切换。一段一个 accent，守 60-30-10。

## 5. 逐页搭建（核心纪律）

**从模板里复制最接近的 `.slide` 块 → 替换内容**，保留 `.slide` 结构，不从零写版式（版式清单见 [layouts.md](layouts.md)）。

- **用 token，不用 hex**：颜色/圆角/阴影一律 `var(--…)`。
- **一页一个核心信息**；多于一个 → 拆页。
- 标题**陈述结论**，不是主题词（写「先验证再写代码」而非「关于验证」）。
- **数据必须真实可溯源**；没有真实数据 → 文字版式，绝不编数字 / 假图表（见 [anti-slop-checklist.md](anti-slop-checklist.md)）。
- 讲者备注 + 数据出处写进 `<div class="notes">…</div>`（放映按 `S` 看）。
- 中英混排：CJK 标题用 `--font-display`，数字/术语用 `--font-mono` 对齐；别给 CJK 加 `--track-wide`（那是给 eyebrow/拉丁标签的）。

## 6. 截图美化

产品/UI 截图放 `decks/<name>/images/`，HTML 用相对路径 `images/01-语义.png`，套 `.frame--browser`
+ 统一阴影。没图先用 `.frame__placeholder`（**不画假 UI**）。完整规则见 [screenshot-framing.md](screenshot-framing.md)；
需要重做/重绘截图走 [image-prompts.md](image-prompts.md)。

## 7. 逐页自检（必做闸门）

```bash
node scripts/validate.mjs decks/my-talk/index.html         # 纪律校验：封禁字体/硬编码hex/禁蓝/缺alt/缺备注
./scripts/render.sh decks/my-talk/index.html               # 逐页 PNG（自检，自动数页）
./scripts/render.sh decks/xhs/index.html png 720x1280      # 9:16 竖屏 PNG
```
`validate.mjs` 退出码：PASS / PASS-WITH-WARNINGS 为 0，FAIL（命中封禁字体）为 1。先过 validate，再看 PNG。
需本机有 Chrome/Chromium（否则浏览器 Cmd/Ctrl+P 打印 PDF）。逐页看 PNG，**对照
[anti-slop-checklist.md](anti-slop-checklist.md) 的「提交前逐页核对闸门」**：溢出 / 对比度 / 对齐 /
AI 味（标题装饰线 / 清一色卡片 / 紫渐变 / 禁用字体 / 蓝色 / 编造数字）。发现问题就改，改完重渲染。

## 7.5 调性动作（初稿后怎么调）

逐页自检后 deck 跑通了，但「感觉不对」时，按 impeccable 的三个动词定向调，别瞎改：

- **bolder（不够有主见）**：加大尺度对比（hero 标题往 110px+ / `.zh-mega` 推，正文压小，3–5× 跳差不是 1.5×）；选一个 hero cell 用 `card--accent` **单色 drench**；accent 更狠一点（落点更少但更显）。注意——bolder ≠ 加特效 / 渐变 / 发光，那是反 bold。
- **quieter（太吵 / 太满）**：accent 降饱和到 **70–85%**；减背景 accent 与装饰；压扁卡片层级（去多余边框 / 阴影，靠间距与字重分层）；缩小尺度跳差让页面更稳。保留 POV，别调成灰白通用款。
- **distill（一页塞太多）**：**一页一核心**，多于一个就拆页；砍重复信息（别拿标题复述引子）；copy **砍半再砍半**，主动语态、去口号。每个元素都要挣得它的位置。

## 8. 交付 / 导出

- **HTML 即交付物**：`open index.html` 或 `python3 -m http.server` 放映 / 投屏 / 发链接。全离线、自托管字体、零网络。
- **一键 PDF**：`./scripts/render.sh decks/my-talk/index.html pdf`（9:16 加 `720x1280`）→ 输出 `decks/my-talk/my-talk.pdf`。逐页 @2x PNG 合成、页面尺寸精确匹配比例、纯离线（仅本地 Chrome，无额外依赖）。
- **逐页 PNG**：`./scripts/render.sh <deck> png`。
- 需要**可编辑 PPTX**：把 HTML 交给下游 **ameng-ppt-design**（含 CJK 字体嵌入 + 原生图表）。本 skill 负责设计 / HTML / PDF / PNG，不内置 PPTX 导出，也不做平台分发。

---

## 小例子：一个 idea → 大纲 → 选了哪些版式

**idea**：「为什么先验证再开发」（15 min ≈ 10 页，16:9，旗舰 `industrial-paper`）。

| # | 叙事弧 | 内容 | 选的版式 | accent 段 |
|---|---|---|---|---|
| 1 | Hook | 标题 + terminal「shipped, not a demo」 | **cover**（标题全宽，下方 lead+终端 一行 + `.hl`） | ember |
| 2 | Hook | 「死于没人要，不是没做出来」 | **big-statement**（`.h1`+`.hl`） | ember |
| 3 | Context | 工具按这个顺序看最易懂 | **numbered-cards**（3× `card--num`） | cinnabar |
| 4 | Context | 42% 失败归因「没市场需求」（真实出处） | **data-hero** | cinnabar |
| 5 | Core | Pencil/Claude Design 截图对照 | **screenshot**（`frame--browser`） | mint |
| 6 | Core | 哪个钩子转化最高（真实数据） | **honest-bars** | mint |
| 7 | Shift | 先验证 vs 先开发 | **comparison**（右 `card--accent`） | cyan |
| 8 | Shift | 「Make something people want.」 | **quote**（`data-anim="blur"`） | cyan |
| 9 | Takeaway | 「现在，开始验证」 | **section-divider**（整页 accent） | ember |
| 10 | Takeaway | 把想法变成第一版行动 | **close / CTA**（左文右终端） | ember |

节奏检查：hero（1/4/8/9）与 non-hero（3/5/6/7）交替，无连续三页密集信息——通过。
