# Design 相关 Skill 研究报告（前端/UI + 产品/UX）

> 生成日期：2026-06-02
> 搜索范围：skills.sh · ClawHub · GitHub（含 awesome 列表）· WebSearch
> 收集数量：共 **41** 个 Skill（已下载 SKILL.md 原件到本研究文件夹）

---

## 1. 研究设定

- **主题 / 关键词**：design 相关 skill，聚焦 **前端/UI 界面** + **产品/UX 设计**
- **产出模式**：research + 设计方案（输出到第 8 节，含自建/拆分 Skill 草案）
- **深度**：彻查（41 个，跨平台尽量收全去重）
- **目标 Agent**：不限（逐个标注 Claude Code / Codex / OpenClaw / Hermes 兼容性）
- **使用场景**：用户维护 `ameng-skill` 这个对外分享的 Claude Code 插件市场仓库（已有 `ameng-ppt-design`、`ameng-skill-scout`），日常做大量 web 前端，想盘点 design 赛道已有的 skill，并据此决定往仓库里加什么新 skill。

> 搜索关键词（中/英/缩写）：design · ui · ux · frontend · design system · wireframe · prototype · ui components · visual design · design review · tailwind · shadcn · landing page · 界面设计 · 原型 · 图文排版。详见附录。

---

## 2. 概览与统计

design 是 skill 生态里**最拥挤的赛道之一**：仅 ClawHub 一个平台，"frontend/ui/ux/design-system" 几个词就能搜出 100+ 条；skills.sh 上 `anthropics/skills@frontend-design` 单条 **48.7 万次安装**，是整个生态头部。本次按"前端/UI + 产品/UX"双方向彻查，收 41 个有代表性的样本（含头部高安装、官方出品、中文社区、产品/UX 方法论各路）。

**核心结论速览：**
- **绝大多数是 `guide-only`（纯方法论提示词）**，真正带自动化闭环（浏览器截图审查/出图）的是少数，且几乎都绑定特定工具链（gstack / jezweb / Playwright MCP / 付费 SaaS）。
- **"反 AI 味"（anti-slop）是这个赛道的共同母题**：禁 Inter/Roboto、禁紫色渐变、禁居中卡片网格、禁套路化 eyebrow，几乎每个头部 skill 都有一份"禁用清单"。
- **大量重复/下游改写**：`anthropics/frontend-design` 被反复 fork/翻译/换皮；`ui-ux-pro-max`、`impeccable` 各有多个衍生版。
- **中文工程级精品稀少**：`binggg/ui-design-guide`（腾讯 CloudBase）和 `contsun/prototype-design` 是中文方向两个真正"有工程闭环"的亮点。
- **产品/UX 侧全是 guide-only**：persona / journey-map / 行为设计等都不产出真实文件，停在"对话顾问"层。

| 下载来源 | 数量 |   | 格式（_source 标注） | 数量 |
|-----|------|---|------|------|
| GitHub | 34 |   | universal（纯 SKILL.md，跨宿主） | 27 |
| ClawHub | 7 |   | claude-code（路径/字段绑定 CC） | 7 |
| skills.sh（发现入口，多数实体在 GitHub） | — |   | openclaw（ClawHub 社区） | 7 |

> 说明：skills.sh 是主要"发现入口"，但绝大多数实体仓库托管在 GitHub，故按"实际下载来源"统计为 GitHub 34 / ClawHub 7。

---

## 3. Skill 清单与分类（总表）

> **Agent 兼容**：CC=Claude Code · Codex · OC=OpenClaw · Hermes · 全=universal（任意宿主）
> **类型**：guide=guide-only · script=script-bundled · api=api-dependent · browser=browser-automation · hybrid
> **复杂度**：即用 / 需配置 / 需开发

### A. 前端/UI 生成（设计主见 + 反 AI 味）

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 1 | anthropics-frontend-design | universal | 全 | guide | 无 | 即用 | safe | **赛道旗舰/事实标准**，48.7w 安装；一页"反 AI slop"美学宪法 |
| 2 | akhilbhima-frontend-design | universal | 全 | guide | 无 | 即用 | safe | **几乎逐字复制 #1**，仅多一节 monochrome-editorial preset |
| 3 | pbakaus-impeccable | universal | 全(CC最佳) | hybrid(script) | 无 | 需配置 | safe | 重型旗舰：21 命令 + PRODUCT/DESIGN.md + 调色脚本 + live 模式 |
| 4 | antonia-frontend-design-pro | openclaw | 全 | guide | 无 | 即用 | safe | impeccable 的**中文极简口袋版**（一页规范 + 11 命令） |
| 5 | binggg-ui-design-guide | openclaw | 全 | guide | grep 自检 | 即用 | caution | 腾讯 CloudBase 出品，**强制规范契约 + grep 自检**，中文标杆 |
| 6 | leonxlnx-design-taste-frontend | universal | 全 | guide | 无 | 即用 | safe | 最"工程化"反 AI 味方法论：三刻度盘 + 79 项 Pre-Flight |
| 7 | wholiver-swiftui-design | universal | 全 | guide | 无 | 即用 | safe | SwiftUI 版"反 slop 宪法" + 量化验收门槛 |
| 8 | microsoft-frontend-design-review | universal | 全 | guide | 无 | 即用 | safe | 官方出品但纯指南：三支柱框架，**自动化为零** |

