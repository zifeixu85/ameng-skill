# 主题 — 5 套**差异化**风格（不是换皮）

每套主题不只是换颜色/字体 —— 它们在**排版、构图、信息密度、装饰语言、气质**上都不同。
主题文件（`assets/themes/*.css`）既覆盖 OKLCH token，也覆盖 `.slide`/`.hl`/`.card`/`.terminal`/chrome
等**结构与组件**。同一份内容套不同主题，会得到**不同的视觉主张**。

> 选主题别只看名字：打开 **`templates/theme-preview.html`** 实时切换对比（同一页代表内容 + 明暗）。
> 5 套的静态预览图在 `screenshots/`（README 有画廊）。

| 主题 | 气质 / 构图 | 字体 | 高亮 `.hl` | 装饰 | 适用 |
|-----|-----------|------|-----------|------|------|
| **industrial-paper**（旗舰/默认） | 暖纸感、有主张、工业；中密度、编辑式 chrome | Bricolage 无衬线 | ember 软色带（微斜） | film grain + terminal + 截图框 | 通用 / 路演 / 技术分享 |
| **neo-brutalist** | 生·响·块；高对比、块状、零圆角 | Bricolage 重体 | **实心色块 + 硬投影** | 粗黑边框 + 硬投影、无颗粒 | 强观点 / 发布 / 吸睛 |
| **editorial** | 杂志/文学；疏朗、低密度、考究 | **衬线**（思源宋/Georgia） | **细下划线**（不抢） | 发丝线 + **首字下沉** + 纸感 | 叙事 / 长文分享 / 品牌 |
| **dark-luxe** | 暗调质感；电影感、玻璃、辉光（深色默认） | Bricolage 无衬线 | **暖金辉光带** | 径向渐变底 + 毛玻璃卡 + 辉光 | 产品发布 / 高端路演 / 夜场 |
| **swiss-intl** | 瑞士国际主义；理性、超大字、严格左对齐网格 | **Helvetica Neue** | **红色关键词文字**（不加带） | 细分隔线、极简、零阴影、大留白 | 数据 / 报告 / 强排版 |

## 怎么选
- 想**稳妥有质感**的默认 → `industrial-paper`
- 想**抓眼球、有态度** → `neo-brutalist`
- 想**安静、高级、可读性强的叙事** → `editorial`（也最适合 9:16 竖屏图文）
- 想**夜场 / 产品发布 / 电影感** → `dark-luxe`
- 想**数据驱动、强排版、极简** → `swiss-intl`（也最适合大数字 KPI）

## 明 / 暗
- `industrial-paper · neo-brutalist · editorial · swiss-intl`：放映按 **`T`** 在浅/深之间切。
- `dark-luxe`：本就是暗调主题，`T` 不再切换（专为深色设计）。

## 切换方式
模板 `<head>` 里硬编码 `#theme-link`：
```html
<link rel="stylesheet" id="theme-link" href="../assets/themes/neo-brutalist.css">
```
一个 deck 一个主题（设计时定）。要新建主题：复制一个现成主题 CSS，既改 `:root` token，
也按需覆盖 `.hl`/`.card`/`.terminal`/chrome/`--pad`/`--fs-*` 等结构件——**差异要够大**，别只换色。
