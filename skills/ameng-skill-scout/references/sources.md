# Skill 搜索来源

覆盖 Claude Code / Codex / OpenClaw / Hermes 多生态，中英文 Skill 均收。

## 官方来源

| 来源 | URL | 生态 | 说明 |
|-----|-----|------|------|
| Anthropic Skills Repo | github.com/anthropics/skills | Claude Code | 官方示例 Skill |
| Claude Code Docs | code.claude.com/docs/en/skills | Claude Code | 官方技能文档 |
| OpenClaw | openclaw.org | OpenClaw | 开放 Skill 标准 |

## Skill 市场

| 平台 | URL | 生态 | 说明 |
|-----|-----|------|------|
| skills.sh | skills.sh | 多格式 | 跨平台分享平台，`npx skills find` 可查 ⚠️ SPA |
| ClawHub | clawhub.ai | OpenClaw | Agent 生态 Skill 市场，`npx clawhub@latest search` 可查 ⚠️ SPA |
| SkillsMP | skillsmp.com | 多格式 | 大体量索引，自动同步 GitHub |
| ClaudeSkills.com | claudeskills.com | Claude Code | Claude Code 专用策展库 |
| ClaudeSkills.info | claudeskills.info | Claude Code | Skill 浏览/下载市场 |
| SkillHub | skillhub.club | Claude Code | GitHub 自动索引 |
| FindSkill.ai | findskill.ai | 多格式 | 现成 skills 目录 |
| Termo | termo.ai | 多格式 | Skill 目录，有独立页面 |

> ⚠️ **SPA 标记**：该站点为客户端渲染，WebFetch 抓不到搜索结果。
> skills.sh / ClawHub 必须走 CLI（`npx skills find` / `npx clawhub@latest search`），
> 或在报告末尾附直链让用户自行浏览。

## GitHub Awesome 列表

| 仓库 | 特点 |
|-----|------|
| travisvn/awesome-claude-skills | 策展 Skill + 工具 |
| VoltAgent/awesome-agent-skills | 500+ 跨平台 Skill |
| alirezarezvani/claude-skills | 192+ 多领域 Skill |
| sickn33/antigravity-awesome-skills | 1,000+ agentic skills |
| karanb192/awesome-claude-skills | 50+ 验证 Skill |
| ComposioHQ/awesome-claude-skills | 生产力 Skill |
| hesreallyhim/awesome-claude-code | Skills + hooks + 插件 |

## 搜索模板

```bash
# 平台 CLI（最优先 —— SPA 站点只能这样查）
npx skills find "<topic>"
npx clawhub@latest search "<topic>"

# GitHub CLI
gh search code "<topic>" --filename SKILL.md --limit 30
gh search repos "<topic> skill" --limit 20
gh search repos "<topic> openclaw" --limit 20

# WebSearch —— 按生态各打一遍
"<topic>" claude skill
"<topic>" codex skill
"<topic>" openclaw skill
"<topic>" hermes skill
"<topic>" agent skill
"<topic>" site:github.com SKILL.md
"<topic>" site:skillsmp.com
"<topic>" site:claudeskills.com
```

每个关键词都用 **中文 / 英文 / 缩写** 三种形式各搜一遍，结果汇总去重。
