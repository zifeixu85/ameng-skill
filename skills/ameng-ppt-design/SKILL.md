---
name: ameng-ppt-design
description: >
  有设计主见的 HTML 演示文稿/PPT 生成器：把大纲/讲稿/想法做成全离线、可放映的静态 HTML 幻灯片，
  并内置「右上角悬浮工具栏」——✎ 编辑（点任意文字就地改，点「完成」自动存一个可恢复的版本，
  历史里带 diff 对比）+ ⤓ 导出（逐页截图拼装成 PDF / PPTX，保全部样式；PNG；完整自包含 HTML）。
  工业纸感 + 杂志/瑞士双风 + 叙事弧 + 反 AI 味纪律：OKLCH token 系统 + 5 主题 + 版式库 +
  16:9/Swiss + 自托管 distinctive 字体（禁 Inter/Playfair）+ 键盘放映 + 逐页 PNG 自检 +
  validate 纪律校验。产物是用户真看得见的 HTML，可放映、可就地编辑、可一键导出多种格式。
  当用户要「做 PPT / 幻灯片 / slides / deck / 演示 / 路演 / 分享稿 / pitch deck /
  技术分享」时触发。用户只给题目/想法时：先打开风格预览页 + 四道闸门编号选项让用户选，不静默开做；
  用户已给完整逐页大纲/讲稿/旧 deck 时走「快速通道」——默认主题 + 一句「想换回个编号」即直接开做，不再逐项盘问。
  做完默认启动本地服务并给出可访问网址。
  关键词：ppt / 幻灯片 / slides / deck / presentation / 演示文稿 / 演讲稿 / 路演 / pitch deck /
  keynote / 分享稿 / 瑞士风 / 杂志风 / HTML 演示 / 就地编辑 / 导出 PDF PPTX。
---

# ameng-ppt-design — 有设计主见的 HTML 演示生成器

> 作者 / Author: **A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

