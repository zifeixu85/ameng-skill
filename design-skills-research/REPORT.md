# Design 相关 Skill 研究报告（前端/UI + 产品/UX）

> 生成日期：2026-06-02（第二轮扩充：补全 8 维生命周期覆盖 + Claude Design 系统提示词）
> 搜索范围：skills.sh · ClawHub · GitHub（含 awesome 列表）· WebSearch
> 收集数量：共 **63** 个 Skill（已下载 SKILL.md 原件）+ **1** 份参考资料（Claude Design 逆向系统提示词）

---

## 1. 研究设定

- **主题 / 关键词**：design 相关 skill，聚焦 **前端/UI 界面** + **产品/UX 设计**
- **产出模式**：research + 设计方案（输出到第 9 节，含自建/拆分 Skill 草案）
- **深度**：彻查（63 个，跨平台尽量收全去重）
- **目标 Agent**：不限（逐个标注 Claude Code / Codex / OpenClaw / Hermes 兼容性）
- **使用场景**：用户维护 `ameng-skill` 这个对外分享的 Claude Code 插件市场仓库（已有 `ameng-ppt-design`、`ameng-skill-scout`），日常做大量 web 前端，想盘点 design 赛道已有的 skill，并据此决定往仓库里加什么新 skill。
- **第二轮新增要求**：① 检查现有 skill 对 **8 个设计生命周期维度** 的覆盖：问题定义 / 用户研究 / 信息架构 / 界面生成 / 视觉风格 / 设计系统 / 设计评审 / 验证复盘；② 收录 **Claude Design 逆向系统提示词**（相当于"设计 agent 的提示词"，参考价值高）作为研究资料。

---

## 2. 概览与统计

design 是 skill 生态里**最拥挤的赛道之一**：仅 ClawHub 一个平台，"frontend/ui/ux/design-system" 几个词就能搜出 100+ 条；skills.sh 上 `anthropics/skills@frontend-design` 单条 **48.7 万次安装**，是整个生态头部。本次按"前端/UI + 产品/UX + 8 维生命周期"彻查，收 63 个有代表性样本。

**核心结论速览：**
- **生命周期两端薄、中间厚**：界面生成 / 视觉风格 / 设计系统 / 设计评审 严重过剩；**问题定义、信息架构、验证复盘** 三端要靠"产品经理/UX 研究"类 skill（pop、assimovt、owl、dembrandt）补，且这些多为 guide-only、模板常外置缺失。
- **绝大多数是 `guide-only`（纯方法论提示词）**；真正带自动化闭环（浏览器截图审查/出图）的是少数，且几乎都绑特定工具链（gstack / jezweb / Playwright MCP / 付费 SaaS）。
- **"反 AI 味"（anti-slop）是赛道母题**：禁 Inter/Roboto、禁白底紫渐变、禁居中卡片网格、禁套路化 eyebrow ——连官方 **Claude Design 系统提示词本身**都写了同款禁用清单。
- **大量重复/下游改写**：`anthropics/frontend-design` 被反复 fork/翻译/换皮；`ui-ux-pro-max`、`impeccable`、`lenny-skills` 各有多个衍生/再托管版。
- **出现了"生命周期编排器"**：`julianoczkowski/design-flow` 把 brief→IA→token→tasks→build→review 串成端到端流程；`product-on-purpose/pm-skills` 是一整套带 phase 元数据的 PM 生命周期家族（含正统 Google Design Sprint 工具）。
- **中文工程级精品稀少**：`binggg/ui-design-guide`（腾讯 CloudBase，grep 自检）和 `contsun/prototype-design`（B 端单页原型）是两根独苗。

| 下载来源 | 数量 |   | 格式（_source 标注） | 数量 |
|-----|------|---|------|------|
| GitHub | 55 |   | universal（纯 SKILL.md，跨宿主） | 48 |
| ClawHub | 8 |   | claude-code（路径/字段绑定 CC） | 7 |
| 参考提示词 | 1 |   | openclaw（ClawHub 社区） | 8 |

> skills.sh 是主要"发现入口"，但绝大多数实体托管在 GitHub，故按"实际下载来源"统计。

---

## 3. Skill 清单与分类（总表，63 个）

> **兼容**：CC=Claude Code · OC=OpenClaw · 全=universal（任意宿主）｜**类型**：guide / script / api / browser / hybrid｜**复杂度**：即用 / 需配置 / 需开发
> ⚠️ 标"(refs缺)"= 该 skill 的 references/脚本/兄弟 skill 在原仓库，本次只下到 SKILL.md，单独用会降级。

### A. 前端/UI 生成（设计主见 + 反 AI 味）

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 1 | anthropics-frontend-design | universal | 全 | guide | 即用 | safe | **赛道旗舰/事实标准**（48.7w 安装），一页反 slop 美学宪法 |
| 2 | akhilbhima-frontend-design | universal | 全 | guide | 即用 | safe | **几乎逐字复制 #1**，仅多一节 monochrome-editorial preset |
| 3 | pbakaus-impeccable | universal | 全(CC最佳) | hybrid | 需配置 | safe | 重型旗舰：21 命令 + PRODUCT/DESIGN.md + 调色脚本 + live |
| 4 | antonia-frontend-design-pro | openclaw | 全 | guide | 即用 | safe | impeccable 的**中文极简口袋版**（11 命令） |
| 5 | binggg-ui-design-guide | openclaw | 全 | guide | 即用 | caution | 腾讯 CloudBase，**规范契约 + grep 自检**，中文标杆 |
| 6 | leonxlnx-design-taste-frontend | universal | 全 | guide | 即用 | safe | 最工程化反 slop：三刻度盘 + 79 项 Pre-Flight |
| 7 | wholiver-swiftui-design | universal | 全 | guide | 即用 | safe | SwiftUI 版反 slop 宪法 + 量化验收门槛 |
| 8 | microsoft-frontend-design-review | universal | 全 | guide | 即用 | safe | 官方但纯指南：三支柱框架，自动化为零 |

