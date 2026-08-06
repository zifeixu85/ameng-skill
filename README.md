# A梦 Agent Skills 工具箱

一组面向真实工作任务的通用 Agent Skills。每个 Skill 都可以独立安装，适用于 Claude Code、Codex、WorkBuddy、OpenClaw、Hermes 等支持 `SKILL.md` 的 Agent 产品。

- [在线查看工具箱与使用示例](https://zifeixu85.github.io/ameng-skill/)
- [下载完整新手包](https://zifeixu85.github.io/ameng-skill/downloads/agent-skills-starter-kit.zip)

## 8 个可以直接安装的 Skill

| Skill | 用来做什么 | 你可以直接这样说 |
|---|---|---|
| [`ameng-skill-scout`](skills/ameng-skill-scout) | 搜索、下载和分析某个主题下已有的 Skill | “帮我研究有哪些适合做市场调研的 Skill” |
| [`ameng-ppt-design`](skills/ameng-ppt-design) | 生成可放映、可分享链接的 HTML 演示文稿 | “把这份大纲做成一套 16:9 的演示文稿” |
| [`ameng-meeting-clarifier`](skills/ameng-meeting-clarifier) | 把逐字稿整理成结论、决定和行动项 | “整理这份会议记录，别替我补负责人” |
| [`ameng-weekly-review`](skills/ameng-weekly-review) | 从零散记录生成周报、复盘和下周计划 | “把这些记录整理成对外周报和个人复盘” |
| [`ameng-content-repurpose`](skills/ameng-content-repurpose) | 把一份内容改造成长文、短帖、邮件或口播 | “把这次分享改成文章和 60 秒口播” |
| [`ameng-data-insight`](skills/ameng-data-insight) | 检查表格数据并找出趋势、异常和下一步 | “分析这个 CSV，先告诉我数据质量问题” |
| [`ameng-learning-digest`](skills/ameng-learning-digest) | 把文章、PDF、字幕变成能理解和复习的材料 | “帮我吃透这份资料，再出 5 道问题检查我” |
| [`ameng-project-validator`](skills/ameng-project-validator) | 找出项目最危险的假设并设计最小验证 | “别急着夸这个想法，先帮我设计七天验证” |

## 另外推荐的 2 个成熟工具

这两个项目已有成熟入口，我们不重复打包，只提供原作者链接和使用建议。

1. [AI HOT Agent](https://aihot.virxact.com/agent)：直接获取中文 AI 日报、精选和事件时间线，无需 API Key。
2. [PPT Master](https://github.com/hugohe3/ppt-master)：生成可继续编辑的 PPTX 源文件。我们的 `ameng-ppt-design` 更适合生成 HTML 演示和分享链接，两者解决的问题不同。

## 安装

### Claude Code

先添加一次市场，然后按需安装：

```text
/plugin marketplace add zifeixu85/ameng-skill
/plugin install ameng-skill-scout@ameng-skill
/plugin install ameng-weekly-review@ameng-skill
```

把第二行的 Skill 名替换成表格中的任意名称即可。

### Codex / WorkBuddy / OpenClaw / Hermes

下载仓库或新手包，把需要的整个 Skill 文件夹放进对应产品的 Skills 目录。不要只复制 `SKILL.md`，因为部分 Skill 还会使用同目录中的参考文件、脚本和模板。

## 许可与来源

本仓库采用 MIT License。部分通用 Skill 吸收并改写自 MIT 开源项目，完整来源与版权信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
