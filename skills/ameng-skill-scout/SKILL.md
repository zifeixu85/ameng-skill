---
name: ameng-skill-scout
description: >
  调研某个主题下「现有的 AI Skill」：搜索、下载、分析，并产出一份结构化研究报告。
  自动从主流 Skill 市场（skills.sh、ClawHub、SkillsMP、GitHub awesome 列表等）搜索并下载相关 Skill
  （覆盖 Claude Code / Codex / OpenClaw / Hermes 等多种 Agent 生态，中英文 Skill 都收录），
  执行安全审查、用户体验与自动化方式分析、Agent 兼容性评估、跨 Skill 组合分析。
  开工前先做一次简短的需求澄清（intake），让报告方向与建议贴合用户真实意图；
  支持「仅研究」「研究 + 推荐」「研究 + 设计方案」三种产出模式。
  当用户说「研究 skill」「调研 skill」「收集 skill」「分析 skill」「survey skills for X」
  「what skills exist for X」，或想了解某主题已有哪些 Skill 时触发。
metadata:
  author: A梦 (ameng)
  homepage: https://github.com/zifeixu85/ameng-skill#ameng-skill-scout
---

# Skill Scout（ameng-skill-scout）

> 作者 / Author: **A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

对指定主题进行 Skill 全网调研、下载、分析、产出研究报告的完整流程。
覆盖 **Claude Code / Codex / OpenClaw / Hermes** 等多种 Agent 生态，**中英文 Skill 均收录**。

工作分四步：**先澄清需求 → 搜索下载 → 分析 → 出报告**。最终产物是一个**扁平、自包含**的研究文件夹。

---

## 输出约定（扁平、自包含、零外部依赖）

一次研究 = 一个文件夹，默认建在**当前工作目录**下（或用户指定路径）：

```
<topic>-skills-research/
├── [source]-skill-a/        # 下载的 Skill 原件（扁平，一个 Skill 一个目录）
│   ├── SKILL.md             # 原样保留，不修改
│   └── _source.yaml         # 额外记录来源信息
├── [source]-skill-b/
├── ...
└── REPORT.md                # 研究报告（唯一产物文档）
```

- 不依赖任何外部目录模板 / registry / index 文件——开箱即用，谁装上都能直接跑。
- 目录名前缀 `[source]` 标注「**在哪个平台发现/下载**的」，不是 Skill 本身的格式。

| 发现来源 | 目录名前缀 | 说明 |
|---------|-----------|------|
| skills.sh | `[skills.sh]-` | 通过 `npx skills find` 发现 |
| ClawHub | `[clawhub]-` | 通过 `npx clawhub@latest search` 发现 |
| GitHub | `[github]-` | 通过 `gh search` / WebSearch 发现 |
| SkillsMP | `[skillsmp]-` | 通过 skillsmp.com 发现 |
| 其他平台 | `[平台名]-` | 如 `[termo]-`、`[mcpmarket]-` |

示例：`[github]-jackwener-xhs-cli`、`[clawhub]-borye-xhs-mcp`、`[skills.sh]-comeonzhj-note-creator`

> 同一 Skill 在多个平台都有时，只记录**首次发现**的来源。

`_source.yaml` 记录格式：

```yaml
url: "https://..."
fetched_at: "YYYY-MM-DD"
source_type: "github | marketplace | community"
skill_format: "claude-code | codex | openclaw | hermes | universal"
```

---

## Phase 0：需求澄清 intake（必做，除非用户已说清）

**这是本 Skill 与普通「直接开搜」最大的区别。** 开工前先对齐方向——否则报告极易跑偏，
盘点了一堆用户根本不关心的东西。

- 若用户在触发消息里**已经讲清楚**的项，**不要重复问**。
- 用**一次 AskUserQuestion**（≤4 题）把没说清的补齐。问题设计见 [references/intake.md](references/intake.md)。

需要对齐的四个要点：

1. **产出模式（最关键）**
   - `research-only`：只盘点现状，不下判断——客观呈现有哪些、各是什么。
   - `research + 推荐`：在盘点基础上给「该装哪些、怎么组合、避开哪些」的明确建议。
   - `research + 设计方案`：再进一步，提出自建 / 拆分 Skill 的设计草案。
2. **深度**：`快扫`（Top ~10 关键代表）/ `彻查`（30+，尽量全覆盖）。
3. **目标 Agent / 宿主**：Claude Code / Codex / OpenClaw / Hermes / 不限——决定兼容性分析的侧重。
4. **使用场景一句话**：用户最终想拿这些 Skill 干嘛——决定报告的取舍与推荐口径。

把答案原样记进报告开头的「研究设定」区块，后续每一步都围绕它取舍。

---

## Phase 1：搜索与下载

按以下来源**分批**搜索，结果统一存入研究文件夹，扁平结构，目录名用 `[来源]-skill名`。

### 搜索策略（按优先级执行）

**Step 1 — 平台 CLI 搜索**（最高效，直接查索引；注意 skills.sh / ClawHub 是 SPA，WebFetch 拿不到结果，必须走 CLI）

```bash
# skills.sh — 记录每个 Skill 的安装量 installs
npx skills find "<topic-en>"
npx skills find "<中文关键词>"
npx skills find "<缩写/别名>"

# ClawHub — 记录相关性评分
npx clawhub@latest search "<topic-en>"
npx clawhub@latest search "<中文关键词>"
npx clawhub@latest search "<缩写/别名>"
```