### B. UI/UX 综合体系（规则库 + 工作流）

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 9 | nlb-ui-ux-pro-max | claude-code | 全(脚本需Py) | hybrid(script) | 本地检索 | 需配置 | safe | **99 条 UX 规则 + 检索式知识库**，密度极高（脚本未随附） |
| 10 | xobi667-ui-ux-pro-max | openclaw | OC/全 | hybrid | 本地脚本 | 即用 | safe | #9 的**下游精简移植**（自承 "upstream"），多栈宿主中立 |
| 11 | shubhamsaboo-ux-designer | universal | 全 | guide | 无 | 需配置 | safe | hub+spoke 全流程 UX + Worked Example（spoke 文件未随附） |
| 12 | nlb-ui-styling | claude-code | CC最佳 | hybrid(script) | npx shadcn | 需配置 | caution | claudekit 套件：shadcn+Tailwind 实操脚手架 |

### C. 设计系统 / Design Token

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 13 | nlb-design-system | claude-code | CC最佳 | hybrid(script) | token生成+取图 | 需配置 | caution | claudekit：token + slide 双引擎（取图联网 Pexels/Unsplash） |
| 14 | wshobson-design-system-patterns | universal | 全 | guide | 无 | 即用 | safe | token 三层架构概念纲要（worked example 在未附 references） |
| 15 | owl-design-token | universal | 全 | guide | 无 | 即用 | safe | 极简但扎实的 token 知识卡（不自动生成 tokens.json） |
| 16 | arvindrk-extract-design-system | universal | 全 | script+browser | Playwright | 需配置 | caution | **从公开网站逆向抽 token**（npx + Playwright Chromium） |
| 17 | lenny-design-systems | universal | 全 | guide | 无 | 即用 | safe | 播客嘉宾洞见提炼的"何时该做设计系统"咨询话术 |

### D. 框架专精（shadcn / Tailwind / React / 动效）

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 18 | shadcn-shadcn | universal | 全(CC最佳) | script | npx shadcn CLI | 需配置 | safe | **官方 shadcn skill**：组件注册表 + 严格组合规则 |
| 19 | beagle-shadcn-ui | claude-code | 全 | guide | (可选CLI) | 即用 | safe | shadcn 代码模式"权威小抄" + CLI 安全 Gates |
| 20 | beagle-review-frontend | claude-code | CC最佳 | hybrid(编排) | git/lint | 需配置 | safe | React 审查 orchestrator（重度依赖同仓兄弟 skill） |
| 21 | wshobson-interaction-design | universal | 全 | guide | 无 | 即用 | safe | 微交互/动效代码库 + 时长分级 + 缓动常量 |

### E. 设计审查 / 评审（含浏览器自动化闭环）

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 22 | garrytan-design-review | claude-code | CC(强绑gstack) | hybrid+browser | gstack browse 截图 | 需配置 | caution | **体量/自动化最重**：审→修→截图复验→原子提交闭环 + AI Slop 评分 |
| 23 | garrytan-design-consultation | claude-code | CC(强绑gstack) | hybrid+browser | 竞品截图+出图看板 | 需配置 | caution | 顾问式设计系统提案 + SAFE/RISK 框架 + 反收敛字体纪律 |
| 24 | garrytan-design-html | claude-code | CC(强绑gstack) | hybrid+browser | vision抽规范+视口截图 | 需配置 | caution | 设计稿→Pretext 真排版 HTML（CDN 拉第三方 JS 风险点） |
| 25 | jezweb-design-review | claude-code | CC | browser | Chrome/Playwright MCP 截图 | 需配置 | caution | 7 维 good/bad 截图取证审查（截图能力外包 MCP） |
| 26 | jezweb-design-loop | claude-code | CC | hybrid+browser | 截图验证 + 可选 Stitch API | 需配置/开发 | caution | **baton 自主循环建站** + 三文件设计记忆 + 双断点截图 |
| 27 | 52yc-screenshot-ux-auditor | openclaw | OC | script | 用户上传截图 | 需配置 | caution | 截图→结构化 UX 审查（被动收图，不自抓；脚本未随附） |
| 28 | tommygeoco-ui-audit | openclaw | 全 | guide | 无 | 需配置 | safe | UX 决策方法论库 + JSON 报告 schema（32 references 未随附） |
| 29 | owl-design-critique | universal | 全 | guide | 无 | 即用 | safe | 设计评审主持剧本（会前/会中/会后 + 反馈话术模板） |
| 30 | owl-accessibility-audit | universal | 全 | guide | 无 | 即用 | safe | WCAG 2.2 审计模板（纯目测，无 axe-core 自动化） |
| 31 | vercel-web-design-guidelines | universal | 全(需WebFetch) | guide | 拉取最新规范 | 即用 | safe | 每次审查前 WebFetch 拉 Vercel 最新 Web Interface Guidelines |

### F. 产品 / UX 研究

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 32 | owl-user-persona | universal | 全 | hybrid(软依赖) | 可选读文件/搜索 | 即用 | safe | **基于真实数据**做行为型 persona + 标注研究缺口 |
| 33 | owl-journey-map | universal | 全 | hybrid(软依赖) | 可选读 persona | 即用 | safe | 旅程地图 + 情绪曲线 + 机会点排序（与 #32 配套） |
| 34 | lenny-behavioral-product-design | universal | 全 | guide | 无 | 即用 | caution | 行为科学落地（自带反暗黑模式伦理护栏） |
| 35 | lenny-design-engineering | universal | 全 | guide | 无 | 即用 | safe | "设计工程"职能定义（偏 leader 决策，内容略薄） |
| 36 | alsoforever-product-design-gungun | openclaw | 全 | guide | 无 | 即用 | safe | 中文产品设计方法论速查（KANO/RICE/双钻，重方法轻执行） |

