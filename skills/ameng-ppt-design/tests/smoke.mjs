#!/usr/bin/env node
// smoke.mjs — regression run: scaffold → edit in a real browser → save back → export → verify the package.
//   node tests/smoke.mjs        (needs Chrome; add --themes to also run check.mjs on all six)
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../scripts/lib/cdp.mjs";

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (script, ...a) => execFileSync(process.execPath, [join(skill, "scripts", script), ...a], { encoding: "utf8" });
const work = mkdtempSync(join(tmpdir(), "deck-smoke-"));
let failed = 0;
const ok = (name, pass) => { console.log((pass ? "ok   " : "FAIL ") + name); if (!pass) failed++; };

run("new-deck.mjs", "demo", "--theme", "block", "--dir", work, "--title", "测试", "--brand", "品牌");
const deck = join(work, "demo"), file = join(deck, "index.html");
ok("new deck is self-contained", existsSync(join(deck, "kit", "kit.js")));
writeFileSync(file, readFileSync(file, "utf8").replace("</div>\n</main>", `<section class="slide" data-layout="chart-full" data-sample><h2 class="title">测试图</h2><figure class="chart" data-type="bar"><script type="application/json">{"categories":["甲","乙"],"series":[{"name":"数","values":[1,2]}]}</` + `script></figure><aside class="notes">备注</aside></section>\n</div>\n</main>`));

