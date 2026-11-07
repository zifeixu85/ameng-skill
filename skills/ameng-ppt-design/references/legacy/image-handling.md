# image-handling.md — 用户图片素材：收图 → 看图 → 适配版位

> [screenshot-framing.md](screenshot-framing.md) 管「怎么把图美化得像印在好纸上」（框/阴影/裁切原则）。
> 这一篇管它的上游：**用户给了图片素材之后，从接收到摆进版位的完整流水线** ——
> 特别是图片原始比例 ≠ 版位比例时，怎么决定裁切方向 / 留白 / 主体对位。
> 组件在 `components.css`（`.frame--cover` / `.frame--contain` / `.obj-*` / `--frame-ar` / `--frame-bg`）。

---

## 流水线（用户提供了图就必须走，不可跳过）

### ① 收图：拷进 deck 自己的 images/

用户给的图（路径 / 拖进来的文件 / 项目里的截图）**先拷贝**进 `slides/<name>/images/`，
按 [screenshot-framing.md](screenshot-framing.md) 的规范命名：`NN-语义.ext`。

```bash
cp <用户给的路径> slides/my-talk/images/03-dashboard.png
```

HTML 里**只用相对路径** `images/03-dashboard.png` 引用——deck 才能整体搬走（eject.sh）、
导出 HTML 才能 base64 内联。**绝不引用 deck 目录之外的绝对路径。**

### ② 看图：每张图先用 Read 工具真的看一遍

**别只看文件名就摆版**。逐张用 Read 打开图片，记下三件事（建议直接写成清单贴在回复里）：

1. **原始尺寸与比例**（`sips -g pixelWidth -g pixelHeight <img>` 或看图估）→ 决定它能进什么版位、能不能放大。
2. **核心主体在哪个区域**（人脸/产品/图表的关键区落在 上/中/下 × 左/中/右 哪一格）→ 决定 cover 裁切时 `.obj-*` 往哪边对。
3. **图的类型**：照片/实拍（可裁）· 信息图/表格/全屏 UI（边缘有信息，**不可裁**）· 带透明底的图标/logo（contain + 留白）。

### ③ 配版位：按决策树选适配方式

```
版位比例 与 图片比例 差多少？
├─ ≈ 相同（差 <15%）      → 默认 .frame 即可（height:auto 自然贴合），微差用 .frame--cover 吃掉
├─ 差得多 + 图是照片/实拍   → .frame--cover + .obj-*（按②看到的主体位置对准；主体居中就不用 .obj-*）
├─ 差得多 + 图是信息图/表格/全屏 UI（裁了会丢信息）
│                         → .frame--contain + --frame-bg（从图里取个相近底色，别留白洞）
│                            或者：换一个比例更合的版位（grid-2 半栏 ↔ 全宽行），版位迁就图
└─ 图太小（长边 <1600px）  → 绝不放大到糊；改小版位（半栏/三分之一栏）让它按原尺寸级别展示，
                             或按 image-prompts.md 重做一张
```

写法示例（版位锁 4:3、主体在右上的产品照）：

```html
<div class="frame frame--cover frame--shadow obj-tr" style="--frame-ar: 4/3">
  <img src="images/03-product.jpg" alt="产品特写" width="1600" height="1200">
</div>
```

### ④ 复核：图片也走溢出与 PNG 闸门

- `check-overflow.mjs` 量的是**每个元素**，`<img>`/`.frame` 越界一样 FAIL——锁了
  `aspect-ratio` 的 `.frame--cover/--contain` 基本不会撑爆；**裸 `.frame`（height:auto）
  放高图是最常见的溢出源**，高图一律改 cover/contain。
- render.sh 出 PNG 后逐页看：**裁切有没有切掉主体？contain 的留白色和页面底色搭不搭？**
  切到主体 → 换 `.obj-*` 方向或改 contain；留白突兀 → 调 `--frame-bg`。

---

## 品牌 LOGO（三槽位，不做背景水印）