### G. 原型 / 移动端 / 图像驱动

| # | 名称 | 格式 | 兼容 | 类型 | 自动化 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|--------|------|------|
| 37 | mattpocock-prototype | universal | 全 | guide | 无 | 即用 | safe | 一次性原型路由（逻辑/UI 二分，用完即删） |
| 38 | mattpocock-design-an-interface | universal | CC(需sub-agent) | guide(编排) | 并行子Agent | 需配置 | safe | "设计两遍"：并行多 Agent 各带约束再比较（**已 deprecated**） |
| 39 | contsun-prototype-design | openclaw | OC(需agent-browser) | hybrid+browser | py同步+截图验证 | 需配置 | caution | **中文 B 端单页 HTML 原型工作流**（抗 compaction 记忆术，设计系统目录未随附） |
| 40 | sleek-design-mobile-apps | universal | 全(需key) | api | REST + 渲染 | 需配置 | caution | **唯一端到端真出图**：付费 SaaS 封装（智能在云端） |
| 41 | leonxlnx-imagegen-frontend-web | universal | 需图像生成宿主 | hybrid(image-gen) | 文生图 | 需配置 | safe | 图像生成驱动网页视觉 comp（每 section 一张独立横图） |

---

## 4. 详细分析（按价值/代表性精选 + 其余归并）

> 41 个全部已下载，以下对最具代表性的逐个展开；同质化的衍生版归并说明。

### 4.1 anthropics-frontend-design（旗舰 / 事实标准）
- **来源**：github.com/anthropics/skills · skills/frontend-design
- **格式 / 兼容**：universal，任意宿主即用；无工具/脚本/MCP 依赖
- **类型 / 自动化 / 复杂度**：guide-only · 无 · 即用
- **安全**：safe（纯文本，无凭证/网络/注入）
- **能力覆盖**：① "先定 BOLD 美学方向再写代码"的设计思维框架；② 排版/色彩/动效/空间构图/背景质感五维美学准则；③ 一份"禁用清单"（禁 Inter/Roboto/Arial、禁白底紫渐变、禁套路布局、禁跨次生成都收敛到 Space Grotesk）；④ "复杂度匹配美学愿景"原则。
- **依赖项**：无
- **可复用价值**：整个赛道的"母版"。它确立了 design skill 的基本范式：**用强措辞的禁用清单 + 美学方向承诺，把"好设计"约束进 LLM**。`ameng-ppt-design` 已经在用同源思路（禁 Inter/Playfair）。
- **一句简评**：极简、即用、影响力最大，但只是"原则"，无审查闭环、无落地脚本。

