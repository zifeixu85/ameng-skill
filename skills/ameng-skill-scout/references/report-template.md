# 研究报告模板

`REPORT.md` 的输出结构。**第 7、8 节按产出模式收放**：`research-only` 到第 6 节为止。

```markdown
# <主题> Skill 研究报告

> 生成日期：YYYY-MM-DD
> 搜索范围：<来源列表>
> 收集数量：共 N 个 Skill

## 1. 研究设定

- 主题 / 关键词：...
- 产出模式：research-only / +推荐 / +设计方案
- 深度：快扫 / 彻查
- 目标 Agent：Claude Code / Codex / OpenClaw / Hermes / 不限
- 使用场景：<用户一句话需求>

## 2. 概览与统计

简述研究目标、搜索关键词、结果概况，以及按格式/来源的数量分布。

| 来源 | 数量 |   | 格式 | 数量 |
|-----|------|---|------|------|
| skills.sh | ... |   | claude-code | ... |
| clawhub | ... |   | openclaw | ... |
| github | ... |   | universal | ... |
| 其他 | ... |   | ... | ... |

## 3. Skill 清单与分类（总表）

| # | 名称 | 格式 | Agent 兼容 | 类型 | 自动化方式 | 复杂度 | 安全 | 简评 |
|---|-----|------|-----------|------|-----------|--------|------|------|
| 1 | ... | claude-code | CC | guide-only | — | 即用 | safe | ... |
| 2 | ... | openclaw | OC/Hermes | api-dependent | REST | 需配置 | caution | ... |
| 3 | ... | universal | CC/Codex/OC | browser-automation | Playwright | 需开发 | caution | ... |

- **Agent 兼容** 缩写：CC=Claude Code · Codex · OC=OpenClaw · Hermes · 全=universal
- **类型**：guide-only / script-bundled / api-dependent / mcp-dependent / browser-automation / hybrid
- **复杂度**：即用（装上即用/仅登录）→ 需配置（API key/多步安装）→ 需开发（开发环境+复杂配置）

## 4. 详细分析

### 4.N <Skill 名称>

- **来源**：URL
- **格式**：claude-code / codex / openclaw / hermes / universal
- **Agent 兼容性**：能跑在哪些宿主 + 宿主特定依赖（如 hooks 仅 Claude Code）
- **类型**：guide-only / script-bundled / api-dependent / mcp-dependent / browser-automation / hybrid
- **自动化方式**：无 / Playwright / Puppeteer / Chrome CDP / REST API / ...
- **用户操作复杂度**：即用 / 需配置 / 需开发 + 具体步骤
- **安全等级**：safe / caution / danger
  - 安全发现：（若有）
  - 发布风险：（若涉及发布：平台、方式、限流风险、建议评级）
- **能力覆盖**：
  - 能力 1
  - 能力 2
- **依赖项**：无 / 列出具体依赖
- **可复用价值**：哪些部分值得借鉴

## 5. 能力矩阵

| 能力点 | Skill A | Skill B | Skill C | ... |
|-------|---------|---------|---------|-----|
| 能力 1 | ✅ | ❌ | ✅ | ... |
| 能力 2 | ❌ | ✅ | ✅ | ... |

## 6. 跨 Skill 组合方案

### 6.1 工作流链路

**链路 N：<名称>**
```
Skill A（内容生成）→ Skill B（排版）→ Skill C（配图）→ Skill D（发布）
```
- 适用场景：...
- 注意事项：...

### 6.2 互补与冲突

| Skill A | Skill B | 关系 | 说明 |
|---------|---------|------|------|
| ... | ... | 互补 | A 擅长生成，B 擅长发布 |
| ... | ... | 重叠 | 功能 80% 重合，建议保留 A |

<!-- 以下章节仅在「+推荐」「+设计方案」模式输出 -->

## 7. 推荐（仅 +推荐 / +设计方案）

- **该装哪些**：针对用户的目标 Agent 与场景，给出首选组合 + 理由。
- **怎么组合**：推荐链路 + 安装顺序 + 配置注意。
- **避开哪些**：高风险 / 重叠 / 维护停滞的，说明原因。

## 8. 设计方案（仅 +设计方案）

### 8.1 现有 Skill 的不足
- ...

### 8.2 推荐自建 / 拆分方案
1. **<skill-name-1>** — 职责描述
2. **<skill-name-2>** — 职责描述

### 8.3 设计草案
#### 方案 A：<名称>
- 定位 / 包含能力 / 依赖 / 目标 Agent / 复杂度

## 附录

- 搜索关键词完整列表
- 未找到结果的来源
- SPA 站点直链（skills.sh / clawhub 等，供用户自行翻完整列表）
```
