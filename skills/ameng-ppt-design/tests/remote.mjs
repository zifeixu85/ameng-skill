#!/usr/bin/env node
// remote.mjs — phone remote, end to end, in real Chrome: one window is the deck, one is a phone-sized remote.
//   node tests/remote.mjs [deck]      (no deck: builds a small one with steps and a hidden page)
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../scripts/lib/cdp.mjs";
import { TIMER_ZERO, autoStart, elapsed, resolve, toggle } from "../scripts/lib/remote-core.mjs";

const skill = pathResolve(dirname(fileURLToPath(import.meta.url)), "..");
const work = mkdtempSync(join(tmpdir(), "deck-remote-"));
let failed = 0;
const ok = (name, pass, extra = "") => { console.log((pass ? "ok   " : "FAIL ") + name + (extra ? "  " + extra : "")); if (!pass) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 4000, every = 15) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) { if (await fn()) return Math.round(performance.now() - t0); await sleep(every); }
  return -1;
}

/* ---- pure logic --------------------------------------------------------- */
const S = [{ steps: 0 }, { steps: 2 }, { steps: 0, hidden: true }, { steps: 1 }];
ok("next walks steps", resolve({ cmd: "next" }, { i: 1, step: 0 }, S).step === 1);
ok("next skips hidden pages", resolve({ cmd: "next" }, { i: 1, step: 2 }, S).i === 3);
ok("prev lands on the last step, skipping hidden", JSON.stringify(resolve({ cmd: "prev" }, { i: 3, step: 0 }, S)) === '{"i":1,"step":2}');
ok("no page past the end", resolve({ cmd: "next" }, { i: 3, step: 1 }, S) === null);
ok("bad jump refused", resolve({ cmd: "go", i: 99 }, { i: 0, step: 0 }, S) === null && resolve({ cmd: "go", i: "1" }, { i: 0, step: 0 }, S) === null);
const t1 = toggle(TIMER_ZERO, 1000);
ok("timer runs and pauses", elapsed(t1, 3000) === 2000 && elapsed(toggle(t1, 3000), 9000) === 2000);
ok("auto start only once", !autoStart(toggle(t1, 3000), 5000).running);

/* ---- a deck ------------------------------------------------------------- */
let deck = process.argv[2];
if (!deck) {
  execFileSync(process.execPath, [join(skill, "scripts", "new-deck.mjs"), "demo", "--theme", "paper", "--dir", work, "--title", "测试"], { encoding: "utf8" });
  deck = join(work, "demo");
  const f = join(deck, "index.html");
  const extra = `<section class="slide" data-layout="statement"><h2 class="title" data-step="1">分步</h2><p class="lead" data-step="2">第二步</p><aside class="notes">分步备注 &lt;b&gt;不是标签&lt;/b&gt;</aside></section>
<section class="slide" data-layout="statement" data-hidden><h2 class="title">隐藏页</h2></section>
<section class="slide" data-layout="statement"><h2 class="title">最后</h2></section>`;
  writeFileSync(f, readFileSync(f, "utf8").replace(/<\/div>\s*<\/main>/, extra + "</div></main>"));
}
const file = statSync(deck).isDirectory() ? join(deck, "index.html") : deck;
const before = createHash("sha1").update(readFileSync(file)).digest("hex");

/* ---- server ------------------------------------------------------------- */
const env = { ...process.env, DECK_REMOTE_HOME: join(work, "home") };
let urls = {};
function startServer() {
  const proc = spawn(process.execPath, [join(skill, "scripts", "remote.mjs"), deck, "--no-open", "--no-public"], { env, stdio: ["ignore", "pipe", "inherit"] });
  let out = "";
  proc.stdout.on("data", (c) => { out += c; });
  return until(() => /放映页: (\S+)/.test(out) && /手机 局域网: (\S+)/.test(out), 60000, 100).then(() => {
    urls = { deck: out.match(/放映页: (\S+)/)[1], phone: out.match(/手机 局域网: (\S+)/)[1], panel: out.match(/面板[^:]*: (\S+)/)[1] };
    return proc;
  });
}
let server = await startServer();
const token = new URL(urls.phone).pathname.split("/")[1];
const remoteOrigin = new URL(urls.phone).origin, deckOrigin = new URL(urls.deck).origin;
const status = async (u) => (await fetch(u, { redirect: "manual" })).status;

