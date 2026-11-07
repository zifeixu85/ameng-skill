/* deck.js — the runtime: fit, navigation, builds, transitions, chrome, reader mode.
   window.Deck is the one public surface (overlays, dock, editor, exporter use it). */
(function () {
  "use strict";
  var deck = document.querySelector(".deck");
  if (!deck) return;
  var stage = deck.querySelector(".stage");
  var slides = Array.prototype.slice.call(stage.querySelectorAll(":scope > .slide"));
  var q = new URLSearchParams(location.search);
  var mode = {
    print: q.has("print"), static: q.has("static") || q.has("print") || q.has("export"),
    audience: q.has("audience"), read: q.get("view") === "read"
  };
  var state = { i: 0, step: 0 };
  var listeners = [];
  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function emit(type, detail) { listeners.forEach(function (fn) { fn(type, detail); }); }
  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function visible() { return slides.filter(function (s) { return !s.hasAttribute("data-hidden"); }); }

  /* ---- fit ---------------------------------------------------------------- */
  function fit() {
    if (deck.classList.contains("is-read")) { readFit(); return; }
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    deck.style.setProperty("--fit", s.toFixed(5));
  }

  /* ---- chrome: running head + folio (runtime only, never saved) ------------ */
  function drawChrome() {
    var brand = deck.getAttribute("data-brand") || "", title = deck.getAttribute("data-title") || document.title || "";
    var sectionName = "";
    slides.forEach(function (s, i) {
      Array.prototype.forEach.call(s.querySelectorAll(":scope > .chrome,:scope > .tag-sample[data-rt]"), function (n) { n.remove(); });
      var L = s.getAttribute("data-layout");
      if (s.getAttribute("data-section")) sectionName = s.getAttribute("data-section");
      if (s.hasAttribute("data-sample")) {
        var tag = document.createElement("div");
        tag.className = "tag-sample"; tag.setAttribute("data-rt", ""); tag.textContent = "示例数据";
        s.appendChild(tag);
      }
      var theme = deck.getAttribute("data-theme");
      var bare = /^(cover|section|closing|image-full|image-split)$/.test(L) || (theme === "block" && /^(statement|number|quote)$/.test(L));
      if (bare || s.getAttribute("data-chrome") === "none") return;
      var top = document.createElement("div"), bot = document.createElement("div");
      top.className = "chrome chrome--top"; bot.className = "chrome chrome--bot";
      top.setAttribute("data-rt", ""); bot.setAttribute("data-rt", "");
      top.innerHTML = "<span><b></b></span><span class=\"sec\"></span>";
      top.querySelector("b").textContent = brand || title;
      top.querySelector(".sec").textContent = sectionName;
      bot.innerHTML = "<span></span><span class=\"folio\"></span>";
      bot.querySelector(".folio").textContent = pad(i + 1) + " / " + pad(slides.length);
      s.appendChild(top); s.appendChild(bot);
    });
  }

  /* ---- custom brand color: data-accent="#1E5AA8" on .deck -------------------- */
  function lum(c) { return c.map(function (v) { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [.2126, .7152, .0722][i]; }, 0); }
  function applyAccent() {
    var hex = deck.getAttribute("data-accent"), st = deck.style;
    ["--accent", "--brand", "--c1"].forEach(function (k) { st.removeProperty(k); });
    if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return;
    var c = [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }), f = c.slice();
    /* white text must stay readable on the solid block, so darken until it does */
    for (var i = 0; i < 40 && 1.05 / (lum(f) + .05) < 3.4; i++) f = f.map(function (v) { return v * .96; });
    var fill = "#" + f.map(function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }).join("");
    st.setProperty("--accent", hex); st.setProperty("--c1", hex); st.setProperty("--brand", fill);
  }

  /* ---- decor + charts + diagrams: everything derived from the theme --------- */
  function dress() {
    applyAccent();
    if (window.Decor) Decor.apply(deck, slides);
    drawChrome();
    if (window.Diagrams) Diagrams.draw(stage);
    if (window.Charts) Charts.renderAll(stage);
    if (window.FX) FX.sync(stage, slides[state.i]);
  }

  /* ---- transitions --------------------------------------------------------- */
  function morphNames(slide, on) {
    Array.prototype.forEach.call(slide.querySelectorAll("[data-morph]"), function (el) {
      el.style.viewTransitionName = on ? "m-" + el.getAttribute("data-morph").replace(/[^\w-]/g, "_") : "";
    });
  }
  function activate(i, step) {
    slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    state.i = i; state.step = step;
    deck.style.setProperty("--p", (slides.length > 1 ? i / (slides.length - 1) * 100 : 100) + "%");
    var bar = stage.querySelector(".progress > i"); if (bar) bar.style.setProperty("--p", deck.style.getPropertyValue("--p"));
    if (window.FX) FX.sync(stage, slides[i]);
    if (window.Motion) Motion.enter(slides[i], step);
    writeHash(i, step);
    emit("slide", { i: i, step: step });
  }
  function writeHash(i, step) {
    if (mode.static) return;
    try { history.replaceState(null, "", location.search + "#/" + (i + 1) + (step ? "/" + step : "")); } catch (e) { /* sandboxed frame */ }
  }
  function go(i, opts) {
    opts = opts || {};
    i = clamp(i);
    var from = slides[state.i], to = slides[i];
    var step = opts.step != null ? opts.step : (opts.fromEnd ? Motion.stepCount(to) : 0);
    if (i === state.i && !opts.force) { state.step = step; Motion.syncSteps(to, step); emit("slide", state); return; }
    var kind = to.getAttribute("data-transition") || deck.getAttribute("data-transition") || "auto";
    if (opts.instant || mode.static || reduced || kind === "none" || !document.startViewTransition) { activate(i, step); return; }
    stage.setAttribute("data-dir", i > state.i ? "fwd" : "back");
    stage.setAttribute("data-trans", kind);
    document.documentElement.setAttribute("data-trans", kind);
    document.documentElement.setAttribute("data-dir", i > state.i ? "fwd" : "back");
    morphNames(from, true);
    var vt = document.startViewTransition(function () { morphNames(from, false); activate(i, step); morphNames(to, true); });
    vt.finished.finally(function () { morphNames(to, false); document.documentElement.removeAttribute("data-trans"); });
  }
  function next() {
    var total = Motion.stepCount(slides[state.i]);
    if (state.step < total) {
      state.step++;
      Motion.revealStep(slides[state.i], state.step);
      writeHash(state.i, state.step);
      emit("slide", state);
      return;
    }
    var n = state.i + 1;
    while (n < slides.length && slides[n].hasAttribute("data-hidden")) n++;
    if (n < slides.length) go(n);
  }
  function prev() {
    if (state.step > 0) { state.step--; Motion.syncSteps(slides[state.i], state.step); emit("slide", state); return; }
    var n = state.i - 1;
    while (n >= 0 && slides[n].hasAttribute("data-hidden")) n--;
    if (n >= 0) go(n, { fromEnd: true });
  }

  /* ---- reader mode: a scrolling web page of the same slides ----------------- */
  var readObserver = null;
  function readFit() {
    var w = Math.min(window.innerWidth, 1500);
    deck.style.setProperty("--fit", (w / 1920).toFixed(5));
  }
  function setRead(on) {
    deck.classList.toggle("is-read", on);
    document.documentElement.classList.toggle("is-read", on);
    if (readObserver) { readObserver.disconnect(); readObserver = null; }
    if (on) {
      Motion.clear();
      slides.forEach(function (s) { s.classList.remove("is-active"); s.classList.remove("is-seen"); Motion.syncSteps(s, 99); });
      readFit();
      readObserver = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || e.target.classList.contains("is-seen")) return;
          e.target.classList.add("is-seen");
          Motion.enterRead(e.target);
        });
      }, { threshold: 0.28 });
      slides.forEach(function (s) { readObserver.observe(s.parentElement.classList.contains("read-frame") ? s : s); });
    } else {
      fit(); activate(state.i, 0);
    }
    emit("read", on);
  }

  /* ---- keyboard / pointer --------------------------------------------------- */
  function typing(e) {
    var t = e.target;
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  document.addEventListener("keydown", function (e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (deck.classList.contains("is-editing") && e.key !== "Escape") return;
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ": case "Enter": e.preventDefault(); next(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace": e.preventDefault(); prev(); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1); break;
      case "f": case "F": toggleFullscreen(); break;
      case "w": case "W": setRead(!deck.classList.contains("is-read")); break;
      case "t": case "T": cycleTone(); break;
      default: emit("key", e);
    }
  });
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  function cycleTone() {
    deck.toggleAttribute("data-invert");
    dress();
  }
  /* Click the far edges to page. The middle stays free for hover, selection and links. */
  stage.addEventListener("click", function (e) {
    if (deck.classList.contains("is-editing") || deck.classList.contains("is-read")) return;
    if (e.target.closest("a,button,input,textarea,.chart,[data-no-nav]")) return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.86) next(); else if (x < 0.14) prev();
  });
  var sx = null, sy = null;
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (sx === null || deck.classList.contains("is-read")) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  }, { passive: true });
  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", function () { var h = fromHash(); if (h.i !== state.i || h.step !== state.step) go(h.i, { step: h.step, instant: true }); });

  function fromHash() {
    var m = (location.hash || "").match(/#\/(\d+)(?:\/(\d+))?/);
    return m ? { i: clamp(parseInt(m[1], 10) - 1), step: parseInt(m[2] || "0", 10) } : { i: 0, step: 0 };
  }

  /* ---- public surface ------------------------------------------------------- */
  window.Deck = {
    el: deck, stage: stage, mode: mode,
    get slides() { return slides; },
    get index() { return state.i; },
    get step() { return state.step; },
    go: go, next: next, prev: prev, fit: fit, dress: dress,
    on: function (fn) { listeners.push(fn); },
    emit: emit,
    setRead: setRead,
    fullscreen: toggleFullscreen,
    /* style = a custom style on top of this base theme; omit it for a built-in theme */
    setTheme: function (name, style) {
      deck.setAttribute("data-theme", name);
      if (style) deck.setAttribute("data-style", style); else deck.removeAttribute("data-style");
      dress(); activate(state.i, state.step); emit("theme", name);
    },
    setAccent: function (hex) { if (hex) deck.setAttribute("data-accent", hex); else deck.removeAttribute("data-accent"); dress(); activate(state.i, state.step); emit("theme", deck.getAttribute("data-theme")); },
    refreshSlides: function () { slides = Array.prototype.slice.call(stage.querySelectorAll(":scope > .slide")); dress(); },
    activate: activate
  };

  /* ---- boot ----------------------------------------------------------------- */
  function boot() {
    if (!stage.querySelector(".progress")) {
      var p = document.createElement("div");
      p.className = "progress"; p.setAttribute("data-rt", ""); p.innerHTML = "<i></i>";
      stage.appendChild(p);
    }
    Motion.static = mode.static;
    deck.classList.toggle("is-static", mode.static);
    fit();
    dress();
    var h = fromHash();
    activate(h.i, mode.static ? 99 : h.step);
    if (mode.read) setRead(true);
    document.documentElement.setAttribute("data-deck-ready", "1");
    emit("ready");
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var settle = new Promise(function (res) { setTimeout(res, 1800); });
  Promise.race([fontsReady, settle]).then(function () {
    if (document.fonts && document.fonts.load) {
      var cs = getComputedStyle(stage);
      var fams = [cs.getPropertyValue("--f-display"), cs.getPropertyValue("--f-text")].join(",");
      return Promise.race([document.fonts.load("800 40px " + fams.split(",")[0], "汉字Ag"), settle]).catch(function () {});
    }
  }).then(boot);
})();
