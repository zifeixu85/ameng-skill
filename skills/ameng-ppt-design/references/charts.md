# 图表

一份 JSON 同时驱动两种输出：网页里是带动画和悬停提示的 SVG，导出 PPTX 时是 PowerPoint 原生图表或可编辑形状。

```html
<figure class="chart" data-type="hbar" aria-label="项目停滞原因占比">
  <script type="application/json">{"unit":"%","highlight":"没有业务负责人","categories":["没有业务负责人","流程没改"],"series":[{"name":"占比","values":[41,24]}]}</script>
</figure>
```

## 选哪种图

| 想说明 | data-type | 数据写法 | PPTX 里 |
|---|---|---|---|
| 几个类别比大小 | `bar` | `categories` + `series` | 原生 |
| 排名，或标签很长 | `hbar` | 同上 | 原生 |
| 两组对比 | `bar` | `series` 两组 | 原生 |
| 总量和构成都要看 | `bar` + `"stacked":true` | 同上 | 原生 |
| 趋势 | `line` | `categories` + `series`（最多 4 条）| 原生 |
| 累计趋势 | `area` | 同上，可加 `"stacked":true` | 原生 |
| 占比，有中心数字 | `donut` | `parts:[{name,value}]`，`center`、`centerLabel` | 原生环 + 可改文字 |
| 简单占比（3–6 项）| `pie` | `parts` | 原生 |
| 多维能力对比 | `radar` | `categories` + `series`，`max` | 原生 |
| 两个变量的关系 | `scatter` | `points:[{name,x,y}]`，`xLabel`、`yLabel` | 原生 |
| 三个变量 | `bubble` | `points:[{name,x,y,r}]` | 原生 |
| 一步步走到结果 | `waterfall` | `steps:[{name,value,total?}]` | 形状 |
| 转化与流失 | `funnel` | `stages:[{name,value}]` | 形状 |
| 一个有上限的指标 | `gauge` | `value`、`max`、`target`、`label` | 形状 |
| 两个维度下的强度 | `heatmap` | `rows`、`cols`、`values` | 形状 |
| 很多项目的占比 | `treemap` | `items:[{name,value}]` | 形状 |
| 流向和去向 | `sankey` | `links:[{from,to,value}]` | 形状 |
| 两个时点的变化 | `slope` | `items:[{name,from,to}]`，`labels` | 形状 |
| 多项前后差距 | `dumbbell` | `items:[{name,from,to}]`，`labels` | 形状 |
| 实际对目标 | `bullet` | `items:[{name,value,target,max}]` | 形状 |
| 时间安排 | `gantt` | `tasks:[{name,start,end,hot?}]` | 形状 |
| 一百格看占比 | `waffle` | `parts` | 形状 |
| 指标卡里的小趋势 | `spark` | `values` | 形状 |

「形状」也都能在 PowerPoint 里单独改，只是没有数据表。

## 通用选项

`unit` 单位 · `prefix` 前缀 · `decimals` 小数位 · `compact:"zh"` 显示万、亿 · `highlight` 要突出的类别或系列 · `labels:"all"|"max"|"last"|"none"` · `smooth:false` 折线不平滑 · `zero:false` 不从 0 开始。

## 规矩

- 数字必须真实。出处写进 `.source`；示例数字给 `<section>` 加 `data-sample`，页面会自动出现「示例数据」标签。检查脚本会拦下既没出处也没标示例的图表。
- 没有数据就不画数据图。流程、结构、取舍画成 `steps`、`matrix`、`cycle`、`layers`，这些不需要数字。
- 突出一项时用 `highlight`：它用主色，其余退成灰。主色给故事的主角，不一定是最大的那项。
- 只用一条纵轴。两种单位的数据拆成两张图（`duo` 版式）。
- 系列颜色按主题的固定顺序，不要手写颜色。
- 配色校验：六套主题的前四色都过了色盲区分和相邻色差；它们有意做成一个主色加中性色，所以不会过「彩度」这一项，身份靠图例和直接标注，不只靠颜色。