### B. UI/UX 综合体系（规则库 + 工作流）

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 9 | nlb-ui-ux-pro-max | claude-code | 全 | hybrid | 需配置 | safe | **99 条 UX 规则 + 检索库**（脚本未随附） |
| 10 | xobi667-ui-ux-pro-max | openclaw | OC/全 | hybrid | 即用 | safe | #9 的下游精简移植（自承 upstream） |
| 11 | shubhamsaboo-ux-designer | universal | 全 | guide | 需配置 | safe | hub+spoke 全流程 UX + Worked Example (refs缺) |
| 12 | nlb-ui-styling | claude-code | CC最佳 | hybrid | 需配置 | caution | claudekit：shadcn+Tailwind 脚手架 |

### C. 设计系统 / Design Token / 治理

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 13 | nlb-design-system | claude-code | CC最佳 | hybrid | 需配置 | caution | claudekit：token + slide 双引擎（取图联网） |
| 14 | wshobson-design-system-patterns | universal | 全 | guide | 即用 | safe | token 三层架构概念纲要 (refs缺) |
| 15 | owl-design-token | universal | 全 | guide | 即用 | safe | 极简 token 知识卡（不生成 tokens.json） |
| 16 | arvindrk-extract-design-system | universal | 全 | script+browser | 需配置 | caution | **从公开网站逆向抽 token**（Playwright） |
| 17 | lenny-design-systems | universal | 全 | guide | 即用 | safe | 播客洞见"何时该做设计系统"咨询话术 |
| 18 | owl-design-system-governance | universal | 全 | guide | 即用 | safe | **唯一治理向**：三所有权模型 + semver + 弃用流程 |

### D. 框架专精（shadcn / Tailwind / React / 动效）

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 19 | shadcn-shadcn | universal | 全(CC最佳) | script | 需配置 | safe | **官方 shadcn skill**：注册表 + 严格组合规则 |
| 20 | beagle-shadcn-ui | claude-code | 全 | guide | 即用 | safe | shadcn 代码模式小抄 + CLI 安全 Gates |
| 21 | beagle-review-frontend | claude-code | CC最佳 | hybrid | 需配置 | safe | React 审查 orchestrator (兄弟 skill 缺) |
| 22 | wshobson-interaction-design | universal | 全 | guide | 即用 | safe | 微交互/动效代码库 + 时长分级 + 缓动常量 |

### E. 设计评审 / 评审（含浏览器自动化闭环）

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 23 | garrytan-design-review | claude-code | CC(绑gstack) | hybrid+browser | 需配置 | caution | **自动化最重**：审→修→截图复验→提交闭环 + AI Slop 评分 |
| 24 | garrytan-design-consultation | claude-code | CC(绑gstack) | hybrid+browser | 需配置 | caution | 顾问式设计系统提案 + SAFE/RISK + 反收敛字体 |
| 25 | garrytan-design-html | claude-code | CC(绑gstack) | hybrid+browser | 需配置 | caution | 设计稿→Pretext 真排版 HTML（CDN 拉 JS 风险） |
| 26 | jezweb-design-review | claude-code | CC | browser | 需配置 | caution | 7 维 good/bad 截图取证审查（外包 MCP） |
| 27 | jezweb-design-loop | claude-code | CC | hybrid+browser | 需配置/开发 | caution | **baton 自主循环建站** + 三文件记忆 + 双断点截图 |
| 28 | 52yc-screenshot-ux-auditor | openclaw | OC | script | 需配置 | caution | 截图→结构化 UX 审查（被动收图；脚本缺） |
| 29 | tommygeoco-ui-audit | openclaw | 全 | guide | 需配置 | safe | UX 决策方法论库 + JSON schema (32 refs缺) |
| 30 | microsoft-frontend-design-review | ↑见A#8 | — | — | — | — | （归 A，双模式审查/创意） |
| 31 | owl-design-critique | universal | 全 | guide | 即用 | safe | 设计评审主持剧本 + 反馈话术模板 |
| 32 | owl-accessibility-audit | universal | 全 | guide | 即用 | safe | WCAG 2.2 模板（纯目测，无 axe-core） |
| 33 | dembrandt-nielsen-usability-heuristics | universal | 全 | guide | 即用 | safe | Nielsen 10 条做成审查卡 + 检索元数据 |
| 34 | vercel-web-design-guidelines | universal | 全 | guide | 即用 | safe | 每次审查前 WebFetch 拉 Vercel 最新规范 |
| 35 | lyndonkl-cognitive-design | universal | 全 | guide | 需配置 | safe | 认知科学"为什么有效"底座（菜单式，refs缺） |

### F. 问题定义 / JTBD（第二轮补）

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 36 | assimovt-problem-validation | universal | 全 | guide | 即用 | safe | **最可裁决**：F×I×W×WTP 乘积评分 + Build/Kill 阈值 |
| 37 | pop-define-problem-statement | universal | 全 | guide | 即用 | safe | 商业问题框定 6 步 + 质量清单 (refs缺) |
| 38 | pop-define-jtbd-canvas | universal | 全 | guide | 即用 | safe | 8 步 JTBD canvas（含非消费竞品）(refs缺) |
| 39 | assimovt-jtbd-analysis | universal | 全 | guide | 即用 | safe | **动态 JTBD**：Forces of Progress + 切换者访谈 |
| 40 | owl-jobs-to-be-done | universal | 全 | guide | 即用 | safe | 学术向（Ulwick 8 阶段 ODI），偏分析 |
| 41 | julianoczkowski-design-brief | universal | 全 | guide | 即用 | safe | **桥接型**：问题→代码现状→视觉方向 一份 brief |

