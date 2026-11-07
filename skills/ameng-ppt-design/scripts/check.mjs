#!/usr/bin/env node
// check.mjs — the quality gate. Reads the rendered deck, not just the source:
// real pixels behind every line of text, real geometry of every element.
//   node scripts/check.mjs <deck-folder|index.html> [--theme x] [--invert] [--json]
// Exit 0 = pass (warnings allowed), 1 = must fix, 2 = could not run.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { launch } from "./lib/cdp.mjs";
import { locate, serveFile } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const input = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--theme");  /* --invert = the T key: the opposite light/dark */
if (!input) { console.error("用法: node scripts/check.mjs <deck 文件夹或 index.html> [--theme x] [--json]"); process.exit(2); }

/* Runs inside the page */
function collect() {
  const LEAF = ".title,.lead,.body,.small,.cap,.source,.kicker,.by,.next,.hero,.sec-num,.kpi__label,.kpi__value,.kpi__delta,.versus__head,.versus__tag,li,td,th,h3,.point b,.point span,.step p,.step__dot,.tl__when,.tl p,.mx b,.mx span,.ring__node b,.ring__node span,.ring__core b,.ring__core span,.layer b,.layer span,.price,.callout,.meta span,.agenda b,.agenda .d,.agenda .n,.n,.seal,.code,.chrome b,.chrome .sec,.folio";
  const k = Deck.stage.getBoundingClientRect().width / 1920 || 1;
  const box = (r) => ({ x: r.left / k, y: r.top / k, w: r.width / k, h: r.height / k });
  return Deck.slides.map((s, i) => {
    const cs = getComputedStyle(s), L = s.getAttribute("data-layout") || "";
    const safe = { l: parseFloat(cs.paddingLeft), t: parseFloat(cs.paddingTop), r: 1920 - parseFloat(cs.paddingRight), b: 1080 - parseFloat(cs.paddingBottom) };
    const texts = [];
    s.querySelectorAll(LEAF).forEach((el) => {
      if ((el.closest("[data-rt]") && !el.closest(".chrome")) || el.closest(".chart,.notes")) return;
      if ([...el.children].some((c) => c.matches(LEAF))) return;
      const t = el.textContent.trim(); if (!t) return;
      const ecs = getComputedStyle(el);
      if (ecs.display === "none" || ecs.visibility === "hidden") return;
      const r = document.createRange(); r.selectNodeContents(el);
      const rects = [...r.getClientRects()].filter((q) => q.width > 1 && q.height > 1).map(box);
      if (!rects.length) return;
      /* colored text may come from a run inside; sample the deepest colored element */
      let color = ecs.color;
      const run = el.querySelector("em,b,strong"); if (run && run.textContent.trim() === t) color = getComputedStyle(run).color;
      const clip = ecs.webkitBackgroundClip === "text" || ecs.backgroundClip === "text";
      const em = [...el.querySelectorAll("em")].some((e) => { const c = getComputedStyle(e); return c.webkitBackgroundClip === "text" || c.backgroundClip === "text"; });
      const nowrap = ecs.whiteSpace === "nowrap";
      texts.push({ tag: (el.getAttribute("class") || el.tagName).split(" ")[0].toLowerCase(), text: t.slice(0, 22), size: parseFloat(ecs.fontSize), color, clip: clip || em, rects, clipped: (ecs.overflow !== "visible" || nowrap) && el.scrollWidth > el.clientWidth + 2 });
    });
    s.querySelectorAll("svg text").forEach((el) => {
      if (el.closest(".deco")) return;
      const t = el.textContent.trim(), c = getComputedStyle(el), b = el.getBoundingClientRect(); if (!t || !b.width) return;
      const m = el.getScreenCTM(), scale = m ? Math.hypot(m.a, m.b) / k : 1;
      texts.push({ tag: "svg", svg: true, text: t.slice(0, 22), size: parseFloat(c.fontSize) * scale, color: c.fill, rects: [box(b)] });
    });
    /* what the audience sees before the first click */
    const area = (e) => { const b = e.getBoundingClientRect(); return (b.width / k) * (b.height / k); };
    const stepped = [...s.querySelectorAll("[data-step]")].filter((e) => !e.parentElement.closest("[data-step]")).reduce((n, e) => n + area(e), 0);
    const hotCount = Math.max(...[".tiers", ".kpis", ".matrix", ".layers"].map((q) => { const g = s.querySelector(q); return g ? g.querySelectorAll(".is-hot,.kpi--hot").length : 0; }));
    const out = [];
    s.querySelectorAll("*").forEach((el) => {
      if (el.closest("[data-rt],.notes,.deco,.media,.fx,.meta") || el.matches("script,aside,em,b,strong,small")) return;
      if (el.closest("svg")) return;
      const c = getComputedStyle(el); if (c.display === "none" || c.position === "absolute" && !el.closest(".ring")) return;
      const b = box(el.getBoundingClientRect()); if (b.w < 2 || b.h < 2) return;
      const over = Math.max(safe.l - b.x, safe.t - b.y, b.x + b.w - safe.r, b.y + b.h - safe.b);
      if (over > 3) out.push({ tag: (el.getAttribute("class") || el.tagName).split(" ")[0], over: Math.round(over) });
    });
    /* decoration crossing the running head or folio */
    const chromeBoxes = [...s.querySelectorAll(":scope > .chrome b, :scope > .chrome .sec, :scope > .chrome .folio")].map((c) => box(c.getBoundingClientRect())).filter((b) => b.w > 1);
    let decoHit = "";
    if (chromeBoxes.length) s.querySelectorAll(".deco svg *, .deco > div").forEach((d) => {
      /* a soft glow's box may reach a corner without painting anything there; pixels cover that case */
      if (decoHit || d.matches("defs,g,svg") || /gradient/.test(getComputedStyle(d).backgroundImage)) return;
      const b = box(d.getBoundingClientRect()); if (b.w < 1 || b.h < 1 || b.w > 1500) return;
      const c = chromeBoxes.find((q) => b.x < q.x + q.w && q.x < b.x + b.w && b.y < q.y + q.h && q.y < b.y + b.h);
      if (c) decoHit = "页眉或页码";
    });
    const title = s.querySelector(".title");
    let lastLine = null, lines = 0;
    if (title) {
      const r = document.createRange(), w = document.createTreeWalker(title, NodeFilter.SHOW_TEXT); let n, top = null, cur = 0;
      while ((n = w.nextNode())) for (let c = 0; c < n.length; c++) {
        r.setStart(n, c); r.setEnd(n, c + 1); const q = r.getClientRects()[0]; if (!q || !q.width) continue;
        if (top === null || q.top > top + q.height * .6) { lines++; cur = 0; top = q.top; }
        cur++;
      }
      lastLine = cur;
    }
    return {
      n: i + 1, layout: L, sample: s.hasAttribute("data-sample"), hasNotes: !!(s.querySelector(":scope > .notes") && s.querySelector(":scope > .notes").textContent.trim()),
      hasChart: !!s.querySelector(".chart:not(.kpi__spark)"), hasSource: !!s.querySelector(".source") || s.hasAttribute("data-source"),
      chars: texts.reduce((a, t) => a + t.text.length, 0), fullChars: s.innerText ? s.innerText.replace(/\s/g, "").length : 0, texts, out: out.slice(0, 3), titleLines: lines, lastLine,
      hasTitle: !!title, decoHit, stepped, hotCount, stepCount: s.querySelectorAll("[data-step]").length
    };
  });
}

