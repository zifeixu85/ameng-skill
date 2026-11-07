/* presenter.js — speaker console (P) and the clean audience window. Two windows stay
   in step over a BroadcastChannel; the console shows current + next, notes, timer and
   a pace light. Needs http:// for two windows; alone it works anywhere. */
(function () {
  "use strict";
  if (!window.Deck || Deck.mode.static) return;
  var chan = null, key = "deck:" + location.pathname, applying = false;
  try { chan = new BroadcastChannel(key); } catch (e) { /* sandboxed frame */ }
  function send(m) { if (chan && !applying) chan.postMessage(m); }
  if (chan) chan.onmessage = function (e) {
    var m = e.data; if (!m) return;
    applying = true;
    if (m.t === "go") Deck.go(m.i, { step: m.step, force: m.i !== Deck.index });
    if (m.t === "theme") Deck.setTheme(m.name);
    if (m.t === "hello") { applying = false; send({ t: "go", i: Deck.index, step: Deck.step }); }
    applying = false;
  };
  Deck.on(function (t, d) {
    if (t === "slide") send({ t: "go", i: d.i, step: d.step });
    if (t === "theme") send({ t: "theme", name: d });
  });
  if (Deck.mode.audience) { document.documentElement.classList.add("is-audience"); send({ t: "hello" }); return; }

  var el = null, open = false, tick = 0, audience = null;
  var clock = { on: false, base: 0, since: 0, target: (parseFloat(Deck.el.getAttribute("data-minutes")) || 0) * 60000 };
  function elapsed() { return clock.base + (clock.on ? Date.now() - clock.since : 0); }
  function fmt(ms) { var s = Math.floor(Math.abs(ms) / 1000); return (ms < 0 ? "-" : "") + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  /* seconds a slide should take: data-sec if given, the rest share the remainder */
  function budget(i) {
    if (!clock.target) return 0;
    var secs = Deck.slides.map(function (s) { return parseFloat(s.getAttribute("data-sec")) || 0; }), known = 0, free = 0, acc = 0;
    secs.forEach(function (v) { if (v) known += v; else free++; });
    var share = free ? Math.max(0, clock.target / 1000 - known) / free : 0;
    for (var k = 0; k <= i; k++) acc += secs[k] || share;
    return acc * 1000;
  }
  function q(r) { return el.querySelector('[data-r="' + r + '"]'); }
  function build() {
    el = document.createElement("div");
    el.className = "ui speaker";
    el.innerHTML = '<div class="speaker__now" data-r="now"></div><div class="speaker__side"><div class="speaker__next" data-r="next"></div><div class="speaker__clock"><b data-r="time">00:00</b><span data-r="pace"></span></div><div class="speaker__row"><button data-a="timer">开始计时</button><button data-a="reset">归零</button><button data-a="audience">观众窗</button><button data-a="close">退出</button></div></div><div class="speaker__notes" data-r="notes" contenteditable="plaintext-only" spellcheck="false" aria-label="讲者备注"></div><div class="speaker__bar"><button data-a="prev">←</button><span data-r="page"></span><button data-a="next">→</button></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "prev") Deck.prev();
      else if (a === "next") Deck.next();
      else if (a === "close") toggle();
      else if (a === "audience") openAudience();
      else if (a === "reset") { clock.on = false; clock.base = 0; paint(); }
      else if (a === "timer") { if (clock.on) { clock.base = elapsed(); clock.on = false; } else { clock.since = Date.now(); clock.on = true; } paint(); }
    });
    q("notes").addEventListener("input", function () {
      var s = Deck.slides[Deck.index], n = s.querySelector(":scope > .notes");
      if (!n) { n = document.createElement("aside"); n.className = "notes"; s.appendChild(n); }
      n.textContent = q("notes").textContent;
      Deck.emit("dirty", { slide: Deck.index });
    });
  }
  function thumb(host, i) {
    host.innerHTML = "";
    if (i >= Deck.slides.length) { host.textContent = "最后一页"; return; }
    Overlays.mini(Deck.slides[i], host);
  }
  function sync() {
    if (!open) return;
    thumb(q("now"), Deck.index); thumb(q("next"), Deck.index + 1);
    if (document.activeElement !== q("notes")) { var n = Deck.slides[Deck.index].querySelector(":scope > .notes"); q("notes").textContent = n ? n.textContent : ""; }
    q("page").textContent = (Deck.index + 1) + " / " + Deck.slides.length;
    paint();
  }
  function paint() {
    if (!el) return;
    q("time").textContent = fmt(elapsed());
    el.querySelector('[data-a="timer"]').textContent = clock.on ? "暂停" : (clock.base ? "继续" : "开始计时");
    var pace = q("pace");
    if (clock.target && (clock.on || clock.base)) {
      var d = elapsed() - budget(Deck.index), r = Math.abs(d) / clock.target;
      pace.textContent = r < .05 ? "节奏正好" : (d > 0 ? "慢了 " : "快了 ") + fmt(Math.abs(d));
      pace.setAttribute("data-s", r < .08 ? "ok" : r < .18 ? "warn" : "bad");
    } else pace.textContent = "";
  }
  function openAudience() {
    if (audience && !audience.closed) { audience.focus(); return; }
    var u = location.pathname + "?audience" + location.hash;
    audience = window.open(u, "deck-audience");
    if (!audience && window.Dock) Dock.toast("浏览器拦截了弹窗，允许后再点“观众窗”");
    else if (location.protocol === "file:" && window.Dock) Dock.toast("双窗同步需要用本地地址打开（scripts/serve.mjs）", 4200);
  }
  function toggle() {
    if (!el) build();
    open = !open;
    el.classList.toggle("is-open", open);
    if (open) { sync(); tick = setInterval(paint, 500); } else clearInterval(tick);
  }
  Deck.on(function (t, e) {
    if (t === "slide") sync();
    if (t === "key" && (e.key === "p" || e.key === "P")) toggle();
    if (t === "key" && e.key === "Escape" && open) toggle();
  });
  window.Presenter = { toggle: toggle };
})();
