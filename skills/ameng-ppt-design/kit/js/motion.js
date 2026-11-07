/* motion.js — entrance choreography. Uses the Web Animations API so every effect
   can be finished instantly for export, and builds (data-step) can map 1:1 onto
   PowerPoint click animations. */
(function () {
  "use strict";
  var THEME = {
    noir:  { title: "lines", item: "rise", stagger: 90, dur: 1000, gap: 180 },
    paper: { title: "lines", item: "fade", stagger: 110, dur: 1100, gap: 240 },
    swiss: { title: "lines", item: "wipe", stagger: 60, dur: 520, gap: 90 },
    spec:  { title: "wipe", item: "rise", stagger: 55, dur: 560, gap: 100 },
    block: { title: "pop", item: "pop", stagger: 80, dur: 760, gap: 120 },
    board: { title: "fade", item: "fade", stagger: 70, dur: 620, gap: 120 }
  };
  var IN = {
    fade: [{ opacity: 0 }, { opacity: 1 }],
    rise: [{ opacity: 0, transform: "translateY(44px)" }, { opacity: 1, transform: "none" }],
    left: [{ opacity: 0, transform: "translateX(-64px)" }, { opacity: 1, transform: "none" }],
    right: [{ opacity: 0, transform: "translateX(64px)" }, { opacity: 1, transform: "none" }],
    pop: [{ opacity: 0, transform: "scale(.86)" }, { opacity: 1, transform: "none" }],
    zoom: [{ opacity: 0, transform: "scale(1.08)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
    blur: [{ opacity: 0, filter: "blur(18px)" }, { opacity: 1, filter: "blur(0)" }],
    wipe: [{ clipPath: "inset(-6% 100% -6% 0)" }, { clipPath: "inset(-6% -2% -6% 0)" }],
    drop: [{ opacity: 0, transform: "translateY(-44px)" }, { opacity: 1, transform: "none" }]
  };
  var LEAF = ".kicker,.title,.lead,.body,.by,.next,.hero,.source:not(.chart .source),.cap,.copy>*,.side>*,.col>h3,.col>.lead,.col>.body,.window,.caption-box,.media,.meta,.sec-num,.data";
  var GROUPS = ".agenda,.kpis,.points,.steps,.timeline,.matrix,.layers,.tiers,.versus,.ring";
  var running = [];
  var api = { static: false };

  function cfg() {
    var d = document.querySelector(".deck"), base = THEME[d.getAttribute("data-theme")] || THEME.paper, id = d.getAttribute("data-style");
    var spec = id && window.DeckStyles && window.DeckStyles[id];
    return spec && spec.motion ? Object.assign({}, base, spec.motion) : base;
  }
  function ease() { return getComputedStyle(document.querySelector(".stage")).getPropertyValue("--ease-out").trim() || "ease-out"; }
  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---- text splitting: preserves the browser's own line breaks ------------- */
  function lineRanges(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), r = document.createRange(), lines = [], cur = null, last = null, n;
    while ((n = w.nextNode())) {
      for (var i = 0; i < n.nodeValue.length; i++) {
        r.setStart(n, i); r.setEnd(n, i + 1);
        var rc = r.getClientRects()[0];
        if (!rc || (!rc.width && /\s/.test(n.nodeValue[i]))) continue;
        var mid = (rc.top + rc.bottom) / 2;
        if (!last || mid < last.top || mid > last.bottom) {
          cur = { sn: n, si: i, en: n, ei: i + 1 }; lines.push(cur);
        } else { cur.en = n; cur.ei = i + 1; }
        last = rc;
      }
    }
    return lines;
  }
  function splitLines(el) {
    var lines = lineRanges(el), r = document.createRange(), frags = [];
    if (!lines.length) return null;
    lines.forEach(function (l) {
      r.setStart(l.sn, l.si); r.setEnd(l.en, l.ei);
      var outer = document.createElement("span"), inner = document.createElement("span");
      outer.className = "ln"; inner.className = "ln__i";
      inner.appendChild(r.cloneContents()); outer.appendChild(inner); frags.push(outer);
    });
    var original = el.innerHTML;
    el.innerHTML = ""; frags.forEach(function (f) { el.appendChild(f); });
    return { restore: function () { el.innerHTML = original; }, inners: frags.map(function (f) { return f.firstChild; }) };
  }

  /* ---- count-up -------------------------------------------------------------- */
  function firstNumberNode(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (/\d/.test(n.nodeValue)) return n;
    return null;
  }
  function countUp(el, delay, dur) {
    var node = firstNumberNode(el); if (!node) return null;
    var raw = node.nodeValue, m = raw.match(/-?[\d,]*\.?\d+/); if (!m) return null;
    var num = parseFloat(m[0].replace(/,/g, "")), dec = (m[0].split(".")[1] || "").length, comma = m[0].indexOf(",") >= 0;
    var t0 = null, stop = false;
    function fmt(v) { var s = v.toFixed(dec); return comma ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : s; }
    function tick(t) {
      if (stop) return;
      if (t0 === null) t0 = t + delay;
      var p = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 4);
      node.nodeValue = raw.replace(m[0], fmt(num * e));
      if (p < 1) requestAnimationFrame(tick); else node.nodeValue = raw;
    }
    node.nodeValue = raw.replace(m[0], fmt(0));
    requestAnimationFrame(tick);
    return { cancel: function () { stop = true; node.nodeValue = raw; } };
  }

  var idleAt = 0;
  function track(a, done) {
    var t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
    if (t && isFinite(t.endTime)) idleAt = Math.max(idleAt, performance.now() + t.endTime);
    running.push({ a: a, done: done });
    return a;
  }
  function play(el, kind, delay, dur) {
    var e = ease();
    if (kind === "none") return;
    if (kind === "lines" || kind === "chars") {
      var sp = splitLines(el);
      if (sp) {
        var parentDone = false;
        sp.inners.forEach(function (inner, i) {
          var last = i === sp.inners.length - 1;
          var a = inner.animate([{ transform: "translateY(112%)" }, { transform: "none" }], { duration: dur, delay: delay + i * 110, easing: e, fill: "backwards" });
          var restore = function () { if (!parentDone) { parentDone = true; sp.restore(); } };
          track(a, last ? restore : null);
          if (last) a.finished.then(restore, restore);
        });
        return;
      }
      kind = "rise";
    }
    var kf = IN[kind] || IN.rise;
    track(el.animate(kf, { duration: dur, delay: delay, easing: e, fill: "backwards" }));
    if (el.matches && el.matches(".hero,.kpi__value") && !el.hasAttribute("data-nocount")) {
      var c = countUp(el, delay, dur * 1.3);
      if (c) { running.push({ cancelCount: c }); idleAt = Math.max(idleAt, performance.now() + delay + dur * 1.3 + 60); }
    }
  }

  function targets(slide) {
    var out = [], seen = new Set();
    function push(el, kind, group) { if (seen.has(el) || el.hasAttribute("data-rt")) return; seen.add(el); out.push({ el: el, kind: kind, group: group }); }
    var all = slide.querySelectorAll(LEAF + "," + GROUPS + ",[data-in],.chart,.dg");
    Array.prototype.forEach.call(all, function (el) {
      if (el.closest("[data-rt]") || el.closest(".notes")) return;
      if (el.parentElement && el.parentElement.closest(GROUPS) && !el.hasAttribute("data-in")) return;
      if (el.matches(GROUPS)) {
        Array.prototype.forEach.call(el.children, function (c) { if (!c.hasAttribute("data-rt") && !c.matches("svg")) push(c, c.getAttribute("data-in"), true); });
        return;
      }
      push(el, el.getAttribute("data-in"), false);
    });
    return out;
  }

  /* true while text on screen may be split or mid-count, so it must not be saved */
  api.busy = function () { return performance.now() < idleAt; };
  api.clear = function () {
    idleAt = 0;
    if (window.Loops) Loops.stop();
    running.forEach(function (r) {
      if (r.cancelCount) { r.cancelCount.cancel(); return; }
      try { r.a.cancel(); } catch (e) {}
      if (r.done) r.done();
    });
    running = [];
  };

  /* Hide/show step targets without animation */
  api.syncSteps = function (slide, step) {
    Array.prototype.forEach.call(slide.querySelectorAll("[data-step]"), function (el) {
      var k = parseInt(el.getAttribute("data-step"), 10) || 1;
      el.style.visibility = (api.static || k <= step) ? "" : "hidden";
    });
  };
  api.stepCount = function (slide) {
    var m = 0;
    Array.prototype.forEach.call(slide.querySelectorAll("[data-step]"), function (el) { m = Math.max(m, parseInt(el.getAttribute("data-step"), 10) || 1); });
    return m;
  };

  api.enter = function (slide, step) {
    api.clear();
    api.syncSteps(slide, step || 0);
    if (api.static || reduced || slide.getAttribute("data-motion") === "off") return;
    var c = cfg(), t = 120, list = targets(slide);
    list.forEach(function (it) {
      if (it.el.hasAttribute("data-step")) return;
      var isTitle = it.el.matches(".title");
      var kind = it.kind || (isTitle ? c.title : c.item);
      if (it.el.matches(".chart")) { if (window.Charts) Charts.play(it.el, t); t += 200; return; }
      play(it.el, kind, t, c.dur);
      t += it.group ? c.stagger : (isTitle ? c.gap : c.stagger);
    });
    if (window.Loops) Loops.start(slide, t + c.dur);
    Array.prototype.forEach.call(slide.querySelectorAll("[data-spin]"), function (el) {
      track(el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 90000, iterations: Infinity }));
    });
  };

  /* Reader mode: play a slide's entrance once when it scrolls into view */
  api.enterRead = function (slide) {
    if (api.static || reduced || slide.getAttribute("data-motion") === "off") return;
    var c = cfg(), t = 0;
    targets(slide).forEach(function (it) {
      if (it.el.matches(".chart")) { if (window.Charts) Charts.play(it.el, t); t += 160; return; }
      play(it.el, it.kind || (it.el.matches(".title") ? "rise" : c.item), t, c.dur);
      t += c.stagger;
    });
    if (window.Loops) Loops.start(slide, t + c.dur);
  };

  api.revealStep = function (slide, step) {
    api.syncSteps(slide, step);
    if (api.static || reduced) return;
    var c = cfg(), t = 0;
    Array.prototype.forEach.call(slide.querySelectorAll('[data-step="' + step + '"]'), function (el) {
      if (el.matches(".chart")) { if (window.Charts) Charts.play(el, t); }
      else play(el, el.getAttribute("data-in") || c.item, t, c.dur);
      t += c.stagger;
    });
  };

  /* End every running effect at its final frame (export, overview) */
  api.finishAll = function () {
    api.clear();
    if (document.getAnimations) document.getAnimations().forEach(function (a) {
      try { var ct = a.effect.getComputedTiming(); if (ct.iterations === Infinity) a.cancel(); else a.finish(); } catch (e) {}
    });
  };
  window.Motion = api;
})();