对每个关键词（中文 / 英文 / 缩写）在两个平台分别搜索，结果汇总去重。

**Step 2 — GitHub 代码搜索**（覆盖未上架市场的 Skill）

```bash
gh search code "<topic>" --filename SKILL.md --limit 30
gh search repos "<topic> skill" --limit 20
gh search repos "<topic> openclaw" --limit 20
```

**Step 3 — WebSearch 补充**（覆盖非 GitHub 来源）

- `"<topic>" claude skill`、`"<topic>" codex skill`、`"<topic>" openclaw skill`、`"<topic>" hermes skill`
- `site:skillsmp.com "<topic>"`、`site:claudeskills.com "<topic>"`
- 完整来源清单与查询模板见 [references/sources.md](references/sources.md)。

**Step 4 — 在报告末尾附上 SPA 站点直链**，供用户自行翻完整列表：

- `https://skills.sh/?q=<topic>`
- `https://clawhub.ai/skills?q=<topic>`

### 下载规则

- 优先用 `gh` CLI 克隆/下载 GitHub 仓库中的 skill 目录；**大仓库只取 skill 相关目录**，不要整仓克隆。
- 网页内容用 WebFetch 获取后保存为 `.md`。
- **原始 SKILL.md 保持不修改**；额外信息写进同目录 `_source.yaml`。
- 全程**不保存任何密钥/凭证**到研究文件夹。
- `快扫` 模式：每个来源取最相关的代表即可；`彻查` 模式：尽量收全并去重。

---

## Phase 2：分析

对收集到的每个 Skill 阅读全部内容后，按以下维度记录。

### 2.1 逐个 Skill 分析

| 维度 | 说明 |
|-----|------|
| **Skill 格式** | `claude-code` / `codex` / `openclaw` / `hermes` / `universal`（纯 SKILL.md，跨宿主通用） |
| **Agent 兼容性** | 能在哪些宿主上跑：Claude Code / Codex / OpenClaw / Hermes。标注宿主特定依赖（如 hooks 仅 Claude Code、某些 slash-command 集成）。多数纯 SKILL.md 为 `universal` |
| **类型** | `guide-only`（纯指南）/ `script-bundled`（含脚本）/ `api-dependent`（依赖外部 API）/ `mcp-dependent`（依赖 MCP Server）/ `browser-automation`（浏览器自动化）/ `hybrid` |
| **自动化方式** | 浏览器：Playwright / Puppeteer / Selenium / Chrome CDP；API：REST / GraphQL / SDK；无则填「—」 |
| **用户操作复杂度** | `即用`（装上即用或仅需登录）/ `需配置`（API key 或多步安装）/ `需开发`（开发环境 + 复杂配置） |
| **安全性** | 按类型分层检查，见 [references/security-checklist.md](references/security-checklist.md)，标 `safe` / `caution` / `danger` |
| **能力覆盖** | 该 Skill 解决的具体问题列表 |
| **依赖项** | 外部 API、npm/pip 包、MCP Server、浏览器引擎等 |
| **可复用价值** | 哪些内容可以直接借用或改编 |

> 涉及内容发布的 Skill，在安全检查中一并评估发布风险（平台限流、封号等），不单独列维度。

### 2.2 跨 Skill 组合分析

逐个分析后，做跨 Skill 的组合分析：

1. **工作流组合** — 找出可串联成完整链路的 Skill 组合（如：内容生成 → 排版 → 配图 → 发布）。
2. **互补与冲突** — 标注功能互补关系与高度重叠的 Skill，建议保留哪个。

---

## Phase 3：产出报告

把分析结果写入研究文件夹根目录的 `REPORT.md`，遵循 [references/report-template.md](references/report-template.md)。

**报告章节随产出模式收放：**

| 章节 | research-only | + 推荐 | + 设计方案 |
|-----|:---:|:---:|:---:|
| 1 研究设定（intake 结论） | ✅ | ✅ | ✅ |
| 2 概览与统计 | ✅ | ✅ | ✅ |
| 3 Skill 清单与分类（总表） | ✅ | ✅ | ✅ |
| 4 详细分析（每个 Skill 卡片） | ✅ | ✅ | ✅ |
| 5 能力矩阵 | ✅ | ✅ | ✅ |
| 6 跨 Skill 组合方案 | ✅ | ✅ | ✅ |
| 7 推荐：该装哪些 / 怎么组合 / 避开哪些 | — | ✅ | ✅ |
| 8 设计方案：自建 / 拆分 Skill 草案 | — | — | ✅ |

`research-only` 模式到第 6 节为止，**只呈现、不下判断**。

---

## Phase 4：收尾

1. 向用户呈现报告摘要：收集数量、关键发现、（若有）推荐结论。
2. 列出研究文件夹路径，提示 `REPORT.md` 与下载的 Skill 原件位置。
3. 问用户下一步方向（深入某个 Skill / 调整模式 / 扩大范围 / 进入设计）。

**不**写任何 registry / index / 状态机文件——保持扁平自包含。

---

## 注意事项

- 搜索使用**中英文双语 + 缩写**关键词扩大覆盖。
- 同时覆盖 Claude Code / Codex / OpenClaw / Hermes 多生态 Skill。
- 某来源无结果时跳过，并在报告中注明。
- 大仓库只下载 skill 相关目录。
- 研究文件夹内不保存任何密钥或凭证。
- 报告语言跟随用户偏好（默认中文）。
- 默认假设用户网络可正常访问各平台；不做地域网络可用性判定。
