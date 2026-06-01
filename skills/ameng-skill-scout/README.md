# ameng-skill-scout

> 一个用来「调研某主题下现有 AI Skill」的 Agent Skill。
> 搜索 → 下载 → 分析 → 出报告，一条龙；产物是一个扁平、自包含的研究文件夹。
>
> **作者 / Author: A梦 (ameng)** · 自由分享与使用，请保留署名 · Free to use & share — please keep attribution.

## 它做什么

给一个主题（如「小红书内容」「SEO」「做 PPT」），它会：

1. **先澄清需求**（intake）——你想要纯盘点，还是要推荐、要设计方案？扫多广？在哪个 Agent 上用？
2. **全网搜索并下载**相关 Skill——覆盖 skills.sh / ClawHub / SkillsMP / GitHub awesome 列表，
   横跨 **Claude Code / Codex / OpenClaw / Hermes** 多生态，**中英文 Skill 都收**。
3. **逐个分析** + 跨 Skill 组合分析——格式、Agent 兼容性、类型、自动化方式、操作复杂度、安全、能力、依赖、可复用价值。
4. **产出一份 `REPORT.md`**，报告深度随你选的产出模式收放。

## 三种产出模式

| 模式 | 你会得到 |
|-----|---------|
| **仅研究** | 客观盘点：有哪些、各是什么、能力矩阵、可组合链路 |
| **研究 + 推荐** | 再加「该装哪些 / 怎么组合 / 避开哪些」 |
| **研究 + 设计方案** | 再加自建 / 拆分 Skill 的设计草案 |

## 输出长什么样

```
<topic>-skills-research/
├── [github]-someone-cool-skill/
│   ├── SKILL.md            # 原样保留
│   └── _source.yaml        # 来源信息
├── [clawhub]-another-skill/
├── [skills.sh]-yet-another/
└── REPORT.md               # 研究报告
```

扁平、自包含、零外部依赖——不需要任何目录模板或 registry 文件。

## 安装

整库装见仓库根 README。只想单独装这一个：

```bash
# Claude Code（用户级）
cp -r skills/ameng-skill-scout ~/.claude/skills/ameng-skill-scout
```

OpenClaw / Hermes / Codex 等其它宿主：放进各自的 skills 目录即可（纯 SKILL.md，跨宿主通用）。

## 怎么触发

直接说，例如：

- 「研究一下做 PPT 的 skill 有哪些」
- 「调研 SEO 领域的 skill，给我推荐能在 Claude Code 里直接用的」
- 「彻底收集一遍小红书相关 skill 并给我自建方案」
- "survey what skills exist for web scraping"

## 文件结构

```
ameng-skill-scout/
├── SKILL.md                        # 主流程（4 个 Phase）
├── README.md                       # 本文件
└── references/
    ├── intake.md                   # Phase 0 需求澄清问题设计
    ├── sources.md                  # 搜索来源清单 + 查询模板
    ├── security-checklist.md       # 安全/风险分层审查清单
    └── report-template.md          # REPORT.md 输出模板
```

## 许可 / License

由 **A梦 (ameng)** 创作。MIT，可自由使用、修改、分享，请保留作者署名。见仓库根 `LICENSE`。
