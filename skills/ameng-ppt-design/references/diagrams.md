# diagrams.md — turn "walls of text" into pictures

> A fixed 1280×720 stage never shrinks text. Pure-text slides read as dense and
> are hard to see from the back row. Rule of thumb: **if a slide is a list, ask
> whether it's secretly a picture** — a flow, a comparison, a growing scope, a
> hub-and-spoke. One graphic per slide, then verify with `scripts/render.sh`.
> All primitives below are in `assets/components.css` (token-driven, no hex, 禁蓝-safe).

## When to reach for which

| If the content is… | Use | Class / shape |
|---|---|---|
| an ordered process (3–6 steps) | horizontal stepper | `.evo` + `.ev` (mark key node `.ev--on`) |
| a boundary / scope that grows | expanding bars | `.scope` + `.sc` (set inline `width:%`) |
| A-vs-B with a clear winner | two-zone split | `.zones` (落点 side = `.z--r` accent) |
| A↔B pairs, must read far | big contrast table | `.contrast` + `.cr` |
| tools / products | faux-browser cards | `.prod` (no fake screenshot) |
| a method/relationship | inline `<svg>` | see snippets below |
| an example under a label | example chip | `.ex` → `<span class="ex"><b>例</b> Foo</span>` |
| stage order in a card grid | corner badge | `.nbadge` (1/2/3/4) |
| a person / contact | round avatar + QR | `.avatar-ring`, `.qr` (crop QR to its matrix first) |

## Stepper (process line)

```html
<div class="evo fill anim-stagger">
  <div class="ev"><span class="ev__dot">1</span><div class="ev__v">生成</div><div class="ev__d">让 AI 画出来</div></div>
  <div class="ev"><span class="ev__dot">2</span><div class="ev__v">控制</div><div class="ev__d">稳定、批量、可控</div></div>
  <div class="ev ev--on"><span class="ev__dot">3</span><div class="ev__v">协作</div><div class="ev__d">参与设计过程</div></div>
</div>
```

## Expanding scope (boundary widening)

```html
<div class="scope fill anim-stagger">
  <div class="sc" style="width:40%"><span class="sc__t">界面</span><span class="sc__d">· 按钮 · 排版</span></div>
  <div class="sc" style="width:70%"><span class="sc__t">流程</span><span class="sc__d">· 路径 · 异常</span></div>
  <div class="sc sc--on" style="width:100%"><span class="sc__t">系统</span><span class="sc__d">· 冷启动 · 交付</span></div>
</div>
```

## Two-zone split (A vs B)

```html
<div class="zones fill">
  <div class="z z--l"><div class="z__ic">A · 可自动化</div><div class="z__h">存量问题</div>
    <div class="z__list"><span>规范</span><span>清单</span></div></div>
  <div class="z z--r"><div class="z__ic">B · 靠判断</div><div class="z__h">增量问题</div>
    <div class="z__list"><span>用户是谁</span><span>哪个假设先验证</span></div></div>
</div>
```

## Inline SVG — keep colors as tokens

Inline `<svg>` inherits CSS custom props, so use `fill="var(--accent)"`,
`stroke="var(--line-strong)"`, `fill="var(--ink-1)"`. Give it `role="img"` +
`aria-label`. Size with `style="width:100%;max-width:980px;height:auto"`.

### Double-diamond (Design Council 双钻)

```html
<svg viewBox="0 0 920 300" style="width:100%;max-width:980px;height:auto"
     role="img" aria-label="双钻：理解问题 定义问题 探索方案 验证方案">
  <polygon points="20,150 230,40 440,150 230,260" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width="2"/>
  <polygon points="440,150 650,40 880,150 650,260" fill="var(--accent)" fill-opacity="0.16" stroke="var(--accent)" stroke-width="2"/>
  <circle cx="440" cy="150" r="7" fill="var(--accent)"/><circle cx="880" cy="150" r="7" fill="var(--accent)"/>
  <text x="230" y="22" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">理解问题</text>
  <text x="440" y="292" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">定义问题</text>
  <text x="650" y="22" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink-1)">探索方案</text>
  <text x="880" y="292" text-anchor="middle" font-size="22" font-weight="700" fill="var(--accent)">验证方案</text>
</svg>
```

### Hub-and-spoke (you orchestrating agents)

```html
<svg viewBox="0 0 360 300" style="width:100%;max-width:360px;height:auto"
     role="img" aria-label="设计师在中心编排多个 Agent">
  <line x1="180" y1="150" x2="72" y2="58" stroke="var(--line-strong)" stroke-width="2"/>
  <!-- ...more spokes... -->
  <circle cx="72" cy="58" r="34" fill="var(--surface-1)" stroke="var(--line-strong)" stroke-width="2"/>
  <text x="72" y="64" text-anchor="middle" font-size="16" fill="var(--ink-2)">研究</text>
  <circle cx="180" cy="150" r="48" fill="var(--accent)"/>
  <text x="180" y="146" text-anchor="middle" font-size="19" font-weight="700" fill="var(--accent-ink)">你</text>
</svg>
```

## Motion that survives export (bars/rings that "draw themselves")

Animated charts are great on screen but a trap for export: the in-browser ⤓ export
activates each slide then snapshots ~2 frames later — far short of a 0.7s bar grow —
so a naive chart exports **blank or half-drawn**. (`render.sh` dodges this via a virtual
time budget; the browser export has none.) Two rules make motion export-safe:

1. **Use the built-in entrance primitives**, not hand-rolled keyframes:
   `.fx-grow-y` (bars · put on the bar, height via `--v`), `.fx-pop` (rings/nodes),
   `.fx-breathe` (idle pulse), `.fx-dash` (SVG flow line). They fire only on `.slide.is-active`.
2. **If you must hand-roll a keyframe, author it with `both` fill** and base the element's
   resting style on the END frame (e.g. bar height = full, keyframe animates *from* `scaleY(.06)`).

Why `both` matters: base.css finalizes motion for both `prefers-reduced-motion` **and**
`.deck.ppt-exporting` by collapsing `animation-duration` to ~0. With `both`/`forwards` fill the
element then holds its **end** frame instantly (full bar), so every snapshot is settled.
`animation: none` would instead revert to the *from* state (collapsed) — don't use it for entrances.

Belt-and-suspenders: `export.js` also calls `document.getAnimations().finish()` on each slide right
before snapshot (infinite loops get `.pause()` instead). modern-screenshot inlines
`getComputedStyle(node)` — incl. `transform` — onto the clone, so a *finished* animation means the
exported image gets the settled transform regardless of CSS-timing or a stale cached stylesheet.
If you ever see a chart export half-drawn, first **hard-refresh** so the latest `export.js`/`toolbar.css` load.

```html
<div class="bars">
  <div class="life-col"><div class="fx-grow-y" style="height:28%"></div><span>问题定义</span></div>
  <div class="life-col"><div class="fx-grow-y" style="height:100%"></div><span>界面生成</span></div>
</div>
```

## Safe-area discipline (why slides overflow)

`.deck--chrome .slide` content must live in roughly **y ∈ [85, 636]** of the 720 stage
(top bar + footer eat the rest). The stage does **not** auto-shrink text, so a nested
grid of tall cards spills both up (over the title) and down (under the footer),
especially with `align-items:center`. Checklist:

- one core idea + one graphic per slide; lists ≤ 4 rows, card body ≤ 2 lines
- prefer a graphic primitive over a 6-item bullet list
- after building, run `scripts/render.sh deck.html` and look at **every** PNG
- numeric gate (optional): in devtools, the bbox of every non-`.notes` element
  should sit within `[76, 644]`; anything outside is an overflow to fix