ok("phone page opens with the token", (await status(urls.phone)) === 200);
ok("no token, no page", (await status(remoteOrigin + "/")) === 404);
ok("wrong token, no page", (await status(`${remoteOrigin}/${token.slice(1)}x/`)) === 404);
ok("notes need the token", (await status(`${remoteOrigin}/${"a".repeat(token.length)}/meta`)) === 404);
ok("previews need the token", (await status(`${remoteOrigin}/s/1.webp`)) === 404);
ok("deck files are not on the remote port", (await status(`${remoteOrigin}/index.html`)) === 404 && (await status(`${remoteOrigin}/${token}/index.html`)) === 404 && (await status(`${remoteOrigin}/${token}/../index.html`)) === 404);
ok("panel is not on the remote port", (await status(`${remoteOrigin}/${token}/__remote/panel`)) === 404);
ok("writes refused", (await fetch(urls.phone + "meta", { method: "POST", body: "{}" })).status === 404);
const lan = new URL(urls.phone).hostname;
ok("deck port is not on the network", await fetch(`http://${lan}:${new URL(urls.deck).port}/`, { signal: AbortSignal.timeout(1500) }).then(() => false, () => true));
const raw = (host, path, headers) => new Promise((done) => {
  import("node:http").then(({ request }) => {
    const r = request({ host: "127.0.0.1", port: new URL(deckOrigin).port, path, headers: { Host: host, ...headers } }, (res) => { res.resume(); done(res.statusCode); });
    r.on("error", () => done(0)); r.on("upgrade", () => done(101)); r.end();
  });
});
ok("deck page cannot be framed by another site", (await raw("127.0.0.1:" + new URL(deckOrigin).port, "/index.html", { "Sec-Fetch-Dest": "iframe", "Sec-Fetch-Site": "cross-site" })) === 403);
ok("rebound hostname refused on the deck port", (await raw("evil.example:80", "/__remote/status")) === 403);
const wsHeaders = { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Version": "13", "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==" };
ok("other sites cannot join as a deck", (await raw("127.0.0.1:" + new URL(deckOrigin).port, "/__remote/ws", { ...wsHeaders, Origin: "http://evil.example" })) === 0);
const fromElsewhere = await new Promise((done) => {
  const w = new WebSocket(`ws://${new URL(remoteOrigin).host}/${token}/ws`, { headers: { Origin: "http://evil.example" } });
  w.onopen = () => { w.close(); done(false); }; w.onerror = () => done(true);
});
ok("other sites cannot open the phone socket, even with the token", fromElsewhere);

/* ---- two browsers ------------------------------------------------------- */
const pc = await launch({ width: 1280, height: 720 });
const phone = await launch({ width: 390, height: 844, scale: 2 });
await phone.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const at = () => phone.eval(`document.getElementById('pageNow').textContent`);
const tap = (id) => phone.eval(`document.getElementById('${id}').click();1`);
const deckAt = () => pc.eval("[Deck.index,Deck.step].join()");

try {
  await phone.send("Page.navigate", { url: urls.phone });
  await until(() => phone.eval("document.getElementById('bannerTitle')?.textContent==='电脑放映页没打开'"), 5000);
  ok("no deck open: phone says so and keys are off", await phone.eval(`document.getElementById('bannerTitle').textContent==='电脑放映页没打开'&&document.getElementById('next').disabled`));

  await pc.goto(urls.deck);
  const joined = await until(() => phone.eval(`document.getElementById('banner').hidden&&!document.getElementById('next').disabled`));
  ok("deck opens, phone joins by itself", joined >= 0, joined + "ms");
  const meta = await (await fetch(urls.phone + "meta")).json();
  const n = meta.slides.length;
  ok("phone shows page and total", (await at()) === "1" && (await phone.eval(`document.getElementById('pageAll').textContent`)) === "/ " + n);
  const buttonsReal = await phone.eval(`(()=>{const r=document.getElementById('next').getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.id==='next'&&r.height>=90&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth})()`);
  ok("next key is big, on screen, not covered", buttonsReal);
  ok("screen-on fallback started on http", (await until(() => phone.eval(`!document.getElementById('keepAwake').paused`), 2000)) >= 0);
  ok("deck page has no phone-related overlay", await pc.eval("!document.querySelector('[data-remote]')"));

  /* notes and preview must match the deck on every page */
  let wrong = [];
  for (let i = 0; i < n; i++) {
    await phone.eval(`1`);
    await pc.eval(`Deck.go(${i},{instant:true,step:0});1`);
    await until(async () => (await at()) === String(i + 1), 2000, 5);
    const r = await phone.eval(`({notes:document.getElementById('notes').textContent,src:document.getElementById('nextImg').getAttribute('src')||'',label:document.getElementById('nextLabel').textContent})`);
    const real = await pc.eval(`(Deck.slides[${i}].querySelector(':scope > .notes')||{textContent:''}).textContent.trim()`);
    const fits = await phone.eval(`(()=>{const k=document.getElementById('next').getBoundingClientRect(),n=document.getElementById('notes'),b=n.scrollHeight>n.clientHeight+12;return k.bottom<=innerHeight&&k.height>=90&&document.getElementById('below').hidden===!b})()`);
    if (!fits) wrong.push(`keys or hint@${i + 1}`);
    const steps = meta.slides[i].steps;
    let want = i + 1;
    while (want < n && meta.slides[want].hidden) want++;
    const image = steps ? `s/${i + 1}${steps > 1 ? "-1" : ""}.webp` : `s/${want + 1}${meta.slides[want]?.steps ? "-0" : ""}.webp`;
    const now = await phone.eval(`document.getElementById('nowImg').getAttribute('src')`);
    if (!now.startsWith(steps ? `s/${i + 1}-0.webp` : `s/${i + 1}.webp`)) wrong.push(`current@${i + 1}:${now}`);
    if ((real || "这一页没有备注") !== r.notes) wrong.push(`notes@${i + 1}`);
    if (want < n || steps) { if (!r.src.startsWith(image)) wrong.push(`preview@${i + 1}:${r.src}`); }
  }
  ok(`notes and preview right on all ${n} pages`, !wrong.length, wrong.slice(0, 4).join(" "));
  const dims = await phone.eval(`(async()=>{const i=document.getElementById('nextImg');await i.decode();return i.naturalWidth})()`).catch(() => 0);
  ok("preview image really loads", dims >= 900 || (await phone.eval(`document.getElementById('nextLabel').textContent`)) === "已经是最后一页");

  /* steps */
  const stepped = meta.slides.findIndex((s) => s.steps > 0);
  await pc.eval(`Deck.go(0,{instant:true,force:true,step:0});1`);
  await until(async () => (await at()) === "1");
  if (stepped >= 0) {
    await pc.eval(`Deck.go(${stepped},{instant:true,step:0});1`);
    await until(async () => (await at()) === String(stepped + 1));
    const total = meta.slides[stepped].steps;
    ok("key says next step on a stepped page", (await phone.eval(`document.getElementById('next').textContent`)) === "下一步");
    await sleep(320); await tap("next");
    await until(async () => (await deckAt()) === `${stepped},1`);
    ok("step reveals on the deck", (await deckAt()) === `${stepped},1` && await pc.eval(`getComputedStyle(Deck.slides[${stepped}].querySelector('[data-step="1"]')).visibility!=='hidden'`));
    ok("phone shows the step", (await phone.eval(`document.getElementById('stepNow').textContent`)) === `1/${total} 步`);
    await sleep(320); await tap("prev");
    await until(async () => (await deckAt()) === `${stepped},0`);
    ok("prev undoes the step", (await deckAt()) === `${stepped},0`);
    await sleep(320); await tap("prev");
    await until(async () => (await pc.eval("Deck.index")) === stepped - 1);
    ok("prev leaves the page", (await pc.eval("Deck.index")) === stepped - 1);
    await sleep(320); await tap("next");
    await until(async () => (await deckAt()) === `${stepped},0`);
    for (let k = 0; k < total + 1; k++) { await sleep(320); await tap("next"); await sleep(60); }
    await until(async () => (await pc.eval("Deck.index")) > stepped);
    await sleep(320); await tap("prev");
    await until(async () => (await deckAt()) === `${stepped},${total}`);
    ok("prev from the next page lands on the last step", (await deckAt()) === `${stepped},${total}`);
  }

  /* real touch: swipe left and right, and what must not turn the page */
  await phone.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const swipe = async (x0, y0, x1, y1) => {
    const steps = 8, pt = (x, y) => [{ x, y }];
    await phone.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(x0, y0) });
    for (let k = 1; k <= steps; k++) {
      await phone.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps) });
      await sleep(12);
    }
    await phone.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const plain = meta.slides.findIndex((s, i) => i > 0 && !s.steps && !meta.slides[i + 1]?.steps && !meta.slides[i - 1]?.steps && !meta.slides[i + 1]?.hidden && !meta.slides[i - 1]?.hidden);
  const goPlain = async () => { await pc.eval(`Deck.go(${plain < 0 ? 0 : plain},{instant:true,force:true,step:0});1`); await until(async () => (await at()) === String(Math.max(plain, 0) + 1)); await sleep(340); };
  const startAt = Math.max(plain, 0);
  await goPlain();
  await swipe(320, 300, 120, 305);
  await until(async () => (await pc.eval("Deck.index")) === startAt + 1, 1500);
  ok("swipe left turns to the next page", (await pc.eval("Deck.index")) === startAt + 1);
  await goPlain();
  await swipe(100, 300, 300, 305);
  await until(async () => (await pc.eval("Deck.index")) === startAt - 1, 1500);
  ok("swipe right turns back", startAt === 0 || (await pc.eval("Deck.index")) === startAt - 1);
  await goPlain();
  await swipe(250, 150, 120, 152);
  await until(async () => (await pc.eval("Deck.index")) !== startAt, 1200);
  ok("swipe on the pictures works too", (await pc.eval("Deck.index")) === startAt + 1);
  await goPlain();
  await swipe(200, 300, 150, 300); await sleep(400);
  ok("a short drag turns nothing", (await pc.eval("Deck.index")) === startAt);
  await swipe(250, 500, 230, 250); await sleep(400);
  ok("a vertical drag on the notes turns nothing", (await pc.eval("Deck.index")) === startAt);
  await swipe(6, 300, 300, 300); await sleep(400);
  ok("a drag from the screen edge is left to the phone", (await pc.eval("Deck.index")) === startAt);
  ok("pictures settle back after a drag", (await phone.eval(`document.getElementById('views').style.transform`)) === "");
  await phone.send("Emulation.setTouchEmulationEnabled", { enabled: false });

  /* which picture is big */
  const focusOf = () => phone.eval(`document.getElementById('views').dataset.focus`);
  const tapView = (v) => phone.eval(`document.querySelector('.view[data-v="${v}"]').click();1`);
  const widths = () => phone.eval(`[...document.querySelectorAll('.view')].filter(v=>getComputedStyle(v).display!=='none').map(v=>Math.round(v.getBoundingClientRect().width))`);
  ok("folded: both pictures start the same size", (await focusOf()) === "none" && new Set(await widths()).size === 1);
  await tapView("next");
  let w = await widths();
  ok("folded: tap next makes it bigger", w[1] > w[0] * 1.8, w.join("/"));
  const here = await pc.eval("Deck.index");
  await sleep(340); await tap("next"); await until(async () => (await pc.eval("Deck.index")) !== here || (await pc.eval("Deck.step")) !== 0);
  await sleep(100);
  ok("the size choice survives a page turn", (await focusOf()) === "next");
  await tapView("next");
  ok("tap the big one again: back to equal", (await focusOf()) === "none");
  await tapView("now");
  w = await widths();
  ok("folded: tap current makes it bigger", w[0] > w[1] * 1.8, w.join("/"));
  await tapView("now");

  /* unfolded */
  for (const [ww, hh] of [[884, 1104], [720, 820], [1000, 800]]) {
    await phone.send("Emulation.setDeviceMetricsOverride", { width: ww, height: hh, deviceScaleFactor: 2, mobile: true });
    await sleep(250);
    const r = await phone.eval(`(()=>{const q=(s)=>document.querySelector(s).getBoundingClientRect(),views=[...document.querySelectorAll('.view')].map(v=>v.getBoundingClientRect()),k=q('.keys'),n=q('#notes');return {lowest:Math.max(...views.map(v=>v.bottom)),keyTop:k.top,keyBottom:k.bottom,keyLeft:k.left,notesRight:n.right,scroll:document.documentElement.scrollWidth,shown:views.filter(v=>v.width>0).length}})()`);
    ok(`unfolded ${ww}x${hh}: three pictures, none under the keys, nothing off screen`, r.shown === 3 && r.lowest <= r.keyTop && r.keyBottom <= hh && r.notesRight <= r.keyLeft + 1 && r.scroll <= ww, JSON.stringify(r));
  }
  await phone.send("Emulation.setDeviceMetricsOverride", { width: 884, height: 1104, deviceScaleFactor: 2, mobile: true });
  await sleep(250);
  ok("unfolded: current is big by default", (await focusOf()) === "now");
  await tapView("prev");
  w = await phone.eval(`Object.fromEntries([...document.querySelectorAll('.view')].map(v=>[v.dataset.v,Math.round(v.getBoundingClientRect().width)]))`);
  ok("unfolded: tap previous makes it big", (await focusOf()) === "prev" && w.prev > w.now * 1.7 && w.now === w.next, JSON.stringify(w));
  await tapView("next");
  ok("unfolded: tap next swaps the big one", (await focusOf()) === "next");
  await tapView("next");
  ok("unfolded: tap the big one returns to current", (await focusOf()) === "now");
  await pc.eval(`Deck.go(${startAt},{instant:true,force:true,step:0});1`);
  await until(async () => (await at()) === String(startAt + 1));
  const pv = await phone.eval(`document.getElementById('prevImg').getAttribute('src')||''`);
  ok("previous picture is the previous page", startAt === 0 ? pv === "" : pv.startsWith(`s/${startAt}.webp`), pv);
  await phone.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await sleep(340);
  await swipe(500, 500, 250, 505);
  await until(async () => (await pc.eval("Deck.index")) === startAt + 1, 1500);
  ok("unfolded: swipe still turns the page", (await pc.eval("Deck.index")) === startAt + 1);
  await phone.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await phone.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(250);
  ok("folding back shows the folded choice", (await focusOf()) === "none");

  /* debounce */
  await pc.eval(`Deck.go(0,{instant:true,force:true,step:0});1`);
  await until(async () => (await at()) === "1");
  await sleep(320);
  await phone.eval(`(()=>{const b=document.getElementById('next');b.click();b.click();b.click();})();1`);
  await sleep(500);
  ok("a shaky triple tap turns one page", (await deckAt()) === "1,0");

  /* latency, with real transitions */
  const times = [];
  for (let k = 0; k < 20; k++) {
    await sleep(340);
    const want = await pc.eval("Deck.index");
    const [i0, step0] = (await deckAt()).split(",").map(Number);
    const total = meta.slides[i0].steps;
    const t0 = performance.now();
    await tap("next");
    await until(() => phone.eval(`document.getElementById('pageNow').textContent+'/'+document.getElementById('stepNow').textContent`).then((v) => v !== `${i0 + 1}/${total ? step0 + "/" + total + " 步" : ""}`), 1500, 4);
    times.push(Math.round(performance.now() - t0));
    if (want >= n - 2) break;
  }
  times.sort((a, b) => a - b);
  ok("press to confirmed on the phone is fast", times[Math.floor(times.length / 2)] < 150, `median ${times[Math.floor(times.length / 2)]}ms, worst ${times.at(-1)}ms (includes test polling)`);

  /* jump */
  await pc.eval(`Deck.go(0,{instant:true,force:true,step:0});1`);
  await until(async () => (await at()) === "1");
  const target = meta.slides.findLastIndex((s, i) => i > 0 && i <= Math.min(3, n - 2) && !s.hidden);
  await sleep(320);
  await tap("pageBtn");
  ok("jump lists every visible page", (await phone.eval(`document.querySelectorAll('.cell').length`)) === meta.slides.filter((s) => !s.hidden).length);
  await phone.eval(`document.querySelector('.cell[data-i="${target}"]').click();1`);
  ok("picking does not jump yet", (await pc.eval("Deck.index")) !== target && (await phone.eval(`document.getElementById('jumpGo').textContent`)) === `跳到第 ${target + 1} 页`);
  await tap("jumpGo");
  await until(async () => (await pc.eval("Deck.index")) === target);
  ok("confirm jumps, deck and phone agree", (await pc.eval("Deck.index")) === target && (await until(async () => (await at()) === String(target + 1))) >= 0);

  /* keyboard on the Mac */
  const key = (k) => pc.eval(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'${k}',bubbles:true}));1`);
  await key("ArrowRight");
  const followed = await until(async () => {
    const [i, step] = (await deckAt()).split(",").map(Number);
    const total = meta.slides[i].steps, shown = await phone.eval(`document.getElementById('stepNow').textContent`);
    return (i !== target || step !== 0) && (await at()) === String(i + 1) && shown === (total ? `${step}/${total} 步` : "");
  });
  ok("keyboard turn shows on the phone", followed >= 0, followed + "ms " + (followed < 0 ? [await deckAt(), await at(), await phone.eval(`document.getElementById('stepNow').textContent`)].join(" | ") : ""));

  /* timer */
  ok("first page turn started the clock", await phone.eval(`!document.getElementById('clock').classList.contains('is-paused')`));
  await tap("clock");
  await until(() => phone.eval(`document.getElementById('clock').classList.contains('is-paused')`));
  await tap("moreBtn"); await tap("timerReset"); await tap("timerReset"); await tap("moreClose");
  await until(async () => (await phone.eval(`document.getElementById('clock').textContent`)) === "00:00");
  ok("timer pauses and resets", (await phone.eval(`document.getElementById('clock').textContent`)) === "00:00");

  /* a second deck window must not double the turns */
  const pc2 = await launch({ width: 1280, height: 720 });
  await pc2.goto(urls.deck + "?audience");
  await until(async () => (await pc2.eval("Deck.index")) === (await pc.eval("Deck.index")));
  ok("second window joins on the current page", (await pc2.eval("Deck.index")) === (await pc.eval("Deck.index")));
  await pc.eval(`Deck.go(0,{instant:true,force:true,step:0});1`);
  await until(async () => (await pc2.eval("Deck.index")) === 0);
  await sleep(320); await tap("next"); await sleep(500);
  const both = [await deckAt(), await pc2.eval("[Deck.index,Deck.step].join()")];
  ok("two windows, one press, one page", both[0] === "1,0" && both[1] === "1,0", both.join(" vs "));
  await pc2.close();

  /* losing the server */
  const hereNow = await pc.eval("Deck.index");
  server.kill("SIGKILL");
  const banner = await until(() => phone.eval(`!document.getElementById('banner').hidden&&document.getElementById('bannerTitle').textContent.startsWith('连不上')`), 9000);
  ok("server gone: phone warns, keys off", banner >= 0 && await phone.eval(`document.getElementById('next').disabled`), banner + "ms");
  await key("ArrowLeft"); await sleep(300);
  ok("server gone: keyboard still turns pages", (await pc.eval("Deck.index")) !== hereNow || (await pc.eval("Deck.step")) !== 0);
  server = await startServer();
  ok("restart keeps the same phone address", new URL(urls.phone).pathname.split("/")[1] === token);
  const back = await until(() => phone.eval(`document.getElementById('banner').hidden&&!document.getElementById('next').disabled`), 12000);
  ok("phone reconnects by itself", back >= 0, back + "ms");
  ok("phone follows the deck after reconnecting", (await until(async () => (await at()) === String((await pc.eval("Deck.index")) + 1), 3000)) >= 0);
  await sleep(320);
  const i2 = await deckAt(); await tap("next"); await until(async () => (await deckAt()) !== i2);
  ok("commands work again", (await deckAt()) !== i2);

  /* reload of the deck page must not lose keyboard reports */
  await pc.goto(urls.deck + "#/2");
  await sleep(300); await key("ArrowRight");
  ok("after a deck reload the keyboard still reports", (await until(async () => (await at()) === String((await pc.eval("Deck.index")) + 1))) >= 0);

  /* a network that goes silent: no error, no close, packets just stop */
  const { createServer: tcp, connect: dial } = await import("node:net");
  let silent = false;
  const proxy = tcp((c) => {
    const u = dial(Number(new URL(remoteOrigin).port), "127.0.0.1");
    c.on("data", (d) => { if (!silent) u.write(d); });
    u.on("data", (d) => { if (!silent) c.write(d); });
    c.on("close", () => u.destroy()); u.on("close", () => c.destroy());
    c.on("error", () => {}); u.on("error", () => {});
  });
  await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
  const viaProxy = `http://127.0.0.1:${proxy.address().port}/${token}/`;
  await phone.send("Page.navigate", { url: viaProxy });
  await until(() => phone.eval(`location.port==='${proxy.address().port}'&&document.getElementById('banner')?.hidden===true&&document.getElementById('next')?.disabled===false`), 6000);
  await sleep(500);
  silent = true;
  const noticed = await until(() => phone.eval(`document.getElementById('bannerTitle').textContent.startsWith('连不上')`), 12000, 100);
  ok("silent network: phone notices within 10 seconds", noticed >= 0 && noticed <= 10000, noticed + "ms");
  ok("silent network: keys are off", await phone.eval(`document.getElementById('next').disabled`));
  await sleep(1500);
  silent = false;
  const healed = await until(() => phone.eval(`document.getElementById('banner').hidden&&!document.getElementById('next').disabled`), 9000, 100);
  ok("network back: phone reconnects by itself", healed >= 0, healed + "ms");
  proxy.close();

  ok("no errors on the deck page", pc.logs.filter((l) => !/WebSocket|__deck|404|Transition was skipped/.test(l)).length === 0, pc.logs.slice(0, 3).join(" | "));
  ok("no errors on the phone page", phone.logs.filter((l) => !/WebSocket|ERR_CONNECTION/.test(l)).length === 0, phone.logs.slice(0, 3).join(" | "));
} finally {
  await pc.close(); await phone.close();
  server.kill("SIGTERM");
}
ok("deck file untouched", createHash("sha1").update(readFileSync(file)).digest("hex") === before);
rmSync(work, { recursive: true, force: true });
console.log(failed ? `\n${failed} 项失败` : "\n全部通过");
process.exit(failed ? 1 : 0);