/* Runs inside the page: median colour under each text box, from a text-free screenshot */
function sample(png, list, k) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
      const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const f = im.width / 1920;
      res(list.map((t) => t.rects.slice(0, 3).map((r) => {
        const px = [], cols = 7, rows = 3;
        for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
          const d = x.getImageData(Math.max(0, Math.min(im.width - 1, (r.x + r.w * (a + .5) / cols) * f)), Math.max(0, Math.min(im.height - 1, (r.y + r.h * (b + .5) / rows) * f)), 1, 1).data;
          px.push([d[0], d[1], d[2]]);
        }
        px.sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]));
        return px[Math.floor(px.length / 2)];
      })));
    };
    im.src = "data:image/png;base64," + png;
  });
}

const lin = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
const lum = (c) => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const sat = (c) => { const m = Math.max(...c), n = Math.min(...c); return m ? (m - n) / m : 0; };
const rgb = (css) => { const m = css.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; };

const { file, root } = await locate(input);
const source = await readFile(file, "utf8");
const server = createServer((req, res) => serveFile(root, new URL(req.url, "http://x").pathname, res));
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const page = await launch();
const issues = [];
const add = (level, n, msg) => issues.push({ level, n, msg });

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/${relative(root, file).split("\\").join("/")}?static`);
  if (opt("theme")) await page.eval(`Deck.setTheme(${JSON.stringify(opt("theme"))})`);
  if (args.includes("--invert")) await page.eval(`Deck.el.toggleAttribute("data-invert");Deck.dress();1`);
  await page.eval(`(()=>{const s=document.createElement("style");s.textContent=".stage.is-textless .slide *{color:transparent!important;-webkit-text-fill-color:transparent!important;-webkit-text-stroke:0!important;text-emphasis-color:transparent!important}.stage.is-textless svg text{fill:transparent!important}.stage.is-textless .title em,.stage.is-textless .hero,.stage.is-textless .lead em{background-image:none!important}";document.head.append(s)})()`);
  /* every slide must be laid out and visible while measuring, not just the active one */
  await page.eval(`Deck.stage.classList.add("is-measuring");1`);
  const slides = await page.eval(`(${collect})()`);
  await page.eval(`Deck.stage.classList.remove("is-measuring");1`);
  if (!slides.every((s) => s.texts.length || /^image-/.test(s.layout))) add("WARN", 0, "有页面读不到文字，检查可能不完整");

  for (const s of slides) {
    await page.eval(`Deck.go(${s.n - 1},{instant:true,force:true,step:99});Deck.stage.classList.add("is-textless");1`);
    await page.sleep(70);
    const shot = await page.send("Page.captureScreenshot", { format: "png" });
    await page.eval(`Deck.stage.classList.remove("is-textless");1`);
    const bgs = await page.eval(`(${sample})(${JSON.stringify(shot.data)},${JSON.stringify(s.texts)},1)`);

    s.texts.forEach((t, i) => {
      if (t.size < 21) add(t.svg ? "WARN" : "FAIL", s.n, `字太小：「${t.text}」${Math.round(t.size)}px（最小 21px，放映看不清）`);
      /* the bottom of a screen is behind the audience's heads */
      if (/^(title|lead|body|next|hero|by|h3|sec-num)$/.test(t.tag) && Math.max(...t.rects.map((r) => r.y + r.h)) > 930) add("FAIL", s.n, `内容太靠下，会被前排挡住：「${t.text}」`);
      const cap = t.tag === "hero" ? 288 : t.tag === "sec-num" ? 200 : /^kpi__value|^price/.test(t.tag) ? 112 : 136;
      if (t.size > cap + .5) add("FAIL", s.n, `字太大：「${t.text}」${Math.round(t.size)}px（上限 ${cap}px）`);
      if (t.clipped) add("FAIL", s.n, `文字被裁切：「${t.text}」`);
      if (t.clip || /,\s*0\)$/.test(t.color) || t.color === "transparent") return;
      const fg = rgb(t.color);
      for (const bg of bgs[i]) {
        const c = ratio(fg, bg), big = t.size >= 40;
        const fill = sat(bg) > .45 && lum(bg) < .3; /* above this, white cannot reach 3:1 */
        if (fill && lum(fg) < .35) { add("FAIL", s.n, `色块上的文字要用白色：「${t.text}」`); break; }
        if (c < 3) { add("FAIL", s.n, `文字和背景对比度不够（${c.toFixed(1)}）：「${t.text}」`); break; }
        if (!big && c < 4.5) { add("WARN", s.n, `小字对比度偏低（${c.toFixed(1)}）：「${t.text}」`); break; }
      }
    });
    /* text colliding with text */
    const rs = s.texts.flatMap((t) => t.rects.map((r) => ({ ...r, t: t.text })));
    outer: for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) {
      if (rs[a].t === rs[b].t) continue;
      const ox = Math.min(rs[a].x + rs[a].w, rs[b].x + rs[b].w) - Math.max(rs[a].x, rs[b].x), oy = Math.min(rs[a].y + rs[a].h, rs[b].y + rs[b].h) - Math.max(rs[a].y, rs[b].y);
      if (ox > 4 && oy > Math.min(rs[a].h, rs[b].h) * .35) { add("FAIL", s.n, `文字互相重叠：「${rs[a].t}」和「${rs[b].t}」`); break outer; }
    }
    if (s.out.length && !/^image-/.test(s.layout)) add("FAIL", s.n, `内容超出安全区 ${s.out[0].over}px：${s.out[0].tag}`);
    if (s.decoHit) add("FAIL", s.n, `装饰图形压住了${s.decoHit}`);
    if (s.stepped > 1696 * 816 * .45) add("WARN", s.n, "分步内容占了大半页，第一屏会很空：先显示主体，只把后几项做成分步");
    if (s.hotCount > 1) add("WARN", s.n, `同一组里有 ${s.hotCount} 个高亮：重点只给一个`);
    if (!s.hasNotes) add("WARN", s.n, "没有讲者备注");
    if (!s.hasTitle && !/^(number|image-full)$/.test(s.layout)) add("WARN", s.n, "这一页没有 .title，PowerPoint 大纲里会空着");
    if (s.hasChart && !s.sample && !s.hasSource) add("FAIL", s.n, "图表没有出处：加 .source，或给 section 标 data-sample（示例数据）");
    if (s.titleLines > 3) add("WARN", s.n, `标题 ${s.titleLines} 行，太长`);
    if (s.titleLines > 1 && s.lastLine === 1) add("WARN", s.n, "标题最后一行只剩一个字，用 <br> 按语义断行");
    if (s.fullChars > 170) add("WARN", s.n, `这一页字数 ${s.fullChars}，偏多，把细节放进讲者备注`);
  }

  /* a custom style must keep the house rules */
  const fillCss = await page.eval(`(()=>{const c=document.createElement("canvas").getContext("2d");c.fillStyle=getComputedStyle(Deck.el).getPropertyValue("--brand").trim()||"#000";c.fillRect(0,0,1,1);const d=c.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]]})()`);
  const onFill = ratio([255, 255, 255], fillCss);
  if (onFill < 3) add("FAIL", 0, `--brand 太浅，白字读不清（${onFill.toFixed(1)}）：把它压深`);
  else if (onFill < 4.5) add("WARN", 0, `--brand 上的白字偏淡（${onFill.toFixed(1)}）：再压深一点`);

  /* whole-deck rhythm */
  const layouts = slides.map((s) => s.layout);
  const kinds = new Set(layouts).size;
  if (slides.length >= 8 && kinds < 5) add("WARN", 0, `版式只有 ${kinds} 种，整份太单调`);
  for (let i = 2; i < layouts.length; i++) if (layouts[i] && layouts[i] === layouts[i - 1] && layouts[i] === layouts[i - 2]) add("WARN", i + 1, `连续三页都是 ${layouts[i]}`);
  const graphic = slides.filter((s) => /chart|duo|kpis|steps|cycle|hub|matrix|timeline|layers|table|shot|image/.test(s.layout)).length;
  if (slides.length >= 8 && graphic / slides.length < .4) add("WARN", 0, "图形页不到四成，内容可能都是文字");
  if (/<style[\s>]/i.test(source.replace(/<script[\s\S]*?<\/script>/g, ""))) add("WARN", 0, "deck 里写了 <style>：优先用版式和 token，不要自造组件");
  if (/style="[^"]*#[0-9a-f]{3,8}/i.test(source)) add("WARN", 0, "内联样式里写死了颜色，换主题时会出错，改用 var(--token)");
  if (/\p{Extended_Pictographic}/u.test(source.replace(/<script[\s\S]*?<\/script>/g, ""))) add("WARN", 0, "用了 emoji 当图标");
  if (page.logs.length) add("WARN", 0, "页面报错：" + page.logs[0]);

  const fails = issues.filter((i) => i.level === "FAIL").length, warns = issues.length - fails;
  if (args.includes("--json")) console.log(JSON.stringify({ slides: slides.length, fails, warns, issues }, null, 1));
  else {
    const seen = new Set();
    issues.sort((a, b) => (a.level === b.level ? a.n - b.n : a.level === "FAIL" ? -1 : 1)).forEach((i) => {
      const line = `${i.level === "FAIL" ? "✗" : "·"} ${i.n ? "第 " + i.n + " 页 " : ""}${i.msg}`;
      if (!seen.has(line)) { seen.add(line); console.log(line); }
    });
    console.log(`RESULT: ${fails ? "FAIL" : "PASS"} · ${slides.length} 页 · ${kinds} 种版式 · ${fails} 必修 · ${warns} 提醒`);
  }
  process.exitCode = fails ? 1 : 0;
} catch (e) {
  console.error("检查没有跑完：" + e.message);
  process.exitCode = 2;
} finally {
  await page.close();
  server.close();
}