用户给了 LOGO（intake ①素材里注明）时，只在**三个受控槽位**出现，绝不做背景水印
（压正文、破对比度，已在产品决策里明确排除）：

1. **chrome 角标**：`<span class="chrome-top__brand"><img class="brand-logo" src="images/logo.svg" alt="品牌名" width="96" height="24"> <b>品牌名</b></span>` —— 高度锁 1.35em，随 chrome 走全 deck。
2. **封面 lockup**：封面顶部 `<div class="brand-lockup"><img class="brand-logo" …><i class="brand-lockup__sep"></i><span class="brand-lockup__txt">日期 · 场合</span></div>`。
3. **收尾页**：复用 `.brand-lockup` 居中，配联系方式。

素材要求：**透明底 PNG/SVG**；明暗各一版时成对放
`<img class="brand-logo brand-logo--light" …><img class="brand-logo brand-logo--dark" …>`，
T 键切明暗（`.deck[data-theme="dark"]`）自动换版；单版通吃就只放一个 `.brand-logo`。
LOGO 同样过「先 Read 看图」流水线：白底 JPG 混进来要提醒用户换透明底，别硬贴。

---

## 图片红线（与 anti-slop 同级，P0）

- **禁拉伸变形**：永远不许给 `img` 同时写死 width+height 让它非等比拉伸；变形 = 立刻判负。
  比例不合只有三条路：cover 裁、contain 留白、换版位。
- **禁糊图放大**：长边 <1600px 的图不放进大于半栏的版位（见 screenshot-framing.md 尺寸规范）。
- **满版图压文字必须有遮罩**：图当背景、文字压在上面时，文字下方必须有 scrim
  （深色渐变层 / `.bg-fade` / 半透明色块），裸压 = AI slop 经典败笔。
- **信息图不许 cover 裁切**：表格/图表/全屏 UI 边缘就是信息，裁了等于造假；一律 contain 或换版位。
- **`<img>` 必写 `alt` + 显式 `width`/`height`**（validate.mjs 查 alt；宽高防布局抖动）。

## 截图可读性（最常见的实战翻车）

**截图里的文字如果在最终页面上读不出来，这张图等于没放。** 聊天记录、文件树、
全屏 UI 这类「文字墙截图」塞进半栏小版位 = 一团灰噪点（真实案例：聊天长截图缩到
手机壳大小、Obsidian 目录树缩成邮票）。处理顺序：

1. **裁局部放大**：从原图裁出真正要给观众看的那 2–3 行/那一块，放大到可读——
   一页只讲一个点，截图也只给那一个点。
2. **独占大版位**：信息密集截图给 ≥2/3 页宽（全宽行或 grid-2 的大格），文案让位。
3. **拆页**：一页放大图 + 一页讲解，好过一页里互相挤。
4. **改示意**：如果观众根本不需要读原文（只需要知道"有这么个东西"），
   换成 `.flow`/`.layers` 示意图 + 一句话，比糊截图诚实。
5. **超长截图（聊天记录/朋友圈长图）→ `.frame--scroll` 自动滚动**：完整原图放进固定窗口，
   放映时缓慢下滚再回到顶部（`--pan-to` = -(1 - 可见比例)，`--pan-dur` 控速）；
   **导出/打印自动定格在顶帧**，reduced-motion 下静止显示顶帧。既保全内容又保可读。

**判定标准**：原图里的正文文字，落到 1280 舞台上有效高度 **≥ 11px** 才算可读
（粗略换算：截图缩放比 = 版位宽/原图宽，原文字高 × 缩放比 ≥ 11px）。达不到就回到上面四选一。

## 多图同页

- 同页并排的图**统一一个 `--frame-ar`** + 同一套框/阴影（screenshot-framing.md 铁律），
  比例不一的原图靠 `.frame--cover` 各自对主体——版位齐了页面才齐。
- 一页 **≤2 张主图**；更多图改成「1 主大图 + 缩略行」或拆页，别铺图墙。
