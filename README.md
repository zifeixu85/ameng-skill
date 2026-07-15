# ameng-skill

> 我是 **A梦**—— 前阿里体验设计专家 / 现独立产品开发者。
> 这里是我**按自己真实工作方式**打磨的一组 Agent Skills，跨 **Claude Code / Codex / OpenClaw / Hermes** 使用，持续更新。
> 每个 Skill 都可**单独安装**，按下面的顺序挑你需要的就行。

A set of Agent Skills by **A梦 (ameng)**, an ex-designer turned solo product builder. Each skill installs independently — pick what you need.

---

## ① 先装这个 · `ameng-skill-scout` —— Skill 调研器 🔭

**最通用的一个，建议从它开始。** 想知道某个主题下「已经有哪些 AI Skill」？它替你搜索→下载→分析→出一份结构化研究报告：覆盖 Claude Code / Codex / OpenClaw / Hermes 多生态、中英文都收录，做安全审查 + 体验分析 + 组合分析。开工先问一句需求，支持**仅研究 / +推荐 / +设计方案**三档产出。

→ [`skills/ameng-skill-scout`](skills/ameng-skill-scout)

```text
/plugin marketplace add zifeixu85/ameng-skill
/plugin install ameng-skill-scout@ameng-skill
```

---

## ② 顺手装 · `ameng-ppt-design` —— 有设计主见的 PPT 生成器 🖼️

把大纲/讲稿做成**全离线、可放映**的静态 HTML 幻灯片。OKLCH 设计系统 + 多主题 + 16:9/9:16/Swiss；右上角浮动工具栏 = **就地编辑（点文字就改、自动存版本、带 diff）+ 一键导出 PDF / PPTX / PNG / 自包含 HTML**。反 AI 味，禁 Inter/Playfair。

→ [`skills/ameng-ppt-design`](skills/ameng-ppt-design)

```text
/plugin install ameng-ppt-design@ameng-skill
```

---

## 安装说明

### Claude Code（推荐，自动更新）

先加一次市场，再按需装：

```text
/plugin marketplace add zifeixu85/ameng-skill
/plugin install ameng-skill-scout@ameng-skill   # ① Skill 调研器（主推）
/plugin install ameng-ppt-design@ameng-skill    # ② PPT 生成器
```

### 手动复制单个 Skill

```bash
git clone https://github.com/zifeixu85/ameng-skill.git
cp -r ameng-skill/skills/ameng-skill-scout ~/.claude/skills/ameng-skill-scout
```

### 其它宿主（OpenClaw / Hermes / Codex）

每个 Skill 都是纯 `SKILL.md`（跨宿主通用），把对应 `skills/<name>` 目录放进各宿主的 skills 目录即可。

---

## 仓库结构

```
ameng-skill/
├── .claude-plugin/
│   └── marketplace.json        # 一个市场，每个 skill 一个独立可装的 plugin
├── skills/
│   ├── ameng-skill-scout/      # ① 主推
│   └── ameng-ppt-design/       # ② 次推
├── README.md
└── LICENSE
```

每个 Skill 一个目录，名字带 `ameng-` 前缀（作者签名）。

## 新增 Skill 的约定

1. 在 `skills/` 下新建 `ameng-<name>/`，至少含 `SKILL.md`。
2. `SKILL.md` frontmatter 里 `name:` 用 `ameng-<name>`，并写 `version` 与 `metadata.author: A梦 (ameng)`。
3. 在 `.claude-plugin/marketplace.json` 的 `plugins` 数组里**新增一条 plugin**（默认一 skill 一 plugin；
   只有概念上属于同一套件、且会合并的，才放进同一个 plugin 的 `skills` 数组）。
4. 在上面按主推优先级插一节。

## 许可 / License

MIT © A梦 (ameng)。可自由使用、修改、分享，请保留作者署名。
MIT licensed — free to use, modify, and share; please keep the attribution.