### 4.2 pbakaus-impeccable（重型工程化旗舰）
- **来源**：github.com/pbakaus/impeccable（⭐3k）· .claude/skills/impeccable
- **格式 / 兼容**：universal frontmatter，但 Setup 强制 `node scripts/context.mjs`、`palette.mjs` 等本地脚本 → **CC 最佳**；其余宿主能跑指南但脚本/reference 子文件需随仓库
- **类型 / 自动化 / 复杂度**：hybrid（guide + 脚本 + live 浏览器迭代）· 调色/上下文脚本 · 需配置
- **安全**：safe（`allowed-tools: Bash(npx impeccable *)` 限定；脚本本地无外传）
- **能力覆盖**：① 21 个动词命令（craft/shape/audit/critique/polish/bolder/quieter/distill/animate/colorize/typeset/layout/delight/clarify/adapt/optimize/live…）；② PRODUCT.md + DESIGN.md 项目上下文持久化 + register（brand vs product）分流；③ 极细颗粒的设计硬规则（对比度 ≥4.5:1、行长 65–75ch、字体 ≤3、hero clamp ≤6rem、z-index 语义层级、禁 em dash、禁 buzzword）；④ "Absolute bans"（side-stripe border、gradient text、glassmorphism 默认、hero-metric 模板、相同卡片网格、每节 eyebrow）；⑤ 二阶 AI slop 测试。
- **依赖项**：Node（.mjs 脚本）+ 同仓 reference/*.md（命令细则）
- **可复用价值**：**最值得偷师的"命令体系 + 项目上下文 + 极细硬规则"范式**。它把 anthropics 的"原则"升级成"可执行命令 + 可勾选规则 + 跨会话上下文"。
- **一句简评**：赛道里最完整的工程化方案，但重、绑 Node 脚本与 reference 子文件。

### 4.3 binggg-ui-design-guide（中文工程级标杆）
- **来源**：clawhub.ai/skills/ui-design-guide（腾讯 CloudBase cloudbase-skills，作者 binggg）
- **格式 / 兼容**：openclaw，核心规范宿主无关即用；联动 sibling skill 需 CloudBase 套件或联网
- **类型 / 自动化 / 复杂度**：guide-only + **grep 自检** · 提交前用 grep 扫自己代码 · 即用
- **安全**：caution（正文指示去 cnb.cool 拉外部 raw URL，有远程内容拉取面）
- **能力覆盖**：① **强制"先出 DESIGN SPECIFICATION 再写代码"契约**；② 极严禁用清单（禁紫/靛/品红渐变、禁 Inter/Roboto/system-ui、禁 emoji 图标、禁居中卡片）；③ 11 种美学方向按场景推荐；④ **"TRIGGER WORD DETECTOR" 自我刹车 + 提交前 grep 五项自检**（颜色/字体/图标/布局/合规）；⑤ brand escape hatch（已有品牌时允许覆盖默认禁令）。
- **依赖项**：兄弟 skill + checklist.md（本地未附）
- **可复用价值**：**中文场景最值得借鉴的一份**。"规范契约 + 禁用清单 + grep 自检闭环"是把反 AI 味做成可机械执行的成熟范式——这正是 guide-only skill 升级到"有闭环"的关键一跳。
- **一句简评**：工程级反 AI 味中文 UI 规范，grep 自检是灵魂。

### 4.4 leonxlnx-design-taste-frontend（最系统的反 AI 味方法论）
- **来源**：github.com/leonxlnx/taste-skill · skills/taste-skill（1206 行）
- **格式 / 兼容**：universal，全宿主即用（图像生成为可选增强）
- **类型 / 自动化 / 复杂度**：guide-only · 无（可选环境图像工具）· 即用
- **安全**：safe
- **能力覆盖**：① "Design Read"先读需求再动手；② **三刻度盘系统**（DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY，基线 8/6/4）驱动所有决策；③ Brief→真实设计系统映射（何时用官方 Fluent/Carbon/Polaris/shadcn）；④ 海量可机械执行的反 AI 味规则（禁 em-dash、eyebrow 限额 = ⌈节数/3⌉、禁假截图 div…）；⑤ **79 项 Pre-Flight Check 清单** + 3 个 canonical 代码骨架 + Redesign 协议。
- **可复用价值**：把"好品味"量化成刻度盘 + 布尔判定 + 可勾选清单，是想做"可验证设计纪律"的金矿。
- **一句简评**：纯 guide 却即插即用，工程化程度行业天花板。

### 4.5 garrytan-design-review / consultation / html（gstack 设计三件套）
- **来源**：github.com/garrytan/gstack（Garry Tan 相关）· design-review(1935行) / design-consultation(1564行) / design-html(1452行)
- **格式 / 兼容**：标称 universal，**实际 Claude-Code-first 且强绑 gstack 私有 CLI**（`~/.claude/skills/gstack/bin/*` + 自研 `browse` 浏览器 + 可选 `design` 二进制）；缺 gstack bin 在其它宿主基本跑不起
- **类型 / 自动化 / 复杂度**：hybrid + **browser-automation** · gstack `browse`（headless 或 CDP 接管真实浏览器）截图取证 / `design`（GPT-4o vision + 出图比较看板）· 需配置（首次 `./setup` 编译，带 bun SHA256 校验）
- **安全**：caution。发现：① preamble 大量 `eval "$(...)"` 动态求值 + 写遥测 jsonl；② **CDP 模式可接管带登录态的真实浏览器并截图落盘**（主要泄露面）；③ design-html 缺 vendor 时从 esm.sh CDN 拉第三方 JS 内联进产物（无 SRI）。正向：bun 校验、`codex exec -s read-only` 沙箱、修复阶段"风险>20% 停 + 硬上限 30 + 回归即 revert"。
- **能力覆盖**：
  - **design-review**：11 阶段审查 + 审→修→截图复验→原子提交闭环；双评分（Design Score A–F + 独立 AI Slop Score）+ baseline JSON 回归；招牌 AI Slop 黑名单（11 条）+ Landing/App 分类套不同规则 + Trunk/Squint/Page-Area Test；可选 Codex "outside voices" 多模型评审。
  - **design-consultation**：顾问式 6 阶段出**完整连贯设计系统**；**SAFE/RISK 框架**（品类基线安全选择 + ≥2 个刻意冒险点）；反收敛字体纪律（黑名单 + 过度使用名单含 Space Grotesk）；浏览器比较看板 + 轮询 feedback.json 人在环选型；DESIGN.md 落盘 + 跨会话 taste-profile。
  - **design-html**：mockup→vision 抽 JSON 规范→分 5 tier 选 Pretext 排版策略→生成→三视口截图自检→人在环外科精修；产物带 contenteditable 就地编辑。
- **可复用价值**：**全赛道方法论密度最高**。客观提取设计系统（注入 JS 实测字体/色/层级）、AI Slop 黑名单字面化、商誉水位量化、SAFE/RISK 框架、截图取证 + baseline 回归、审→修→复验安全闭环——每一项都是顶级范本。
- **一句简评**：真正"审查即修复"的工程闭环，但深度绑 gstack 工具链，可移植的是方法论而非整包。

### 4.6 jezweb-design-loop（自主循环建站 + 截图验证）
- **来源**：github.com/jezweb/claude-skills · plugins/frontend/skills/design-loop（527 行）
- **格式 / 兼容**：`compatibility: claude-code-only`，强依赖 Bash + 文件读写；截图验证需 Playwright CLI 或 Chrome MCP（可选）；可选 Google Stitch API
- **类型 / 自动化 / 复杂度**：hybrid（autonomous loop + browser 验证 + 可选 api）· `npx serve` + 1280/375 双断点截图 · 需配置/开发
- **安全**：caution（自主续跑循环 + 网络外呼 + 读 `STITCH_API_KEY` env）
- **能力覆盖**：① **baton 接力棒模式**（一轮一页、自动写下一任务保活）；② 三文件长期记忆协议（SITE.md / DESIGN.md / next-prompt.md）；③ 双生成后端（Claude 默认 / Stitch 高保真）；④ 截图视觉验证闭环；⑤ 跨页防 drift（header/footer 逐字复制）+ 模糊词→专业术语映射。
- **可复用价值**：**想自建"自动化前端流水线"的最佳参考**——baton 自主循环 + 三文件设计记忆 + 截图自检闭环。
- **一句简评**：本批最"重"也最有料的自动化样本。

### 4.7 nlb-ui-ux-pro-max（UX 规则库密度之王）
- **来源**：github.com/nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/ui-ux-pro-max（658 行）
- **格式 / 兼容**：claude-code；`--design-system`/`--domain` 靠 `scripts/search.py` + CSV（未随附）→ 缺脚本退化为纯 checklist
- **类型 / 自动化 / 复杂度**：hybrid（guide + 本地 Python 检索）· 无网络 · 需配置
- **安全**：safe（全本地）
- **能力覆盖**：① **10 优先级 × 99 条 UX 规则**（无障碍/触控/性能/版式/动效/表单/导航/图表）；② 50+ 风格、161 配色、57 字体配对、161 产品类型、25 图表类型检索库；③ `--design-system` 一键出含 anti-pattern 的完整系统并 `--persist` 成 MASTER.md + 页面 override；④ 强偏 App/移动端（iOS HIG + Material）。
- **可复用价值**：99 条 UX 规则 + 优先级分层 + MASTER.md 持久化模式可直接抄。
- **一句简评**：知识密度极高，但完整能力依赖未随附的 Python 脚本 + CSV。

### 4.8 owl-listener 设计体系（产品/UX 全景）
- **来源**：github.com/owl-listener/designer-skills（design-ops / design-research / design-systems 三大子目录，共 30+ 个 skill，本次取 5 个代表）
- **格式 / 兼容**：universal，全宿主即用；persona/journey 用 `$ARGUMENTS` + 可选读文件/联网（CC 类宿主最顺）
- **类型 / 自动化 / 复杂度**：guide-only（persona/journey 为软依赖宿主能力的 hybrid）· 无真实产出脚本 · 即用
- **安全**：safe
- **能力覆盖**：① **user-persona**：基于真实研究数据做 2–4 个行为型 persona（引 Cooper《About Face》）+ 标注研究缺口；② **journey-map**：5–7 阶段旅程 + 情绪曲线 + 机会点影响/可行性排序（与 persona 成"产出→消费"配套）；③ **design-token**：三层分级 + 命名 pattern；④ **accessibility-audit**：WCAG 2.2 POUR + 4 级严重度 + Issue 模板；⑤ **design-critique**：评审主持剧本 + "I notice/I wonder/What if" 反馈话术。
- **可复用价值**："单一职能 + 固定字段模板 + 可串联流水线"是产品/UX 方向最干净的架构范本。
- **一句简评**：颗粒细、纯指南、零依赖；短板是不产出真实文件（a11y 全靠目测、token 不生成 tokens.json）。

### 4.9 sleek-design-mobile-apps（唯一端到端真出图）
- **来源**：github.com/sleekdotdesign/agent-skills · skills/design-mobile-apps（520 行）
- **格式 / 兼容**：universal（REST + curl 即可，几乎全宿主）；需 `SLEEK_API_KEY`（Pro+ 付费套餐）
- **类型 / 自动化 / 复杂度**：api-dependent · REST（异步 run + 轮询 + 截图渲染）· 需配置
- **安全**：caution（数据上传第三方 SaaS + 计费），但**安全写法堪称范本**：host 白名单、HTTPS-only、最小 scope、key 经 env 注入不硬编码。
- **能力覆盖**：自然语言生成移动端屏幕（Sleek 云端 AI 规划）→ 异步 run 生命周期 → 截图渲染 → 取回自包含 HTML → 转 RN/SwiftUI；版本 pin。
- **可复用价值**：**"把外部设计 SaaS 包成 skill"的教科书**——env 注入凭证 + host 白名单、异步轮询退避 + 幂等键、"生成后必截图回传"UX 约束、shell 落盘大 HTML 省 token。
- **一句简评**：唯一真能出图，但设计智能在云端、需付费。

### 4.10 contsun-prototype-design（中文 B 端原型工作流）
- **来源**：clawhub.ai/skills/prototype-design（1224 行，源自 WMS 项目沉淀）
- **格式 / 兼容**：openclaw；需 **bash + python3 + agent-browser**（OpenClaw 浏览器 CLI）才完整；非 OC 宿主跑不了截图验证环节
- **类型 / 自动化 / 复杂度**：hybrid（guide + py 同步脚本 + 浏览器截图验证）· 需配置（依赖 references/design-systems/ 58 套，本地未附）
- **安全**：caution（内嵌正则替换 index.html 的 py 脚本有误伤风险；agent-browser eval 执行任意 JS）
- **能力覆盖**：① 单页 HTML（含所有页面内嵌副本）的复杂 B 端原型工作流，58+ 设计系统切换；② 完整组件模板库（统计卡/筛选/数据表/弹窗/看板/Tab/固定表头表格）；③ **核心闭环**：改 pages/xxx.html → py 同步回写 index.html → div 平衡校验 → agent-browser 截图验证 → 小步 commit；④ **抗 compaction 记忆术**（"文件即记忆" + memory/日期.md）；⑤ 10 条 WMS 实战教训。
- **可复用价值**：中文 B 端/管理后台原型方向极独特——"源文件 + py 正则同步 + div 校验"防漂移 + 抗遗忘工作流，别处少见。
- **一句简评**：真实项目沉淀的中文 B 端原型圣经；注意它"全内联样式、禁 CSS 类"与 token 化阵营相反。

### 4.11 其余 Skill 归并说明（同质化 / 衍生 / 薄文档）
- **akhilbhima-frontend-design (#2)**：经逐行比对，**几乎是 anthropics #1 的逐字复制**，仅在结尾加了一节 "Reference Aesthetics → monochrome-editorial preset"。属换皮分支，无独立价值。
- **antonia-frontend-design-pro (#4)**：自述参考 `pbakaus/impeccable`，是 impeccable 设计哲学的**中文一页提炼 + 11 自创命令**，非 fork。中文轻量首选之一。
- **xobi667-ui-ux-pro-max (#10)**：自承 "upstream"，是 **nlb #9 的精简移植**（660 行→50 行，RN-only→多栈），做了实质裁剪，非逐字搬运。
- **microsoft-frontend-design-review (#8)**：官方名头但**纯 guide、零自动化**，框架（三支柱 + blocking/major/minor）成熟，references 未随附。
- **mattpocock-design-an-interface (#38)**：理念漂亮（并行多 Agent "设计两遍"）但**已被作者 deprecated**，且依赖宿主并行 sub-agent。
- **shubhamsaboo-ux-designer (#11) / tommygeoco-ui-audit (#28) / wshobson-design-system-patterns (#14) / beagle-review-frontend (#20)**：均为"hub+spoke / 索引式分文件"架构，**核心血肉在未随附的 references/兄弟 skill**，单看 SKILL.md 是骨架。借鉴其"渐进披露"架构 > 直接当前态使用。
- **lenny-design-engineering (#35) / alsoforever-product-design-gungun (#36)**：偏管理/方法论速查，重咨询轻执行、不碰代码。

---

## 5. 能力矩阵

| 能力点 | anthropics(#1) | impeccable(#3) | binggg(#5) | leonxlnx(#6) | nlb-uux(#9) | garrytan-review(#22) | jezweb-loop(#26) | owl 体系(#29-33) | sleek(#40) | contsun(#39) |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 反 AI 味禁用清单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◻️ | ❌ | ❌ | ❌ |
| 可机械执行自检（grep/清单/评分） | ❌ | ✅ | ✅ | ✅ | ◻️ | ✅ | ◻️ | ◻️ | ❌ | ✅(div校验) |
| 设计系统/token 产出 | ❌ | ✅ | ✅ | ◻️ | ✅ | ✅ | ✅ | ✅(知识) | ◻️ | ◻️ |
| 浏览器截图自检闭环 | ❌ | ✅(live) | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅(渲染) | ✅ |
| 审查→修复→复验闭环 | ❌ | ✅ | ◻️ | ❌ | ❌ | ✅ | ✅ | ◻️ | ❌ | ◻️ |
| 真实产物（HTML/图/文件） | ◻️(代码) | ✅ | ◻️ | ◻️ | ◻️ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 产品/UX 研究（persona/journey） | ❌ | ❌ | ❌ | ❌ | ◻️ | ◻️ | ❌ | ✅ | ❌ | ❌ |
| 中文场景适配 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 宿主无关（universal） | ✅ | ◻️ | ✅ | ✅ | ◻️ | ❌ | ❌ | ✅ | ✅ | ❌ |
| 零配置即用 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

> ✅ 完整支持 · ◻️ 部分/可选/降级 · ❌ 不支持

**矩阵读出的空白区**：没有任何一个 skill 同时做到「**反 AI 味纪律 + 浏览器截图自检闭环 + 真实产物 + 宿主无关 + 中文适配 + 零配置**」。最接近的 impeccable/garrytan 都重且绑工具链；最干净的 anthropics/binggg 又没有自动化闭环。**这条对角线就是自建机会。**

---

## 6. 跨 Skill 组合方案

### 6.1 工作流链路

**链路 1：从零做一个高质量前端页面（个人/CC 用户）**
```
anthropics-frontend-design (定美学方向/反slop)
  → shadcn-shadcn (组件骨架) 或 wshobson-interaction-design (动效)
  → impeccable polish/audit (细节硬规则打磨)
  → jezweb-design-review 或 garrytan-design-review (浏览器截图审查+修复)
```
- 适用：Claude Code 用户，要产出 + 审查闭环。
- 注意：garrytan/jezweb 需先装 gstack / Playwright MCP。

**链路 2：产品/UX 设计全流程（研究→设计→评审）**
```
owl-user-persona (基于数据做 persona)
  → owl-journey-map (旅程地图+机会点)
  → lenny-behavioral-product-design (行为干预设计)
  → owl-design-critique (设计评审主持)
  → owl-accessibility-audit (a11y 把关)
```
- 适用：要把"产品/UX 设计"做成可交付物链路。
- 注意：全是 guide-only，产物是文档而非可运行界面。

**链路 3：设计系统建立与落地**
```
arvindrk-extract-design-system (从参考站抽 token)
  → owl-design-token / wshobson-design-system-patterns (token 三层架构整理)
  → nlb-design-system (token 生成脚本 + slide)
  → shadcn-shadcn (落到组件库)
```

**链路 4：中文场景（B 端原型 / 反 AI 味落地）**
```
binggg-ui-design-guide (规范契约+grep自检)
  → contsun-prototype-design (单页 HTML B 端原型 + 截图验证)
  → 52yc-screenshot-ux-auditor (截图 UX 审查)
```

### 6.2 互补与冲突

| Skill A | Skill B | 关系 | 说明 |
|---------|---------|------|------|
| anthropics #1 | akhilbhima #2 | **高度重叠** | #2 近乎逐字复制 #1，**保留 #1 即可**，弃 #2 |
| impeccable #3 | antonia #4 | 重叠（语言互补） | 同源哲学；英文重型用 #3，中文轻量用 #4 |
| nlb-uux #9 | xobi667 #10 | 重叠（上下游） | #10 是 #9 精简移植；要密度选 #9，要宿主中立选 #10 |
| anthropics #1 | impeccable #3 | **互补（深度递进）** | #1 原则 → #3 命令化 + 硬规则 + 上下文 |
| garrytan #22 | jezweb #26 | 互补/竞争 | 都做截图闭环；gstack 重而全，jezweb 轻而 MCP 化 |
| owl persona #32 | owl journey #33 | **强互补（配套）** | persona 产出 → journey 消费，组合 > 单用 |
| binggg #5 | contsun #39 | **理念冲突** | #5 token 化 vs #39 全内联禁 CSS 类（场景取舍不同，别混用） |
| owl-a11y #30 | （无） | 能力缺口 | 纯目测，需自配 axe-core/Playwright 才能真自动化 |

---

## 7. 推荐：该装哪些 / 怎么组合 / 避开哪些

> 针对你的实际情况（Claude Code 为主、做大量 web 前端、维护对外分享的插件仓库）。

### 7.1 个人日常该装哪些（CC 用户，前端生产）
1. **anthropics-frontend-design**（必装，事实标准；你的 ameng-ppt-design 已同源）—— `npx skills add anthropics/skills@frontend-design`
2. **pbakaus-impeccable**（强烈推荐；命令体系 + 硬规则是目前最完整的工程化方案）—— 装时注意它要 Node 脚本 + reference 子文件，建议整仓拿。
3. **shadcn-shadcn**（若用 React/shadcn 栈，官方 skill 直接装）
4. **jezweb-design-review**（要"截图审查闭环"且不想被 gstack 重度绑定时的轻量选择，配 Playwright MCP）

### 7.2 产品/UX 方向该装哪些
- **owl-listener/designer-skills** 整套（persona + journey-map + design-critique + design-token + accessibility-audit）—— 干净、universal、零依赖，是产品/UX 方向性价比最高的一套。
- **lenny-behavioral-product-design**（行为设计 + 伦理护栏，最可执行的一则）。

### 7.3 怎么组合（安装顺序与配置）
- 先装 `anthropics-frontend-design`（即用基线）→ 再装 `impeccable`（深度命令）→ 需要审查闭环时再加 `jezweb-design-review` + Playwright MCP。
- 中文场景单独走 `binggg-ui-design-guide`（grep 自检）+ `contsun-prototype-design`（B 端原型）。
- 配置要点：impeccable 需 `node scripts/context.mjs` 初始化 PRODUCT.md；sleek 需 `SLEEK_API_KEY`（付费）；arvindrk 需 `npx playwright install chromium`。

### 7.4 避开哪些（原因）
- **akhilbhima-frontend-design**：anthropics 的逐字换皮版，无增量价值。
- **mattpocock-design-an-interface**：作者已 deprecated。
- **garrytan 三件套**（除非你深度用 gstack）：方法论顶级但强绑 gstack 私有 CLI + CDP 接管真实浏览器（带登录态截图泄露面），对"装上即用"不友好——**借方法论，别整装**。
- **tommygeoco-ui-audit / shubhamsaboo-ux-designer**：核心 references 未随包，单装是空壳，要用得回原仓库取全。
- **sleek-design-mobile-apps**：除非愿意付费且接受数据上云。
- **数十个 ClawHub 上的 `frontend-design-2/3`、`ui-ux-pro-max-2/3` 衍生版**：高度同质，无须收。

---

## 8. 设计方案：往 ameng-skill 仓库加什么 design skill

### 8.1 现有 Skill 的不足（即第 5 节那条空白对角线）
1. **"产出 + 自检闭环"几乎都绑死工具链**：impeccable 绑 Node 脚本、garrytan 绑 gstack CDP、jezweb 绑 MCP、sleek 绑付费 API。没有一个"自带轻量浏览器截图自检、宿主依赖最小"的方案。
2. **中文场景精品稀缺**：只有 binggg（偏规范）和 contsun（偏 B 端原型）两根独苗，且各有偏科。
3. **反 AI 味"原则"多，可机械执行的"自检"少**：anthropics/leonxlnx 给原则，只有 binggg(grep) / garrytan(评分) 真做了可执行自检。
4. **产品/UX 研究停在 guide-only**：persona/journey 不产出可视化真实文件。
5. **你已有的资产被浪费**：`ameng-ppt-design` 已经实现了「OKLCH token 系统 + 6 主题 + 逐页 PNG 自检 + validate 纪律校验 + 反 AI 味（禁 Inter/Playfair）」——这套"截图自检 + 反 slop 校验"的引擎完全可以复用到通用前端设计上。

### 8.2 推荐自建 / 拆分方案（与你已有 skill 形成矩阵）

你的仓库现状：`ameng-ppt-design`（演示/HTML）+ `ameng-skill-scout`（调研）。建议新增 **1 个主力 + 2 个可选**，复用 ppt-design 已验证的"截图自检 + validate"引擎：

1. **`ameng-frontend-craft`（主力，强烈推荐）** —— 通用前端/UI 设计与生成 skill。定位"anthropics 的反 slop 原则 + impeccable 的命令体系 + binggg 的 grep 自检 + ppt-design 的逐页 PNG 自检"四合一，但**宿主依赖最小化**（截图自检走已可用的 Playwright MCP，无 gstack 那种私有 CLI），**中英双语**。
2. **`ameng-design-review`（可选拆分）** —— 若不想把"生成"和"审查"塞进一个 skill，可拆出独立审查 skill：浏览器截图取证 + 反 AI slop 评分 + 审→修→复验闭环（借 garrytan 方法论、去掉 gstack 绑定）。
3. **`ameng-ux-kit`（可选，产品/UX 方向）** —— 把 owl 的 persona/journey + lenny 行为设计提炼成中文友好、且**产出可视化 HTML**（而非纯 md）的一套——正好用 ppt-design 的渲染能力出图。

### 8.3 设计草案

#### 方案 A（首选）：`ameng-frontend-craft`
- **定位**：有设计主见、反 AI 味、自带截图自检闭环的通用前端/UI 生成器；中英双语；宿主依赖最小。
- **包含能力**：
  - **反 slop 宪法**（融合 anthropics + impeccable + binggg 三家禁用清单：禁 Inter/Roboto、禁白底紫渐变、禁居中卡片网格、禁每节 eyebrow、禁 em-dash…）
  - **OKLCH token 系统 + 多主题**（直接移植 ppt-design 的 token 引擎）
  - **命令体系**（借 impeccable：`craft / audit / polish / bolder / quieter / colorize / typeset`，精简到 6–8 个高频命令）
  - **grep 式提交前自检**（借 binggg：扫自己产物里的禁用色/字体/emoji/居中卡片）
  - **逐页 PNG 截图自检闭环**（移植 ppt-design 的 Playwright 截图自检 + validate 纪律校验，发现问题→修→复验）
- **依赖**：Playwright MCP（截图，已在你环境可用）；无私有 CLI、无付费 API、无 Node 强制脚本
- **目标 Agent**：universal 优先（纯 SKILL.md + references/），CC 上启用截图自检增强
- **复杂度**：即用（截图自检为可选增强，缺 Playwright 时降级为 grep 自检）
- **与现有 skill 关系**：与 `ameng-ppt-design` 共享 token/自检引擎、各管"网页"与"演示"两个产物形态；触发词错开（ppt/slides vs 网页/组件/页面）。

#### 方案 B（轻量起步）：只做 `ameng-design-review`
- **定位**：不生成、只审查——给任意 URL/本地页做"反 AI slop 评分 + 7 维设计审查 + 截图取证 + 修复建议"。
- **包含能力**：jezweb 的 7 维 good/bad 表 + garrytan 的 AI Slop 黑名单与双评分 + baseline JSON 回归；Playwright MCP 截图。
- **依赖 / 复杂度**：Playwright MCP；即用。
- **优势**：比方案 A 范围小、易做、易分享，且填补"宿主无关的截图审查"这个明确空白（现有的都绑 gstack/jezweb 工具链）。

> **建议落地顺序**：先做 **方案 B（design-review）** 作为低风险高价值的第一步（范围清晰、复用 ppt-design 截图能力、填明确空白），验证后再扩成 **方案 A（frontend-craft）** 的完整生成+自检闭环。`ameng-ux-kit` 视后续需求再定。

---

## 附录

### A. 搜索关键词完整列表
- **英文**：design · ui design · ux design · frontend · design system · wireframe · prototype · ui components · visual design · design review · tailwind · shadcn · landing page
- **中文**：界面设计 · 原型 · 图文排版
- **平台**：`npx skills find` · `npx clawhub@latest search` · `gh search code --filename SKILL.md` · `gh search repos`

### B. 未找到 / 无结果的来源
- ClawHub 搜"界面设计"无结果（中文长词召回弱，需用"ui/ux/frontend"英文词）。
- skills.sh 搜"图文排版"无结果。
- SkillsMP / ClaudeSkills.com 等本次未单独抓取（GitHub + 两个 CLI 已覆盖头部，去重后增量有限）。

### C. SPA 站点直链（供自行翻完整列表）
- skills.sh：https://skills.sh/?q=design · https://skills.sh/?q=ui+design · https://skills.sh/?q=frontend
- ClawHub：https://clawhub.ai/skills?q=design · https://clawhub.ai/skills?q=ui · https://clawhub.ai/skills?q=ux
- 头部代表直链：
  - https://skills.sh/anthropics/skills/frontend-design （48.7w 安装）
  - https://skills.sh/vercel-labs/agent-skills/web-design-guidelines
  - https://github.com/pbakaus/impeccable （⭐3k）
  - https://github.com/garrytan/gstack
  - https://github.com/owl-listener/designer-skills

### D. 下载产物
- 本研究文件夹下 41 个 `[来源]-作者-skill名/` 目录，各含原始 `SKILL.md` + `_source.yaml`。
- 下载脚本：`_download.sh`（可复跑/扩充）。
- ⚠️ 部分 skill 的 references/scripts/兄弟 skill 未随附（评估"真实能力"时已在第 4 节标注）。
</content>
</invoke>