> ## ⛔ 开工协议（第一条回复先分流：信息已就绪→快速通道；信息不全→标准四闸门）
> 收到「做 PPT」请求后，**先判一件事**：用户是否已给出**能逐页落地的完整大纲 / 讲稿 / 每页内容 / 旧版 deck**？
> 按判断分两条路——**别再对已经写好大纲的用户做满四道盘问**，那是骚扰；也别对只给一句话的用户静默开做。
>
> ### 🅰 快速通道 —— 用户已把内容准备好了，别再逐项盘问
> **判定**：输入已能**逐页或接近逐页**映射出每页要点（大纲 md / 完整讲稿 / 逐页内容 / 可直接套的旧 deck），
> 不是只给一个题目或一句模糊想法。满足即走此路——**不列四道编号闸门，也不要「逐页大纲再点头」那一关**：
> - **内容 / 观众 / 页数**：从大纲推定，**不逐项问**。页数 = 大纲自然页数；需合并或拆页照做，但**在交付时说明**，绝不为塞内容偷砍。
> - **风格 + 主题色 + 比例**：默认 **industrial-paper · 主题默认色 · 16:9**。**用一句话**给选项（不开网页）：
>   「默认 industrial-paper / 16:9。**风格**想换报编号(1–5)；**主题色**想要可给色号或描述(如『商务』『暖橙』『森林绿』『#1E5AA8』)、或让我按你主题推荐一个，不说就用默认色——否则我直接开做。」
>   **说完直接开做，不停下死等**（换风格只改 `#theme-link`、换色重跑 resolve-accent 即可，成本极低、事后随时换）。
> - 仍写 `slides/<name>/intake.md`（用推定值填好，顶部标注「快速通道·依据用户大纲」），`node scripts/intake.mjs <name>` 仍要 **RESULT: OK** 才进 Step 2。
> - **质量闸门一个都不能省**：validate / check-overflow / 逐页 PNG / subagent 新鲜眼睛照跑（见 DoD）。快速的是「确认」，不是「质量」。
>
> ### 🅱 标准通道 —— 只给题目/一句话/模糊想法，信息不全必须先确认
> **第一条回复必须且只能**：①把下面五件事列成**编号选项** → ②**停下等回复**。不写大纲、不生成页面、不进 Step 2。
> - **⛔ 严禁打包确认**：把页数/风格/主题色/比例替用户定好、只让用户回一句「确认」= 违规。
> - **⛔ 严禁**静默决定页数、为塞内容而静默砍页/删内容。**主题色不许永远用默认**——必须把它作为一项让用户表态（可以选「默认」，但要让他知道能换）。
> - 确认完 → 给「逐页标题大纲」让用户**再点头一次** → 才动手。
>
> ### 两条路共用：选项怎么给（**不再强制开网页**）
> 颜色/风格用**编号文字**给，用户报编号即可；不必先 `open` 预览页。想看效果再 `open templates/theme-preview.html`（`1–5` 切主题、`D` 切明暗）——这是**可选**的，不是闸门。
> - **Claude Code**：用 `AskUserQuestion` 弹选项（页数 / 风格 / 主题色 / 比例 + 素材一问）。
> - **Codex / 其它宿主**（没有交互选项工具）：**按下面模板逐字给出**（措辞可润色，结构和选项不许少）：
> ```text
> 开工前确认几件事，直接回编号（例：「0 对 / 1B / 2A / 3 商务 / 4A / 5 无」）：
> 0. 内容&观众 —— 我的理解：「<一句话目标+受众>」，对吗？
> 1. 页数体量   A 精简~10页   B 标准~18–20页   C 详尽~28–30页   D 自定义N页
> 2. 风格主题   A industrial-paper 暖纸克制   B neo-brutalist 酸黄粗野   C editorial 杂志
>               D dark-luxe 暗调   E ink-wash 中式水墨   （想看效果可让我打开预览页）
> 3. 主题色     默认 / 给色号(#1E5AA8) / 给描述(商务·暖橙·森林绿·深蓝) / 让我按你主题推荐一个
> 4. 比例       A 16:9 演讲       B swiss 数据驱动
> 5. 图片素材   有要放进 PPT 的图/截图吗？有给路径，没有回「无」
> ```
> 标准通道里推荐项只许作为括号标注（如「推荐 C，依据你的大纲」），**不许替用户选**。
> 主题色非默认 → 跑 `node scripts/resolve-accent.mjs "<色号/描述>" --name <deck> --write` 生成 `accent.css`，在 deck `#theme-link` 后引入（见 [references/mood-palette.md](references/mood-palette.md)）。
> 答案写进 `slides/<name>/intake.md`（`node scripts/intake.mjs <name>` 生成+校验），**exit 0 才进 Step 2**。

把文本/大纲/想法做成**有设计主见、全离线、可放映**的静态 HTML 演示。
一个 OKLCH token 系统（`assets/base.css` + `assets/components.css`）+ 一个主题 = 一套外观；
一个版式块 = 一种页型。**始终从模板复制，不从零写。**

比普通 HTML deck 多两件事，都在**右上角悬浮工具栏**（默认只是一个低调的 `⋯` handle，hover 才展开；
随主题明暗自动变色；不占内容位）：

- **✎ 编辑** —— 点任意文字就地修改；点「**完成**」退出并**自动存一个版本**（localStorage，刷新仍在）；「**历史**」里带 **diff 对比**，可一键恢复。**升级源 HTML 后是逐页智能合并**：你在源文件里改过的页以文件为准，**没改过的页保留你在浏览器里的编辑**——不会因为一次升级把你手动改的内容整份冲掉。
- **⤓ 导出** —— **逐页截图→拼装**：**PDF**（jsPDF）/ **PPTX**（每页整图）保全部样式 · **PNG**（当前页 / 全部 zip）· **HTML**（样式字体内联，完整自包含）。

## 给你什么

- **OKLCH token 设计系统**：`base.css`（tokens + slide 原语 + 行内高亮带 `.hl` + film grain + 分段 accent 色域）+ `components.css`（编辑式 chrome / terminal / 截图框 / 编号卡 / Swiss Data Hero / 离线背景）
- **5 套差异化主题**（`assets/themes/*.css`，**不是换皮**——排版/构图/密度/装饰/气质都不同，见 [references/themes.md](references/themes.md)）：**`industrial-paper`（旗舰：暖纸 + grain + 软色带，中密度）** · `neo-brutalist`（粗野：**酸黄×黑** + 硬投影 + 实心色块，零圆角）· `editorial`（杂志：衬线 + 疏朗 + 首字下沉 + 细下划线）· `dark-luxe`（暗调：渐变底 + 毛玻璃 + 暖金辉光）· `ink-wash`（中式水墨：宋体 + 朱砂红 + 留白 + 印章式标签 + 一角墨晕）
- **两种比例/模板**：`ppt-16x9.html`（旗舰）· `ppt-swiss.html`（瑞士数据风）· `layouts-gallery.html`（版式目录）
- **右上角工具栏**：`assets/editor.js`（就地编辑 + 本地保存 + 版本历史）+ `assets/export.js`（PDF/PPTX/PNG/HTML 导出）+ `assets/toolbar.css`
- **自托管 distinctive 字体**：Bricolage Grotesque（display）/ Host Grotesk（body）/ JetBrains Mono（mono）+ 思源黑/宋（CJK）。`scripts/fetch-fonts.sh` 一次性下载 → 之后全离线。**禁 Inter/Roboto/Playfair/Cormorant/IBM Plex**。
- **键盘放映运行时**（`runtime.js`）：← → / Space / F 全屏 / S 讲者备注 / O 缩略图总览（每页等比实拍预览，非文字列表）/ T 浅色⇄深色 / **G 安全区参考线+溢出哨兵** / ? 帮助 / `#/N` 深链
- **演讲者套件**（v2，`P` 键）：双屏 presenter view——按 `P` 本窗变演讲者控制台（当前/下一页缩略 + `.notes` 大字提词可就地编辑 + 排练计时正/倒 + 配速绿黄红灯），同时自动弹 `?audience` 纯净观众窗投屏，两窗 BroadcastChannel 实时同步翻页/主题（弹窗被拦自动降级单窗）。`V` 切视图布局（当前大/下一页大/仅一屏）· `R` 重置计时 · deck 标 `data-target-min="20"`（页级 `data-sec`）启用配速。**双屏需 http://（serve.sh），file:// 无法双窗同步**；presenter 任何导出产物零残留
- **选风格预览页**：`templates/theme-preview.html` —— **一上来就 `open` 给用户选 5 套主题**（通用 demo 内容，不依赖脚手架，`←→`/`1–5`/`D` 实时切）。
- **纪律工具**：`scripts/render.sh`（逐页 PNG / 像素级 PDF）· `scripts/validate.mjs`（文本纪律：封禁字体/硬编码 hex/禁蓝/缺 alt/缺备注/高亮对比/emoji 当图标）· **`scripts/check-overflow.mjs`（几何闸门：headless 量每页每元素 vs 安全区，越界 exit 1）**

## 四道闸门细则（呈现方式见顶部《开工协议》——快速通道里这四项改为「依大纲推定」，不逐项盘问）

**先读/填 [references/design-direction.md](references/design-direction.md)**：品牌人格、反参考、配色（单 accent 60-30-10、**禁蓝**默认）、封禁字体、构图、设计原则。每份演示都要有声明的方向。

- **内容 & 观众 & 素材**：一句话目标 + 受众；**必问有无图片/截图素材**（有 → 走 [references/image-handling.md](references/image-handling.md) 流水线；无 → intake 记「无」，正文用图形原语/诚实占位，不硬配图）。
- **页数体量**：档位可按「内容量 + 时长」推导推荐值，但仍要用户选。**内容塞不下所选页数时不许偷砍**——摆出取舍让用户定：「A 合并这几节 / B 提到 X 页 / C 砍掉某节」。
- **风格主题**：只用通用预览页选（**不做"按真实内容生成预览"**——别为选主题先脚手架）。5 套速记（默认 `industrial-paper`）：要态度→`neo-brutalist`；叙事/品牌→`editorial`；夜场/发布→`dark-luxe`；中式/雅致→`ink-wash`。**绝不因为选项列不下就藏掉某套或跳过预览页。**
- **比例**：16:9（演讲）/ swiss（数据驱动）。

**可见自检**：`node scripts/intake.mjs <name>` 首次生成 `slides/<name>/intake.md` 模板，填好后再跑一次——缺项 exit 1，齐全 RESULT: OK。**不 OK 不进 Step 2。** 它把闸门变成可检查的文件，而不是靠记性。

## 硬规格卡（版面契约，违反任何一条 = 未完成）

| 项 | 规格 |
|---|---|
| 舞台 | 固定 1280×720；安全区 **y∈[85,636]**；溢出 = 未完成（闸门会 FAIL） |
| 字号/间距 | 只用 token（`cqw` 锚定舞台）；**禁 vw/vh** 排版 |
| 颜色 | 只用 `var(--token)`；**禁蓝**；单 accent 60-30-10；禁纯黑纯白 |
| 实色块 | 全场一色 `--accent-block` + 反白 `--accent-block-ink`；块内**禁手动设色** |
| 组件 | 只用库内组件（模板可拷实例）；**⛔ 自造 `<style>` 组件类** |
| 版式 | 每页标 `data-layout`（[layouts.md](references/layouts.md) 词汇）；相邻页尽量换（**同结构系列页可重复**，闸门只在连续≥3页同版式时轻提醒）；全 deck ≥6 种；卡片网格(numbered-cards/bento/grid) ≤1/3——**validate 多样性闸门查** |
| 图形 | 每页先判内容形状（diagrams.md 决策表）；内容页带图形 ≥40%；卡片行页 ≤1/3；图表必挂 fx |
| 文案 | 密度三档预算（layouts.md）；eyebrow ≤3；「不是…而是…」≤2；禁 buzzword / emoji 图标 |
| 图片 | 必走 image-handling.md：先看图 → cover/contain 对主体 → 成片可读（字高 ≥11px） |
| 备注 | 每页 `<div class="notes">` 讲者备注 |

## 完成定义 + 交付协议（DoD · 做完必须全部满足）

1. `node scripts/validate.mjs <deck>` → **RESULT: PASS**（WARN 也要修，见 Step 5）
2. `node scripts/check-overflow.mjs <deck>` → **RESULT: PASS**（溢出 + 渲染对比度）
3. `./scripts/render.sh <deck>` 逐页 PNG → **派一个 subagent 当「新鲜眼睛」看这批 PNG**（见 Step 5 末）：机器闸门只抓机械违规，抓不到「这页就是丑」。
4. **启动本地服务并把网址交给用户**：`./scripts/serve.sh <name>` —— 起/复用 http 服务、打印 URL、能 open 就帮用户打开浏览器。**这步不做，等于没交付。**
5. **交付话术照此结构说**（宿主无关）：
   ```text
   deck 已完成并启动 → http://localhost:8123/slides/<name>/index.html
   放映 ←→/F · 就地编辑 ✎ · 导出 ⤓（PDF/PPTX/PNG —— 必须从这个 http:// 地址导，file:// 会缺字少图）
   上台演讲：按 P 开演讲者视图（提词/计时/配速 + 自动弹观众窗投屏，两窗同步翻页）
   已过三道闸门：文本纪律 PASS · 溢出/对比度 PASS · 逐页 PNG 目检。
   要发给别人或长期保存：./scripts/eject.sh <name> <目标目录> —— 自包含文件夹，
   内含 serve.command（双击即起服务并打开）。
   ```

## 工作流

### Step 0 · 一次性装字体（可选）
```bash
./scripts/fetch-fonts.sh          # 下载 distinctive woff2，之后全离线（不跑也能用：优雅回退系统 CJK 栈）
```

### Step 1 · 叙事弧 + 节奏
用叙事弧排页：**Hook → Context → Core → Shift → Takeaway**；hero 页与普通页交替。详见 [references/authoring-guide.md](references/authoring-guide.md)。

### Step 2 · 脚手架（先过 intake 闸门）
```bash
node scripts/intake.mjs my-talk       # 必须先 RESULT: OK（标准通道=用户确认过；快速通道=依大纲推定填好）
./scripts/new-ppt.sh my-talk 16x9     # 或 swiss → 生成 slides/my-talk/index.html
./scripts/serve.sh my-talk            # 立即起本地服务 + 给用户 URL（用户可全程看着长出来）
```

### Step 3 · 应用已选主题 + 分段色域
主题在**最开始的闸门③就已让用户看着 `templates/theme-preview.html` 选定**（不在这里才选）。这一步只是**把选定的主题接进模板**：在模板里把 `#theme-link` 指到对应 `assets/themes/<name>.css`；放映时 `T` 键在该主题浅/深之间切换。给每段设 `data-section` + `data-accent`，chrome 自动跟随切色域。见 [references/themes.md](references/themes.md)。
（5 套主题的静态预览图见 `screenshots/`，README 里有画廊。）

### Step 4 · 逐页搭建（核心规则）
- **先做内容预算再写**：按 [references/layouts.md](references/layouts.md) 的**密度三档**给每页定档（轻/中/重），每页文字量不超该档预算；**连续重密度页 ≤2**，重后接轻。装不进预算的细节**进讲者备注 `<div class="notes">`，不上屏**——内容是提炼，不是搬运。
- **从模板复制最接近的 `.slide` 块**替换内容，不从零写。版式见 [references/layouts.md](references/layouts.md)。
- **⛔ 严禁自造组件类**：不许在 deck 里写 `<style>` 造自己的卡片/流程/网格类（什么 `.my-flow`/`.am-card`）——自造类绕过 token、`--accent-ink` 自动反白、对比度与溢出护栏，是真实事故的头号来源。**库里没有的形状：先查 [references/diagrams.md](references/diagrams.md)（flow/funnel/matrix2/gauge/layers 都有了），再不行用现有原语拼**；deck 内联 `<style>` 只允许微调（间距/对齐），validate 会查超量自造。
- **每页先定整页版式并标 `data-layout`**（[references/layouts.md](references/layouts.md) 决策表 + 词汇）：先问这页要干什么 → 选版式（cover / big-statement / asym-split / flow / timeline / comparison / two-col / data-hero / image-hero…）→ 在 `<section class="slide">` 上标 `data-layout="…"`。**多样性铁律**：相邻页尽量换版式（同结构系列页可重复，闸门只在连续≥3页同版式时轻提醒）· 全 deck ≥6 种 · 卡片网格(numbered-cards/bento/grid) ≤1/3 · 卡片网格是兜底不是默认——validate 多样性闸门查，WARN 看情况处理（系列页可忽略）。
- **每页先判「内容形状」再搭**（[references/diagrams.md](references/diagrams.md) 决策表）：流程→`.flow`/`.evo`、转化→`.funnel`、定位→`.matrix2`、进度→`.gauge`、层级→`.layers`、对比→`.zones`、占比→`.donut`、趋势→`.linechart`、大数字→`.data-hero`。**流程/对比/层级绝不退化成"一排扁卡片+小箭头"**；相邻两页不用同一种图形；全 deck 纯文字卡片行页 ≤ 1/3。**每个图表挂入场 fx**（`.fx-grow-x`/`.fx-pop`/`.fx-dash`/`.anim-stagger`），不许静止。
- **用 token 不用 hex**；**禁蓝**（默认全场禁蓝）。
- **一页一个核心信息**；标题陈述结论。行内高亮带 `.hl` 只圈关键短语，全场一个 accent。
- **用户给了图片素材 → 必走 [references/image-handling.md](references/image-handling.md)**：拷进 `images/`、**每张图先用 Read 真的看一遍**（比例 / 主体位置 / 类型），再按决策树选 `.frame--cover`+`.obj-*`（照片，对准主体裁）或 `.frame--contain`+`--frame-bg`（信息图，留白不裁）。**禁拉伸变形、禁糊图放大、满版图压字必配遮罩。**
- 截图美化走 [references/screenshot-framing.md](references/screenshot-framing.md)；没图用 `.frame__placeholder`（不造假 UI）。
- **数据图守真实、概念图放开画**：数据图表（bars/donut/funnel/gauge/line/data-hero）数字必须真实可溯源，无数不画；但**流程/结构/对比/取舍这类没数据的内容也要画成概念图**（flow/zones/layers/matrix2…）增强张力，别误以为「没数据只能文字」。
- 讲者备注写进 `<div class="notes">`（`S` 看）。

### Step 5 · 自检（必做闸门，按顺序跑）
```bash
node scripts/validate.mjs slides/my-talk/index.html        # ① 文本纪律：封禁字体/硬编码hex/禁蓝/alt/备注/emoji/图形密度/自造style
node scripts/check-overflow.mjs slides/my-talk/index.html   # ② 渲染闸门：越界 or 文字对比度<3 → exit 1，必须先修
./scripts/render.sh slides/my-talk/index.html              # ③ 逐页 PNG，做最后的审美终检
```
> **⛔ validate 的 WARN 不是"可以不管"**——真实事故里 32 个 eyebrow、10 个「不是…而是…」全是带着 WARN 交付的。
> **交付标准：validate `RESULT: PASS`（最多带 ADVISORY）+ check-overflow `RESULT: PASS`。**
> 每条 WARN 要么修掉，要么向用户说明为什么保留并获得同意——没有第三种。
**溢出不再靠肉眼**——三道关：
- **结构预防**：密集页把内容包进 **`.slide__safe`**（`min-height:0`，让 grid/flex 子项压缩而非顶出去）；会变长的单行大标题/大数字用 **`.fit-text`**（运行时自动缩到不超宽）。
- **放映期哨兵**：浏览器里按 **`G`** 显示安全区参考线；任意页越界会自动画**红色虚线边界 + ⚠ 角标**（标出第几页、溢出多少 px、是哪个元素），并 `console.warn`。仅屏幕可见，导出/放映自动隐藏。
- **几何闸门**：`check-overflow.mjs` 用 headless Chrome 量**每一页每个元素** vs 安全区（含 nowrap 文字的 ink 溢出），精确报像素、**有越界就 exit 1**。**必须先通过它，再去看 PNG。**

> **⛔ check-overflow FAIL = 这份 deck 还没做完。** 看它报的「第几页、溢出多少 px、哪个元素」，**回去改那一页**（缩内容 / 拆两页 / `.slide__safe` 包起来 / 长单行用 `.fit-text`），**改完重跑，循环到 RESULT: PASS 才算完成。绝不把还在溢出的 deck 交付给用户。** 别只报告"有溢出"就停手——你要把它改到不溢出。

> **为什么过去会"用户看到溢出、闸门却没报"**：字号曾用 `vw`（视口单位），用户浏览器越宽字越大就越界，而闸门跑在固定 1280 看不到。**现在已改为 `cqw`（锚定 1280 舞台，见 base.css `.deck__stage{container-type}`）**——每个用户、导出件、闸门三者渲染完全一致，闸门报 PASS 就是真的不溢出。

安全区 = **y ∈ [85, 636]**（顶栏+页脚已避让）；固定 1280×720。最后逐页看 PNG，对照 [references/anti-slop-checklist.md](references/anti-slop-checklist.md)：对比度？AI 味？**有问题就改。**
**纯文字页先问"它是不是一张图"** —— 流程→stepper、对比→two-zone、放大的边界→scope bars、关系→inline SVG。图形原语与双钻/编排 SVG 见 [references/diagrams.md](references/diagrams.md)。

> **⛔ Step 5d · subagent 新鲜眼睛视觉 QA（交付前必做）**：三道脚本闸门只抓**机械违规**（溢出/对比度/封禁字体/自造类），抓不到**审美问题**（视觉拥挤、对齐歪、留白失衡、图文不搭、这页就是丑）。
> 所以渲染出 PNG 后，**派一个子代理（Task/Agent）当「没见过这份 deck 的新鲜眼睛」**，喂它逐页 PNG，只问一件事：
> 「逐页看，哪几页**视觉上别扭**？拥挤/对齐/留白/层级/图文匹配/这页比别页丑——指出页号和具体问题，不评论文案。」
> 把它指出的页**回去改**，再重渲。这是借自 anthropic 官方 pptx 的纪律：**别信自己第一遍的审视**。机器闸门 PASS ≠ 好看，这一步补的就是「好看」。

### Step 6 · 编辑 & 导出 & 交付
**按顶部《完成定义 + 交付协议》收尾**：三道闸门 PASS → `./scripts/serve.sh <name>` 启动并给 URL → 按交付话术告知用户。工具栏详情见下节。
**交付到项目文件夹**：deck 在 `slides/<name>/` 内靠 `../../assets` 相对路径才能跑；要把它移到项目/仓库里长期保存或发给别人，用 `./scripts/eject.sh <name> <目标目录>` —— 复制出一个**自包含**文件夹（自带 `assets/` + `images/`，并把 `../../assets/` 重写成 `assets/`），任意位置可开、可打包。

## 右上角工具栏（编辑 & 导出）

右上角**常驻**一排**低调的文字按钮**（`编辑 · 导出 · 全屏 · 历史`，**仅屏幕可见**，随明暗主题变色；放映/导出/打印时自动隐藏）。默认半透明、不抢内容，hover 变清晰。

### ✎ 编辑 → 完成（自动存版本）
- 点「编辑」进入编辑模式 → 标题/正文/标签等文字出现虚线框，**点进去直接改**。
- **讲者备注**：按 `S` 打开备注浮层，**直接点进去就能改**（默认可编辑、自动保存、放映时也按 `S` 看）。**备注会保留但不计入版本**（改备注不产生新版本）。
- 点「**完成**」：退出编辑 + **对「本次正文有改动的页」各自动存一个版本**；**恢复/回到已有内容不会重复生成版本**（去重）。`Esc` 同效。
- 「**历史**」：只列**当前页**的版本，**最早一条永远是「默认版本（初始）」= 版本 1**，往上是每次改动；每条**显示与上一版的文字差异（旧 → 新）**，可**恢复**（恢复内容时保留你当前的备注）或删除。「历史」按钮**仅当本页有 ≥2 个版本（即真改过）时**才显示数字角标。
- 编辑模式下方向键/空格/快捷键归文字光标所有，不会误翻页或触发放映快捷键。**编辑中切换页面**：若本页有未保存改动，会弹窗让你选「**保存并切换 / 丢弃修改 / 取消**」，不会偷偷带着未保存内容乱翻。
- 「**全屏**」：进入放映（点按手势，避开浏览器对 F 键全屏的限制；F 键依然可用）。**全屏=纯内容**：dock、快捷键提示、toast 全部隐藏。
- **逐页变更检测（防"刷新没更新" + 不丢手动编辑）**：编辑器加载时给**每一页**算一个内容签名（`sigOne`），和上次的基线逐页比对：
  - **某页在源文件里改了**（签名变了）→ 这页**以文件为准**（你让我升级的就是这些页）；
  - **某页源文件没改** → 这页**保留你在浏览器里点「编辑」改过的内容**。
  这样：在编辑器外直接改 HTML 再刷新，改过的页立刻更新；同时你手动编辑过、而本次升级没碰的页，**编辑不会被冲掉**。被覆盖的旧编辑仍留在该页「历史」里，可随时恢复。

> 编辑只动文字，不动结构/样式。要换版式仍是改 HTML。版本只存在本地，离线、不上传。

### ⤓ 导出（逐页截图 → 拼装，保全部样式）
导出统一走「**逐页激活后整页截图（modern-screenshot，OKLCH 保真），再拼装**」——
截的是**整个 stage**，所以背景/满版底色/高亮带/截图框/grain/**角标·小标题·页脚 chrome** 都进图，**一个都不丢**（不像浏览器打印会丢背景）：
- **PDF**：每页整图按精确比例合成（jsPDF）。
- **PPTX · 图片版**：每页一张满版整图（PptxGenJS）——放映/演示用最稳、最保真。
- **PPTX · 可编辑（分层版）**：每页拆成多个对象 —— ①**背景图**（页底色/分段色/grain）②**装饰图**（终端/截图框/图表等，**文字抽走**、透明底）③**顶部进度条**和**每个文字高亮色块各自单独成图**（便于在 PPT 里单独移动/替换）④**可编辑文字框**。所以**文字一律不切图、可在 PPT 里改**，装饰尽量还原（字体会被 PowerPoint 替换、个别位置可能略偏）。要 100% 保真用「图片版」，要改字用这版。
- **PNG**：当前页单张，或全部打包成 **zip**（JSZip）。
- **HTML（完整）**：把当前（含编辑）的演示导出成**自包含** `.html`——所有 CSS 内联、字体 base64 嵌入、**`<img>` 图片 base64 内联**、运行时内联，单文件独立打开即带全样式与图片、可键盘放映。

导出库**仓库已内置** `assets/vendor/`（committed，开箱离线可用，全 MIT）。要刷新/重装：
```bash
./scripts/fetch-export-libs.sh        # modern-screenshot + jspdf + pptxgenjs + jszip
```
> 注：浏览器导出在 `http://`（含本地服务器）下最稳；若直接 `file://` 双击打开，浏览器安全策略可能拦截截图/字体读取，
> 此时改用本地服务器（`python3 -m http.server`），或用 `scripts/render.sh` 出像素级 PNG/PDF。

## 纪律红线（anti-slop，完整见 references/）

- **只用 OKLCH**；**禁 Inter/Roboto/Playfair/Cormorant/IBM Plex**；字体自托管离线。
- **禁蓝**（默认）；**单 accent 60-30-10**；禁纯黑纯白。
- **两类图分治**（详见 [references/diagrams.md](references/diagrams.md)「两类图分治」）：
  - **数据图守真实**：`.bars`/`.donut`/`.funnel`/`.gauge`/`.linechart`/`.data-hero`/`.scope` 里的**数字必须真实可溯源**；无数 → 不画这类，不编数字、不造假数据图表。
  - **概念图放开画**：`.flow`/`.evo`/`.matrix2`/`.layers`/`.zones`/`.contrast`/关系 SVG 画的是逻辑/结构/取舍，**不需要数据**——**没数据的内容也鼓励画成概念图**增强张力，别堆成文字卡片。「无数据→只能文字」只管数据图，别误伤概念图。
- **严禁自造组件类**（deck 内 `<style>` 造 `.my-card`/`.am-flow` 之类）——绕过 token / 反白 / 对比度护栏；缺什么形状先查 diagrams.md，再用现有原语拼。
- **⚠ terminal 代码框 = 技术/代码主题专属签名**（英文 CLI，非技术受众看不懂）。只有「代码 / 开发 / DevOps / 技术产品」主题才用；**非技术主题**（美食/教育/营销/品牌…）一律换成大数字 / 金句 / 要点 / 配图 / 指标卡。**别给非技术 deck 的封面甩英文终端**（模板里 terminal 处已加注释提示）。
- 不加标题装饰线；阴影/圆角克制；统一圆角+统一描边+差异化填充。
- 大字号 scale 对比制造层级；**说清楚 > 好看**；不默认模板。

## 动画 / 动效（预期，别误以为"没动画"）

- **入场动画默认就有**：每页元素带 `data-anim`（`fade/rise/wipe/blur`）+ `.anim-stagger` 依次入场，**翻到该页时播放一次**。淡入上浮较克制，是有意的（演示不是网页广告）。
- **图表会"自己长出来"**：柱状图给 `.bar__fill` 加 **`.fx-grow-x`**（横向）/`.fx-grow-y`（纵向）；大数字/环形加 **`.fx-pop`**；SVG 流线 `.fx-dash`；idle 呼吸 `.fx-breathe`。**模板已示范**（16:9 柱状图 + swiss 折线/大数字）。新做图表记得挂上，别让它静止。
- **大数字会"滚上去"**：给数字元素加 `data-count="30000"`，翻到该页时从 0 滚到目标值再恢复原始排版（单位/样式不丢）；导出/审计/reduced-motion 下直接显示终值。
- **长截图会"自己滚"**：聊天记录/朋友圈长图用 `.frame--scroll`（见 image-handling.md）——放映时窗口内缓慢下滚，导出定格顶帧。
- **氛围 canvas 背景是 opt-in、默认关**：要 hero 动起来，给该页加 `.slide-fx data-fx="dot-field|contour"`（见 layouts.md），别全局乱开。
- **关键认知**：动画**只在「现场放映 / 浏览器看 HTML」时播**；**导出 PDF / PPTX / PNG 一律定格到结束帧**（刻意的，防止截到动画中途）。所以**交付的是 PDF/图片就看不到动效，要动效就发 HTML 或现场放映**。已内置 `prefers-reduced-motion` 降级与键盘可达性。

## 渐进式加载（按需读 references/）

- [design-direction.md](references/design-direction.md) — 品味锚点（先读/先填）
- [anti-slop-checklist.md](references/anti-slop-checklist.md) — 纪律闸门
- [design-system.md](references/design-system.md) — token + 组件完整清单 + 新建主题
- [themes.md](references/themes.md) — 5 主题何时用
- [layouts.md](references/layouts.md) — 版式与 helper class
- [diagrams.md](references/diagrams.md) — 把"纯文字"变图：stepper / scope / two-zone / contrast / 产品卡 / 头像·QR / 双钻·编排 SVG + 安全区纪律
- [authoring-guide.md](references/authoring-guide.md) — 叙事弧 + 完整流程 + 实例
- [image-handling.md](references/image-handling.md) — 用户图片素材：收图 → AI 看图判主体 → 比例适配（cover/contain + obj-*）
- [screenshot-framing.md](references/screenshot-framing.md) — 截图美化
- [image-prompts.md](references/image-prompts.md) — 配图/重做截图 prompt

## 文件结构

```
ameng-ppt-design/
├── SKILL.md / README.md
├── assets/
│   ├── base.css            (OKLCH token + slide 原语 + .hl + grain + 分段 accent + .slide__safe/.fit-text + 打印分页)
│   ├── components.css      (chrome / terminal / frame / card--num / data-hero / 背景)
│   ├── toolbar.css         (悬浮 dock / 编辑态 / 版本抽屉+diff / toast / 截图辅助)
│   ├── fonts.css + fonts/  (自托管 @font-face，无网络)
│   ├── runtime.js          (键盘放映 + fit + 备注 + 总览 + 切明暗 + chrome + 色域 + 溢出哨兵/审计 + fit-text)
│   ├── editor.js           (悬浮 dock + 就地编辑 + 完成自动存版本 + 历史 diff + 全屏)
│   ├── export.js           (逐页截图→拼装：PDF / PPTX / PNG / 完整 HTML)
│   ├── vendor/             (modern-screenshot + jspdf + pptxgenjs + jszip；MIT)
│   ├── fx-runtime.js + fx/ (opt-in Canvas 背景，默认关)
│   └── themes/*.css        (5 主题)
├── templates/              (ppt-16x9 / ppt-swiss / layouts-gallery)
├── scripts/                (intake.mjs / new-ppt.sh / serve.sh / eject.sh / fetch-fonts.sh / fetch-export-libs.sh / render.sh / validate.mjs / check-overflow.mjs / preview-themes.sh)
├── references/             (9 篇，按需加载)
└── slides/<name>/          (你生成的演示，含 images/；已 gitignore)
```

## 键盘速查
```
← → Space PgUp PgDn Home End  翻页   1–9 跳到第 N 页   0 / O 幻灯片缩略图总览（每页实拍预览）
F 全屏放映（自动隐藏所有操作 UI）  S 讲者备注  T 浅色/深色  G 安全区参考线+溢出检查
? / H 快捷键帮助   #/N 深链(render.sh 用它逐页导出)
```

## 中国可用性 & 安全
全离线：纯静态 HTML/CSS/JS + 自托管字体 + 本地 localStorage，无外部 API/CDN/凭证/数据外发。
`render.sh` 仅本地 headless Chrome；`fetch-fonts.sh` / `fetch-export-libs.sh` 仅一次性下载资源。

## License / 致谢
MIT © **A梦 (ameng)**。可自由使用、修改、分享，请保留署名。
内置 `assets/vendor/`（全 MIT）：[modern-screenshot](https://github.com/qq15725/modern-screenshot)、[jsPDF](https://github.com/parallax/jsPDF)、[PptxGenJS](https://github.com/gitbrent/PptxGenJS)、[JSZip](https://github.com/Stuk/jszip)。
部分反 AI-slop 规则借鉴 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）。