const url = run("serve.mjs", deck, "--no-open").trim().replace("URL: ", "");
const p = await launch({ width: 1600, height: 900 });
try {
  await p.goto(url); await p.sleep(600);
  ok("server detected", await p.eval("new Promise(r=>setTimeout(()=>r(window.Editor&&Editor.isServed()),300))"));
  await p.eval("Editor.toggle();1");
  await p.eval("(()=>{const t=document.querySelector('.slide.is-active .title');t.textContent='改过 <的> 标题';t.dispatchEvent(new InputEvent('input',{bubbles:true}));})()");
  await p.eval("Editor.toggle();1"); await p.sleep(900);
  let src = readFileSync(file, "utf8");
  ok("text saved to file, escaped", src.includes("改过 &lt;的&gt; 标题"));
  ok("no runtime leftovers in file", !/data-rt|contenteditable|class="chrome|is-active|data-editable/.test(src));
  await p.eval("Deck.go(1,{instant:true});Editor.toggle();1");
  await p.eval("document.querySelector('.slide.is-active .chart').click();1"); await p.sleep(150);
  await p.eval("(()=>{const i=document.querySelectorAll('.grid-edit input')[3];i.value='9';i.dispatchEvent(new Event('input',{bubbles:true}));})()"); await p.sleep(100);
  await p.eval("Editor.toggle();1"); await p.sleep(900);
  ok("chart data saved", /"values":\[9,2\]/.test(readFileSync(file, "utf8")));
  /* regressions from the code review */
  await p.eval("Deck.go(0,{instant:true,force:true});1");
  await p.eval("(()=>{const h=document.createElement('div');h.className='hero';h.textContent='1,280';Deck.slides[0].appendChild(h);Deck.go(1,{instant:true});Deck.go(0,{force:true});Deck.setTheme('noir');})()");
  await p.sleep(2600);
  ok("saving during an entrance keeps the real number", /1,280/.test(readFileSync(file, "utf8")) && !/class="ln/.test(readFileSync(file, "utf8")));
  await p.eval("Deck.go(1,{instant:true});Editor.toggle();document.querySelector('.slide.is-active .chart').click();1"); await p.sleep(150);
  await p.eval("(()=>{const i=document.querySelectorAll('.grid-edit input')[3];i.value='</script><b>x';i.dispatchEvent(new Event('input',{bubbles:true}));})()"); await p.sleep(100);
  await p.eval("Editor.toggle();1"); await p.sleep(900);
  await p.goto(url); await p.sleep(400);
  ok("chart text cannot break the file", await p.eval("Deck.slides.length===2&&!!Deck.slides[1].querySelector('.chart svg')"));
  /* loops run on screen and never reach the file */
  writeFileSync(file, readFileSync(file, "utf8").replace("</div>\n</main>", `<section class="slide" data-layout="steps"><h2 class="title">步骤</h2><div class="steps"><div class="step"><span class="step__dot">1</span><h3>甲</h3><p>说明</p></div><div class="step"><span class="step__dot">2</span><h3>乙</h3><p>说明</p></div></div></section>\n</div>\n</main>`));
  await p.goto(url); await p.sleep(400);
  await p.eval("Deck.go(2,{instant:true});1"); await p.sleep(2600);
  ok("loop runs inside the page", await p.eval("document.querySelectorAll('.slide.is-active .loop-dot').length>0"));
  await p.eval("Editor.save(true).then(()=>1)"); await p.sleep(300);
  ok("loop never saved", !/loop-dot|loop-orbit/.test(readFileSync(file, "utf8")));
  await p.eval("Deck.go(1,{instant:true});1"); await p.sleep(200);
  ok("loop stops on leaving", await p.eval("document.querySelectorAll('.loop-dot').length===0"));
  await p.eval("Presenter.toggle();1"); await p.sleep(200);
  ok("presenter opens", await p.eval("document.querySelector('.speaker').classList.contains('is-open')&&document.querySelectorAll('.speaker .ov-mini').length>=1"));
  ok("no page errors", p.logs.length === 0);
} finally { await p.close(); }

const out = run("export.mjs", deck, "--pptx");
const pptx = join(deck, "demo.pptx");
ok("pptx written", out.includes("PPTX") && existsSync(pptx));
const list = execFileSync("unzip", ["-l", pptx], { encoding: "utf8" });
ok("native chart + workbook inside", /ppt\/charts\/chart1\.xml/.test(list) && /Microsoft_Excel_Sheet1\.xlsx/.test(list));
ok("speaker notes inside", /notesSlide1\.xml/.test(list));
const slide = execFileSync("unzip", ["-p", pptx, "ppt/slides/slide1.xml"], { encoding: "utf8" });
ok("title is a real placeholder", /<p:ph type="title"\/>/.test(slide));
ok("user text escaped in xml", slide.includes("改过 &lt;的&gt; 标题"));
ok("single file builds", run("bundle.mjs", deck).includes("single.html"));

/* edge inputs must still make a clean package */
const edge = join(work, "edge.html");
const chart = (t, j) => `<section class="slide" data-layout="chart-full" data-sample><h2 class="title">${t}</h2><figure class="chart" data-type="${t}"><script type="application/json">${JSON.stringify(j)}</` + `script></figure></section>`;
const edgeSlides = [
  chart("bar", { categories: [], series: [{ name: "空", values: [] }] }),
  chart("bar", { categories: ["甲", "乙"], series: [{ name: "负", values: [-3, -8] }] }),
  chart("line", { categories: ["甲", "乙"], series: [{ name: "零", values: [0, 0] }] }),
  chart("scatter", { points: [{ name: "甲", x: 1, y: 2, group: "A" }, { name: "乙", x: 2, y: 1, group: "B" }] }),
  chart("pie", { categories: ["甲"], values: [5] }),
  `<section class="slide" data-layout="table"><h2 class="title">表😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀</h2><table class="data"><tr><th colspan="2">合并</th><th>丙</th></tr><tr><td><br></td><td rowspan="2">二</td><td>三</td></tr><tr><td>四</td><td>五</td></tr></table></section>`,
  `<section class="slide" data-layout="statement" data-hidden><h2 class="title">隐藏页</h2><svg viewBox="0 0 10 10" style="width:100px"><line x1="0" y1="0" x2="100%" y2="50%" stroke="red" opacity="0"/><rect width="100%" height="100%" fill="none"/></svg></section>`,
].join("\n");
writeFileSync(join(deck, "edge.html"), readFileSync(file, "utf8").replace(/(<div class="stage">)[\s\S]*(<\/div>\s*<\/main>)/, (_, a, b) => a + edgeSlides + b));
const edgeOut = run("export.mjs", join(deck, "edge.html"), "--pptx", "--name", "edge");
ok("edge cases export", edgeOut.includes("PPTX"));
const parts = execFileSync("unzip", ["-Z1", join(deck, "edge.pptx")], { encoding: "utf8" }).split("\n").filter((f) => /\.xml$/.test(f) && !f.startsWith("["));
let bad = parts.filter((f) => { const x = execFileSync("unzip", ["-p", join(deck, "edge.pptx"), f], { encoding: "utf8", maxBuffer: 1e8 }); return /NaN|undefined|Infinity|sz=""/.test(x); });
ok("no NaN or undefined in xml" + (bad.length ? ": " + bad.join() : ""), !bad.length);
const gridOk = /<a:gridCol[^>]*\/><a:gridCol[^>]*\/><a:gridCol[^>]*\/>/.test(execFileSync("unzip", ["-p", join(deck, "edge.pptx"), "ppt/slides/slide6.xml"], { encoding: "utf8" }));
ok("merged cells keep three columns", gridOk);

/* a custom style from a description */
run("new-style.mjs", deck, "teststyle", "--name", "测试风格", "--base", "noir", "--decor");
let withStyle = readFileSync(file, "utf8");
ok("custom style is switched on", /data-theme="noir" data-style="teststyle"/.test(withStyle) && /deck-style" content="teststyle\|测试风格\|noir"/.test(withStyle));
writeFileSync(join(deck, "styles", "teststyle.css"), readFileSync(join(deck, "styles", "teststyle.css"), "utf8").replace(/--accent:#\w+; --brand:#\w+;/, "--accent:#2c6e6a; --brand:#1f5c58;"));
const url2 = run("serve.mjs", deck, "--no-open").trim().replace("URL: ", "");
const q = await launch({ width: 1600, height: 900 });
try {
  await q.goto(url2); await q.sleep(500);
  await q.eval("new Promise(r=>{const t=setInterval(()=>{if(window.Editor&&Editor.isServed()){clearInterval(t);r(1)}},50)})");
  ok("custom tokens apply", (await q.eval("getComputedStyle(Deck.slides[0]).getPropertyValue('--brand').trim()")) === "#1f5c58");
  ok("custom style listed first in the theme menu", await q.eval(`document.querySelector('[data-m="theme"] button').dataset.stylePick==='teststyle'`));
  await q.eval(`document.querySelector('[data-m="theme"] [data-theme-pick="swiss"]:not([data-style-pick])').click();1`); await q.sleep(2600);
  ok("built-in theme clears the custom style", !/data-style=/.test(readFileSync(file, "utf8").match(/<main[^>]*>/)[0]));
  await q.eval(`document.querySelector('[data-style-pick="teststyle"]').click();1`); await q.sleep(2600);
  ok("custom style can be picked again", /data-style="teststyle"/.test(readFileSync(file, "utf8").match(/<main[^>]*>/)[0]));
} finally { await q.close(); }
ok("custom style exports", run("export.mjs", deck, "--pptx").includes("PPTX"));
const theme1 = execFileSync("unzip", ["-p", pptx, "ppt/theme/theme1.xml"], { encoding: "utf8" });
ok("custom colors reach the pptx theme", /2C6E6A/.test(theme1));
ok("single file carries the style", readFileSync(join(deck, run("bundle.mjs", deck).trim().split("  ")[0].split("/").pop()), "utf8").includes("#1f5c58"));

if (process.argv.includes("--themes")) for (const t of ["paper", "noir", "swiss", "spec", "block", "board"]) {
  let pass = true;
  try { run("check.mjs", join(skill, "templates", "showcase.html"), "--theme", t); } catch { pass = false; }
  ok("check passes: " + t, pass);
}
try { execFileSync("pkill", ["-f", deck]); } catch { /* already gone */ }
rmSync(work, { recursive: true, force: true });
console.log(failed ? `\n${failed} 项失败` : "\n全部通过");
process.exit(failed ? 1 : 0);