### G. 用户研究

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 42 | owl-user-persona | universal | 全 | hybrid | 即用 | safe | **基于真实数据**做行为型 persona + 标注缺口 |
| 43 | owl-journey-map | universal | 全 | hybrid | 即用 | safe | 旅程地图 + 情绪曲线 + 机会点排序（与#42配套） |
| 44 | assimovt-user-interview | universal | 全 | guide | 即用 | safe | Mom Test + YC 五问 + 反模式纪律 (1 ref缺) |
| 45 | assimovt-research-synthesis | universal | 全 | guide | 即用 | safe | **Atomic Research 四层金字塔** + 证据强度分级 |
| 46 | c0ldsmi1e-user-research | openclaw | OC/全 | guide | 即用 | safe | 顾问式：先 intake 再定制 + 分群访谈脚本 |
| 47 | lenny-behavioral-product-design | universal | 全 | guide | 即用 | caution | 行为科学落地（自带反暗黑模式护栏） |
| 48 | lenny-design-engineering | universal | 全 | guide | 即用 | safe | "设计工程"职能定义（偏 leader） |
| 49 | alsoforever-product-design-gungun | openclaw | 全 | guide | 即用 | safe | 中文产品设计方法论速查（KANO/RICE/双钻） |

### H. 信息架构

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 50 | dembrandt-information-architecture | universal | 全 | guide | 即用 | safe | **IA 知识本体最深**：命名/数据模型/危险操作/导航 + 14 项 checklist |
| 51 | julianoczkowski-information-architecture | universal | 全 | guide | 即用 | safe | **IA 落地流程最深**：探查代码库→落盘 IA 文档 |
| 52 | dembrandt-user-flows-guided-paths | universal | 全 | guide | 即用 | safe | wizard/结账流决策表 + 组件解剖 + checklist |
| 53 | owl-card-sort-analysis | universal | 全 | guide | 即用 | safe | 卡片分类→IA 的 7 步桥梁（相似度矩阵缺脚本） |

### I. 验证复盘 / 实验

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 54 | pop-measure-experiment-design | universal | 全 | guide | 即用 | safe | **A/B 实验设计**：护栏指标 + 样本量 + 事前成功标准 (refs缺) |
| 55 | owl-usability-test-plan | universal | 全 | guide | 即用 | safe | 可用性测试计划 8 要素（SUS/SEQ + 5-8 样本） |
| 56 | lyndonkl-reviews-retros-reflection | universal | 全 | hybrid | 即用 | safe | 复盘最厚：多场景 + 心理安全 + JSON rubric 自评 (refs缺) |
| 57 | pop-iterate-retrospective | universal | 全 | guide | 即用 | safe | 4 种复盘格式 + owner/due-date 闭环 (refs缺) |

### J. 原型 / 移动端 / 图像驱动 / 生命周期编排

| # | 名称 | 格式 | 兼容 | 类型 | 复杂度 | 安全 | 简评 |
|---|-----|------|------|------|--------|------|------|
| 58 | julianoczkowski-design-flow | universal | 全(CC最佳) | hybrid(编排) | 需配置 | caution | **设计生命周期编排器**：brief→IA→token→tasks→build→review (兄弟skill缺) |
| 59 | pop-design-sprint-map-target | universal | 全 | guide | 需配置 | safe | **正统 Google Design Sprint** 周一 Map&Target (家族缺) |
| 60 | mattpocock-prototype | universal | 全 | guide | 即用 | safe | 一次性原型路由（逻辑/UI 二分，用完即删） |
| 61 | mattpocock-design-an-interface | universal | CC | guide | 需配置 | safe | 并行多 Agent"设计两遍"（**已 deprecated**） |
| 62 | contsun-prototype-design | openclaw | OC | hybrid+browser | 需配置 | caution | **中文 B 端单页 HTML 原型工作流** + 抗 compaction (设计系统缺) |
| 63 | sleek-design-mobile-apps | universal | 全 | api | 需配置 | caution | **唯一端到端真出图**：付费 SaaS（智能在云端） |
| 64 | leonxlnx-imagegen-frontend-web | universal | 需图像生成 | hybrid | 需配置 | safe | 图像生成驱动网页视觉 comp（每 section 一张图） |

