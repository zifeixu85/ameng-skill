# ameng-skill

> A梦 (ameng) 分享的一组 Agent Skills，用来提升日常工作效率。
> 跨 **Claude Code / Codex / OpenClaw / Hermes** 使用，会持续增加更多 Skill。

A collection of Agent Skills shared by **A梦 (ameng)**. Works across Claude Code / Codex / OpenClaw / Hermes.

## Skills

| Skill | 一句话 | 说明 |
|------|--------|------|
| [`ameng-skill-scout`](skills/ameng-skill-scout) | 调研某主题下现有的 AI Skill，出研究报告 | 搜索→下载→分析→报告；先问需求，支持仅研究 / +推荐 / +设计方案三档 |
| [`ameng-ppt-design`](skills/ameng-ppt-design) | 有设计主见的 HTML 演示/PPT 生成器 | OKLCH 设计系统 + 6 主题 + 16:9/9:16/Swiss；右上角**就地编辑 + 版本历史 + 一键导出 PDF/PPTX/PNG/HTML** |

_（更多 Skill 持续增加中……）_

## 安装

### 方式一：作为 Claude Code 插件市场（推荐，可一键装全部 + 自动更新）

```text
/plugin marketplace add zifeixu85/ameng-skill
/plugin install ameng-skill@ameng-skill
```

### 方式二：手动复制单个 Skill

```bash
git clone https://github.com/zifeixu85/ameng-skill.git
cp -r ameng-skill/skills/ameng-skill-scout ~/.claude/skills/ameng-skill-scout
```

### 其它宿主（OpenClaw / Hermes / Codex）

每个 Skill 都是纯 `SKILL.md`（跨宿主通用），把对应 `skills/<name>` 目录放进各宿主的 skills 目录即可。

## 仓库结构

```
ameng-skill/
├── .claude-plugin/
│   └── marketplace.json        # Claude Code 插件市场清单
├── skills/
│   └── ameng-skill-scout/      # 每个 Skill 一个目录，名字带 ameng- 前缀
│       ├── SKILL.md
│       ├── README.md
│       └── references/
├── README.md
└── LICENSE
```

## 新增 Skill 的约定

1. 在 `skills/` 下新建 `ameng-<name>/`，至少含 `SKILL.md`。
2. `SKILL.md` frontmatter 里 `name:` 用带前缀的 `ameng-<name>`，并写 `version` 与 `metadata.author: A梦 (ameng)`。
3. 把 `./skills/ameng-<name>` 加进 `.claude-plugin/marketplace.json` 的 `skills` 数组。
4. 在上面的「Skills」表里加一行。

## 许可 / License

MIT © A梦 (ameng)。可自由使用、修改、分享，请保留作者署名。
MIT licensed — free to use, modify, and share; please keep the attribution.