> 编号 64 因 microsoft(#8/#30) 跨两类各列一次，实际去重后为 63 个 skill。

---

## 4. Claude Design 系统提示词分析（"设计 agent 的提示词"）⭐

> 来源：`elder-plinius/CL4R1T4S` 逆向归档（`ANTHROPIC/Claude-Design-Sys-Prompt.txt`，422 行）。这是 **Claude.ai 的 Design 功能**（artifact/设计画布）背后那个设计 agent 的系统提示词——不是一个可安装的 skill，而是"官方怎么让一个 LLM 当设计师"的完整范本。**参考价值高于任何单个社区 skill**，因为它出自官方、经过产品打磨、且揭示了一整套工具/验证/编辑协议。

### 4.1 它是什么
- **角色设定**："你是一个专家设计师，用户是你的经理"；产物**统一用 HTML**（可表达网页/幻灯片/原型/动画/视频），按领域切换身份（动画师/UX/幻灯片/原型师）。
- **运行环境**：基于文件系统的 project；有完整工具集（read_file/write_file/copy_files/run_script/eval_js_user_view/done/fork_verifier_agent/snip/questions_v2/copy_starter_component/invoke_skill…）。
- **内置子 skill**（它能 `invoke_skill` 调用）：Animated video、Interactive prototype、Make a deck、Make tweakable、**Frontend design**、Wireframe、Export as PPTX（editable / screenshots 两种）、Create design system、Save as PDF、Save as standalone HTML、Send to Canva、Handoff to Claude Code。

### 4.2 它的工作流（官方设计 agent 的"标准动作"）
1. **理解需求**：对新/模糊任务**用 `questions_v2` 问大量问题**（明确"至少 10 个问题"，要问清产物/保真度/选项数量/约束/在用的设计系统/UI 套件/品牌）。给了一张"该问/不该问"的判例表。
2. **探索资源**：读设计系统完整定义 + 相关文件；**强调"高保真设计不能从零开始，必须扎根既有设计上下文"**（让用户 Import 代码库 / UI kit / 截图 / Figma），从零 mock 是"最后手段、必出烂设计"。
3. **规划 + todo list**。
4. **建文件夹、把资源拷进来**（不直接引用，避免外链；不 bulk-copy >20 文件）。
5. **完成**：调 `done` 把文件呈现给用户并检查能否干净加载 → 干净后调 `fork_verifier_agent`（后台子 agent 带自己的 iframe，做截图/布局/JS 探查，通过则静默，出问题才叫醒）。
6. **极简收尾**：只讲注意事项和下一步。

### 4.3 关键设计哲学（与社区 skill 高度共振，但更系统）
- **"像初级设计师交给经理那样，尽早给草稿"**：先写假设+上下文+设计推理+占位符，**尽早 show_to_user**，再迭代。
- **强制给多方案**：`Give options: try to give 3+ variations across several dimensions`，从"照本宣科匹配现有模式"到"新颖大胆"渐进，通过 **Tweaks 系统**让用户在页面内切换/混搭。
- **反 AI slop 清单**（官方版，和 anthropics/impeccable 同源）：少用渐变背景、禁 emoji（除非品牌）、**禁"圆角 + 左边框 accent"容器**、禁用 SVG 硬画图（用占位符问真素材）、**禁 Inter/Roboto/Arial/Fraunces/system 字体**。
- **内容纪律**："不要填充内容""每个元素都要挣得位置""1000 个 no 换 1 个 yes""避免 data slop（没用的数字/图标/统计）"；**加内容前先问用户**。
- **先立系统再动手**：探索完资产后先口头确定 type/色板/布局系统，再用它制造"有节奏的视觉变化"。

### 4.4 揭示的几个"协议"（对自建 skill 极有参考价值）
- **`fork_verifier_agent` 验证子 agent**：生成后由一个独立子 agent 截图自检，"不要自己截图验证、靠 verifier 静默兜底"——这正是把"截图自检闭环"做成**后台、不污染主上下文**的官方解法。
- **Tweaks / 编辑模式协议**：用 `/*EDITMODE-BEGIN*/{...JSON...}/*EDITMODE-END*/` 标记可改默认值 + `postMessage({type:'__edit_mode_*'})` 双向通信 + 写回磁盘持久化。**这与你的 `ameng-ppt-design` 已实现的"就地编辑 + 存版本"几乎是同一套契约**——官方提示词等于给了你这套设计的权威背书与命名规范。
- **`snip` 上下文管理**：每条用户消息带 `[id:mNNNN]`，阶段完成就 snip 掉旧 ID，延迟批量执行——长设计会话的上下文压缩术。
- **starter components**：`deck_stage.js`（幻灯片壳：缩放/键盘导航/演讲者备注 postMessage/localStorage/打印 PDF）、`design_canvas.jsx`（并排多方案）、`ios/android_frame`、`macos/browser_window`、`animations.jsx`。
- **React+Babel 用 pin 死版本 + integrity 哈希（SRI）**；HTML 内可调 `window.claude.complete`（claude-haiku-4-5，1024 token 上限）做产物内 LLM。
- **固定尺寸内容自缩放**（1920×1080 letterbox）、**幻灯片 1-indexed 标签**、**速度/位置存 localStorage**——和你 ppt-design 的诉求完全一致。

### 4.5 对本研究的意义
- 它**验证了社区头部 skill 的方向是对的**（反 slop、给多方案、扎根上下文、截图验证），但把它们**编排成了一个带工具与验证子 agent 的完整 agent**——这正是社区 skill 普遍缺的"编排层"。
- 对你自建 skill：**4.2 的工作流 + 4.4 的四个协议（verifier 子 agent / Tweaks 编辑协议 / snip / starter 组件）是可直接借鉴的官方蓝本**，且其中"Tweaks 编辑协议 + 幻灯片缩放/备注"你已在 ppt-design 落地，可平移到通用前端设计 skill。

---

## 5. 8 维设计生命周期覆盖矩阵 ⭐（第二轮核心）

按你给的 8 个维度盘点 63 个 skill 的覆盖。✅✅=有强代表/可执行 · ✅=有覆盖 · ◻️=部分/间接 · 🈳=明显薄弱。

| 维度 | 覆盖度 | 代表 Skill | Claude Design 提示词是否覆盖 |
|------|:--:|------|:--:|
| **① 问题定义** | ✅ | assimovt-problem-validation(可裁决评分)、pop-define-problem-statement、pop/assimovt/owl-JTBD、julianoczkowski-design-brief、pop-design-sprint(Map&Target) | ◻️（"问大量问题"环节隐含，但无独立框架） |
| **② 用户研究** | ✅✅ | owl-user-persona+journey-map、assimovt-user-interview+research-synthesis、c0ldsmi1e-user-research、lenny-behavioral、alsoforever(中文) | 🈳（不做研究，假定用户给上下文） |
| **③ 信息架构** | ✅ | dembrandt-IA(本体最深)、julianoczkowski-IA(落地最深)、dembrandt-user-flows、owl-card-sort | ◻️（强调"扎根既有结构"，无 IA 产出物） |
| **④ 界面生成** | ✅✅ 过剩 | anthropics、impeccable、leonxlnx、shadcn、sleek(真出图)、contsun、jezweb-loop、garrytan-html、imagegen | ✅✅（HTML 即产物，核心能力） |
| **⑤ 视觉风格** | ✅✅ 过剩 | anthropics、impeccable、binggg、leonxlnx、wholiver、garrytan-consultation、antonia、lyndonkl-cognitive | ✅✅（反 slop + 多方案 + 系统先行） |
| **⑥ 设计系统** | ✅✅ | nlb-design-system、owl-design-token、wshobson-patterns、arvindrk-extract、owl-governance(治理)、shadcn | ✅（内置 Create design system 子 skill） |
| **⑦ 设计评审** | ✅✅ 过剩 | garrytan-review(闭环)、jezweb-review、microsoft、owl-critique、owl-a11y、dembrandt-nielsen、tommygeoco、vercel | ✅（fork_verifier_agent 截图自检子 agent） |
| **⑧ 验证复盘** | ✅ | pop-measure-experiment(A/B)、owl-usability-test-plan、lyndonkl-reviews-retros、pop-iterate-retrospective、assimovt-problem-validation | 🈳（一次性产物，无验证/复盘闭环） |

### 5.1 读出的盲区与失衡
1. **严重失衡**：④⑤⑥⑦（生成/视觉/系统/评审）数十个、高度同质、过剩；①②③⑧（问题/研究/IA/验证）要靠产品经理类 skill 撑，且**几乎全是 guide-only + 模板外置缺失**，没有一个"可运行产出真实文件"的。
2. **没有一个 skill 覆盖全 8 维**。最接近"串起来"的是 `julianoczkowski/design-flow`（覆盖 ①问题定义(借 grill+brief)→③IA→⑤⑥token→④build→⑦review），但**缺 ②用户研究 和 ⑧验证复盘**，且强依赖同仓兄弟 skill。
3. **⑧验证复盘是离落地最远的一环**：现有的（pop/owl/lyndonkl）都只产"计划/复盘文档"，没有一个真去跑可用性测试或读 A/B 数据——和 owl-a11y"纯目测"同病。
4. **②用户研究 与 ④界面生成 之间断裂**：研究产物（persona/journey/synthesis）是 md，界面生成 skill 不读它们；中间靠 ①design-brief/③IA 勉强搭桥。
5. **Claude Design 提示词只强④⑤⑥⑦**（生成侧），刻意不碰②⑧（它假定用户带上下文、产物是一次性的）——说明"研究/验证"本就不是"设计画布 agent"的职责，而是**产品/研究流程的职责**，二者天然该是两个 skill。

---

## 6. 详细分析（精选展开，其余见各分类表 + 第二轮补充）

> 63 个全部已下载。第一轮 41 个的详细卡片见下；第二轮 22 个的要点已在第 5 节矩阵 + 第 3 节各表给出，关键差异在 6.12 归并。

### 6.1 anthropics-frontend-design（旗舰/事实标准）
- 来源 github.com/anthropics/skills · universal · guide-only · 即用 · safe
- 能力：① 先定 BOLD 美学方向再写代码；② 排版/色彩/动效/空间/背景五维准则；③ 禁用清单（禁 Inter/Roboto/Arial、禁白底紫渐变、禁套路布局、禁跨次生成都收敛 Space Grotesk）。
- 可复用价值：整个赛道的母版，确立了"用禁用清单 + 美学方向承诺约束 LLM"的范式（你的 ppt-design 已同源）。

### 6.2 pbakaus-impeccable（重型工程化旗舰）
- universal frontmatter 但绑 Node 脚本 → CC 最佳 · hybrid · 需配置 · safe
- 能力：21 动词命令（craft/audit/polish/bolder/quieter/colorize/typeset/animate/live…）+ PRODUCT/DESIGN.md 上下文持久化 + brand/product register 分流 + 极细硬规则（对比度 ≥4.5:1、行长 65–75ch、字体 ≤3、hero ≤6rem、z-index 语义层级、禁 em-dash/buzzword）+ Absolute bans + 二阶 AI slop 测试。
- 可复用价值：最值得偷师的"命令体系 + 项目上下文 + 极细硬规则 + live 浏览器迭代"。

### 6.3 binggg-ui-design-guide（中文工程级标杆）
- 腾讯 CloudBase · openclaw · guide + grep 自检 · 即用 · caution（拉 cnb.cool 外部 raw）
- 能力：强制"先出 DESIGN SPECIFICATION 再写代码"契约 + 极严禁用清单 + 11 美学方向按场景推荐 + **TRIGGER WORD DETECTOR 自我刹车 + 提交前 grep 五项自检** + brand escape hatch。
- 可复用价值：中文场景最值得借鉴；"规范契约 + 禁用清单 + grep 自检闭环"是把反 slop 做成可机械执行的关键一跳。

### 6.4 garrytan gstack 三件套（review / consultation / html）
- github.com/garrytan/gstack · 标称 universal 实为 CC-first 强绑 gstack 私有 CLI + 自研 browse 浏览器 · hybrid+browser · 需配置 · caution
- review：11 阶段审→修→截图复验→原子提交闭环 + 双评分(Design Score + AI Slop Score) + baseline 回归 + AI Slop 黑名单 + Landing/App 分类。consultation：顾问式出完整设计系统 + **SAFE/RISK 框架** + 反收敛字体纪律 + 浏览器比较看板人在环选型 + DESIGN.md。html：mockup→vision 抽 JSON→分 5 tier Pretext 排版→三视口截图自检→人在环外科精修。
- 可复用价值：全赛道方法论密度最高；客观提取设计系统、AI Slop 黑名单、商誉量化、SAFE/RISK、截图取证+baseline 回归、审→修→复验闭环都是顶级范本。**借方法论，别整装**（强绑 gstack + CDP 接管真实浏览器有泄露面）。

### 6.5 julianoczkowski/design-flow（设计生命周期编排器）⭐
- universal · hybrid(编排) · 需配置 · caution（会读取并执行多个兄弟 skill + Phase7 调 Playwright MCP）
- 能力：明确 6 阶段顺序（grill-me→design-brief→information-architecture→design-tokens→brief-to-tasks→frontend-design）+ Phase7 design-review 按需触发；**阶段门控**（前 announce 产物、后 summarize 等用户确认 "Ready to move?"）；阶段间状态传递；`.design/<feature-slug>/` 持久化 + 断点续跑；内置跳过模式。
- 可复用价值：**想自建"生命周期编排"方向 skill 的最佳范本**——阶段序列 + 门控协议 + 状态传递 + 断点续跑 + 把评审刻意排除在自动流程外，这 6 点直接可抄。短板：缺②用户研究/⑧验证；离开同仓兄弟 skill 无法独立跑。

### 6.6 assimovt 三件套（problem-validation / jtbd-analysis / user-interview + research-synthesis）⭐
- universal · guide · 即用 · safe · 自包含（仅 user-interview 缺 1 个 ref 模板）
- **problem-validation**：F×I×W×WTP 四维 1-5 乘积评分 + 阈值(250+ Build/<100 Kill) + 证据强度分级 + 反面算例 + Go/Investigate/Kill 硬裁决——本研究里**最"可裁决"的 skill**。**jtbd-analysis**：Forces of Progress 四力 + trigger event + 只访 90 天内切换者。**research-synthesis**：Atomic Research 四层金字塔(Nuggets→Patterns→Insights→Recommendations) + 证据可追溯链 + "禁止基于 Weak 证据给建议"。
- 可复用价值：把"软判断"做成"量化 + 纪律(CRITICAL/ALWAYS/NEVER) + 自包含可裁决"的最佳范本——这是 ①问题定义/⑧验证 方向最该抄的写法。

### 6.7 dembrandt（information-architecture / user-flows / nielsen-heuristics）
- universal · guide · 即用 · safe · 自包含 + 富检索元数据(pathPatterns/promptSignals/retrieval)
- IA：命名哲学 + 心智模型跟随数据模型 + 危险操作 confirm（判定表+解剖+文案级示例）+ 大型应用导航(≤3层) + 14 项 checklist——**IA 知识本体最深**。user-flows：wizard/结账决策表 + 组件解剖。nielsen：10 条做成"原则→实践→Review question→checklist"四段式审查卡。
- 可复用价值：把抽象原则落到"具体 UI 决策 + 可勾选清单 + 文案示例"；其 retrieval 元数据是"让 skill 被自动精准召回"的范本。

### 6.8 owl-listener 设计体系（design-research/systems/ops 三十余个）
- universal · guide(persona/journey 软依赖宿主能力) · 即用 · safe
- 本次收 8 个：user-persona、journey-map、jobs-to-be-done、card-sort-analysis、usability-test-plan、design-token、accessibility-audit、design-critique、design-system-governance。
- 定位：横跨②③⑥⑦⑧的"设计组织全景"，颗粒细、单文件、零依赖；短板是不产出真实文件（a11y 目测、token 不生成 json、card-sort 相似度矩阵无脚本）。最有价值：persona+journey 配套、governance(三模型+semver+弃用)、usability-test-plan(SUS/SEQ+样本量)。

### 6.9 product-on-purpose/pm-skills（PM 生命周期家族，含 Google Design Sprint）
- universal · guide · 即用~需配置(refs/兄弟 skill 多外置缺失) · safe
- 本次收 5 个：define-problem-statement、define-jtbd-canvas、iterate-retrospective、measure-experiment-design、tool-design-sprint-map-and-target。
- 特色：每个带 `phase`(define/measure/iterate) + `frameworks` + `prerequisites/inputs/outputs/timebox_minutes/roles` 元数据——**编排家族的元数据范本**；design-sprint 是正统 Google/GV Sprint（精确到分钟时间表 + 角色 + When NOT to Use）。短板：单文件无法独立跑，依赖整个家族 + references。

### 6.10 sleek-design-mobile-apps（唯一端到端真出图）
- universal(REST+curl) · api · 需配置(需 SLEEK_API_KEY 付费) · caution
- 安全写法堪称范本：host 白名单 + HTTPS-only + 最小 scope + key 经 env 注入；异步 run+轮询退避+幂等键；"生成后必截图回传"。设计智能在 Sleek 云端。

### 6.11 contsun-prototype-design（中文 B 端原型工作流）
- clawhub · openclaw · 需 bash+python3+agent-browser · hybrid+browser · 需配置 · caution
- 单页 HTML(含所有页面内嵌) B 端原型 + 58 设计系统切换 + 改 pages→py 同步回 index.html→div 平衡校验→agent-browser 截图验证→小步 commit + **抗 compaction 记忆术**("文件即记忆")。注意它"全内联样式禁 CSS 类"与 token 化阵营相反。

### 6.12 归并说明（同质化/衍生/薄文档/弃用）
- **akhilbhima(#2)** = anthropics 逐字换皮（仅多 1 节 preset），无增量。
- **antonia(#4)** = impeccable 中文一页提炼 + 11 命令；**xobi667(#10)** = nlb-ui-ux-pro-max 精简移植(自承 upstream)。
- **microsoft(#8)** 官方名头但纯 guide 零自动化。**mattpocock-design-an-interface(#61)** 已 deprecated。
- **lyndonkl-cognitive-design / shubhamsaboo / tommygeoco / pop 系 / lyndonkl-reviews / beagle-review**：核心血肉在未随附的 references/兄弟 skill，单装是骨架——借"渐进披露/检索元数据/编排元数据"架构 > 直接当前态用。
- **oldwinter/skills** 经查是 refoundai/lenny-skills 的**再托管**（含 problem-definition/usability-testing 等），故未重复收，统一以 refoundai 原仓为准。

---

## 7. 能力矩阵（功能维度）

| 能力点 | anthropics | impeccable | binggg | leonxlnx | garrytan-rv | design-flow | assimovt-pv | owl 体系 | Claude Design 提示词 |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 反 AI 味禁用清单 | ✅ | ✅ | ✅ | ✅ | ✅ | ◻️ | ❌ | ❌ | ✅ |
| 可机械执行自检(grep/评分/rubric) | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ◻️ | ◻️ |
| 浏览器截图自检闭环 | ❌ | ✅(live) | ❌ | ❌ | ✅ | ✅(P7) | ❌ | ❌ | ✅(verifier子agent) |
| 审查→修复→复验闭环 | ❌ | ✅ | ◻️ | ❌ | ✅ | ◻️ | ❌ | ◻️ | ✅ |
| 真实产物(HTML/图/文件) | ◻️ | ✅ | ◻️ | ◻️ | ✅ | ✅ | ❌ | ❌ | ✅✅ |
| 生命周期编排(多阶段串联) | ❌ | ◻️ | ❌ | ❌ | ❌ | ✅✅ | ❌ | ❌ | ✅✅ |
| 问题定义/可裁决 | ❌ | ❌ | ❌ | ❌ | ◻️ | ◻️ | ✅✅ | ◻️ | ◻️ |
| 产品/UX 研究(persona/journey/JTBD) | ❌ | ❌ | ❌ | ❌ | ◻️ | ◻️ | ✅ | ✅✅ | ❌ |
| 验证复盘(A/B/可用性/retro) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| 中文场景适配 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ◻️ |
| 宿主无关(universal) | ✅ | ◻️ | ✅ | ✅ | ❌ | ◻️ | ✅ | ✅ | —(官方内嵌) |
| 零配置即用 | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | —|

**矩阵读出的空白对角线**：没有任何一个社区 skill 同时做到「**反 AI 味 + 截图自检闭环 + 真实产物 + 生命周期编排 + 宿主无关 + 中文 + 零配置**」。Claude Design 提示词在生成/编排/验证侧做到了，但①它不开源、②不覆盖②⑧、③绑 Claude.ai 专有工具。这条对角线 = 自建机会。

---

## 8. 推荐：该装哪些 / 怎么组合 / 避开哪些

> 针对你的实际情况（CC 为主、做大量 web 前端、维护对外分享插件仓库）。

### 8.1 按 8 维各取一个"首选" 

| 维度 | 首选 | 备选/中文 |
|------|------|------|
| ①问题定义 | **assimovt-problem-validation**(可裁决) | pop-define-jtbd-canvas |
| ②用户研究 | **owl-user-persona + journey-map** | assimovt-user-interview+synthesis · c0ldsmi1e |
| ③信息架构 | **dembrandt-information-architecture** | julianoczkowski-IA(要落盘文档时) |
| ④界面生成 | **anthropics-frontend-design** + shadcn | impeccable(深度) · contsun(中文B端) |
| ⑤视觉风格 | **anthropics / impeccable** | binggg(中文) · leonxlnx(刻度盘) |
| ⑥设计系统 | **owl-design-token + governance** | wshobson-patterns · arvindrk(逆向抽) |
| ⑦设计评审 | **jezweb-design-review**(轻) / garrytan(重) | dembrandt-nielsen · owl-critique |
| ⑧验证复盘 | **pop-measure-experiment-design** | owl-usability-test-plan · lyndonkl-retros |
| 🔗编排 | **julianoczkowski-design-flow** | — |

### 8.2 怎么组合
- **个人前端生产**：anthropics(基线) → impeccable(命令+硬规则) → jezweb-design-review + Playwright MCP(截图审查)。
- **产品/UX 全流程**：assimovt-problem-validation → owl-user-persona → owl-journey-map → dembrandt-IA → (设计) → owl-usability-test-plan → pop-iterate-retrospective。
- **中文场景**：binggg(规范+grep) + contsun(B端原型) + alsoforever(方法论速查)。
- 配置：impeccable 需 `node scripts/context.mjs`；arvindrk 需 `npx playwright install chromium`；sleek 需付费 key；pop/owl 系注意补齐 references。

### 8.3 避开哪些
- **akhilbhima**(换皮)、**mattpocock-design-an-interface**(已弃用)、数十个 `frontend-design-2/3`、`ui-ux-pro-max-2/3` 衍生(同质)。
- **garrytan 三件套**：除非深用 gstack——方法论顶级但强绑私有 CLI + CDP 接管真实浏览器(登录态截图泄露面)。借方法论别整装。
- **依赖 refs 才完整的**(tommygeoco / shubhamsaboo / pop 系 / lyndonkl / cognitive-design)：单装是空壳，要用回原仓取全。
- **sleek**：除非愿付费 + 接受数据上云。

---

## 9. 设计方案：往 ameng-skill 仓库加什么 design skill

### 9.1 现有不足（即第 5/7 节的盲区）
1. **生命周期两端薄**：①问题定义/③信息架构/⑧验证复盘 全是 guide-only + 模板外置，没有"可运行产真实文件"的。
2. **"产出 + 自检闭环"都绑工具链**：impeccable 绑 Node、garrytan 绑 gstack CDP、jezweb 绑 MCP、sleek 绑付费 API、design-flow 绑同仓兄弟 skill。**没有一个轻量、宿主依赖最小、中文友好的**。
3. **②研究 与 ④生成 断裂**：研究产物喂不进生成 skill。
4. **你已有资产被浪费**：`ameng-ppt-design` 已实现 OKLCH token + 6 主题 + 逐页 PNG 自检 + validate + Tweaks 就地编辑——而 **Claude Design 系统提示词第 4.4 节恰好给了这套"verifier 子 agent / EDITMODE 协议 / starter 组件"的官方蓝本**，可平移到通用前端设计。
5. **编排层缺位**：只有 design-flow 一个编排器且绑同仓。中文/宿主无关的"设计生命周期编排"是空白。

### 9.2 推荐自建 / 拆分（与已有 skill 形成矩阵）

你的仓库现状：`ameng-ppt-design`(演示) + `ameng-skill-scout`(调研)。建议按"**先点后线**"加：

1. **`ameng-design-review`（首选第一步，低风险高价值）** —— 宿主无关的设计审查 skill：浏览器截图取证 + 反 AI slop 评分 + 7 维审查 + 审→修→复验闭环。融 jezweb 的 7 维表 + garrytan 的 AI Slop 黑名单/双评分/baseline 回归 + Claude Design 的 **verifier 子 agent 模式**，去掉 gstack 绑定，复用 ppt-design 的 Playwright 截图能力。**填"宿主无关截图审查"这个明确空白。**
2. **`ameng-frontend-craft`（主力第二步）** —— 有设计主见、反 slop、自带截图自检的通用前端生成器。融 anthropics 原则 + impeccable 命令体系(精简 6–8 个) + binggg 的 grep 自检 + ppt-design 的 token/PNG 自检 + Claude Design 的 **Tweaks/EDITMODE 编辑协议**。中英双语、宿主依赖最小(截图走 Playwright MCP，缺则降级 grep)。
3. **`ameng-design-flow`（可选第三步，编排）** —— 宿主无关、中文友好的设计生命周期编排器：按 ①问题定义→②用户研究→③IA→④⑤⑥生成→⑦评审→⑧验证 串联，借 design-flow 的"阶段门控 + `.design/<slug>/` 断点续跑 + 跳过模式"，并**补上 design-flow 缺的②⑧两端**（接 assimovt-problem-validation 式裁决 + owl-usability-test 式验证）。把 craft / review / ppt-design 作为它调用的子环节。

### 9.3 设计草案

#### 方案 A（建议先做）：`ameng-design-review`
- **定位**：给任意 URL/本地页做"反 AI slop 评分 + 多维设计审查 + 截图取证 + 修复建议(可选改)"，宿主无关。
- **能力**：jezweb 7 维 good/bad 表 + garrytan AI Slop 黑名单与双评分(Design Score + Slop Score) + baseline JSON 回归 + dembrandt-nielsen 10 条 + owl-a11y WCAG；**verifier 子 agent 模式**做后台截图自检不污染主上下文。
- **依赖/复杂度**：Playwright MCP（已可用）；即用。
- **目标 Agent**：universal 优先，CC 启用截图增强。

#### 方案 B（主力）：`ameng-frontend-craft`
- **定位**：反 slop + 命令化 + 自带截图自检的通用前端/UI 生成器，中英双语，宿主依赖最小。
- **能力**：反 slop 宪法(融 anthropics+impeccable+binggg 三家禁用清单) + OKLCH token 系统/多主题(移植 ppt-design) + 6–8 个动词命令(craft/audit/polish/bolder/quieter/colorize/typeset) + **grep 提交前自检**(binggg) + **逐页 PNG 截图自检闭环**(ppt-design + Claude Design verifier 模式) + **Tweaks/EDITMODE 就地编辑协议**(Claude Design 官方契约，ppt-design 已落地)。
- **依赖/复杂度**：Playwright MCP(可选增强，缺则降级 grep 自检)；无私有 CLI/付费 API/强制 Node 脚本；即用。
- **与现有关系**：与 ppt-design 共享 token/自检/编辑引擎，各管"网页"与"演示"；触发词错开(网页/组件/页面 vs ppt/slides)。

#### 方案 C（可选）：`ameng-design-flow`
- **定位**：宿主无关、中文友好的设计生命周期编排器，补全 8 维(尤其②⑧)。
- **能力**：阶段序列(问题定义→研究→IA→生成→评审→验证) + 阶段门控(announce/confirm) + `.design/<slug>/` 持久化断点续跑 + 跳过模式；各阶段调用现成方法(借 assimovt/owl/dembrandt 的可执行框架) + 调 craft/review/ppt-design 作子环节。
- **依赖/复杂度**：依赖 A/B 两个 skill；需配置。

> **落地顺序**：A(design-review，范围清晰、复用 ppt-design 截图、填明确空白) → B(frontend-craft，完整生成+自检) → C(design-flow，编排封顶)。三者 + ppt-design 共用一套"token + 截图自检 + EDITMODE 编辑"引擎，形成 ameng 设计 skill 矩阵。

---

## 附录

### A. 搜索关键词
- 英文：design · ui/ux design · frontend · design system · wireframe · prototype · ui components · visual design · design review · tailwind · shadcn · landing page · information architecture · card sorting · jobs to be done · design brief · usability testing · ab testing · design retrospective · user interview · user research
- 中文：界面设计 · 原型 · 图文排版 · 信息架构 · 可用性测试
- 平台：`npx skills find` · `npx clawhub@latest search/inspect` · `gh search code/repos` · `gh api .../git/trees`

### B. 未找到 / 无结果
- ClawHub 搜"界面设计/信息架构/可用性测试/design retrospective"中文长词基本无召回（需用英文词）。
- skills.sh 搜"图文排版"无结果。
- pop / owl / lyndonkl / tommygeoco / shubhamsaboo / cognitive-design 等的 references/兄弟 skill 未随附（已逐个标注 "refs缺"）。

### C. SPA 站点直链（自行翻完整列表）
- skills.sh：https://skills.sh/?q=design · ?q=ui+design · ?q=information+architecture · ?q=design+brief
- ClawHub：https://clawhub.ai/skills?q=design · ?q=ux · ?q=user+research
- 头部代表：anthropics frontend-design(https://skills.sh/anthropics/skills/frontend-design) · pbakaus/impeccable(⭐3k) · garrytan/gstack · owl-listener/designer-skills · product-on-purpose/pm-skills · julianoczkowski/designer-skills

### D. 重点参考资料
- **Claude Design 系统提示词**：`_reference-claude-design-system-prompt/Claude-Design-Sys-Prompt.txt`（来源 github.com/elder-plinius/CL4R1T4S，逆向归档，422 行）。**这是本研究参考价值最高的单份资料**——见第 4 节。

### E. 下载产物
- 本研究文件夹下 63 个 `[来源]-作者-skill名/` 目录(各含 SKILL.md + _source.yaml) + 1 个 `_reference-claude-design-system-prompt/`。
- 下载脚本：`_download.sh`(第一轮 41) + `_download2.sh`(第二轮 22)，可复跑/扩充。
</content>
