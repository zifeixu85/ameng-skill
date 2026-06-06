/* ============================================================================
   ameng-ppt-design · runtime.js
   Keyboard navigation + fit-to-viewport scaling + progress + presenter notes
   + overview grid + theme cycle + #/N deep-links (used by render.sh for PNG).
   Zero dependencies. Self-hosted. No network calls.
   ============================================================================ */
(function () {
  "use strict";
  var deck = document.querySelector(".deck");
  if (!deck) return;
  var stage = deck.querySelector(".deck__stage") || deck;
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  if (!slides.length) return;

  // --- chrome injection (progress bar) --------------------------------------
  var prog = stage.querySelector(".deck__progress");
  if (!prog) {
    prog = document.createElement("div");
    prog.className = "deck__progress";
    prog.innerHTML = "<i></i>";
    stage.appendChild(prog);
  }
  var progFill = prog.querySelector("i");

  var idx = 0;

  // export-like = render.sh PNG/PDF (?export), browser print, or the headless
  // overflow audit (?audit) — all suppress on-screen authoring chrome.
  var isAudit = /[?&]audit\b/.test(location.search);
  var isExportLike = /[?&](export|print|audit)\b/.test(location.search);

  // --- fit the fixed stage to the viewport ----------------------------------
  function fit() {
    var sw = stage.offsetWidth || 1280, sh = stage.offsetHeight || 720;
    var scale = Math.min(window.innerWidth / sw, window.innerHeight / sh);
    deck.style.setProperty("--fit", scale.toFixed(4));
  }

  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }

  // --- overflow guard --------------------------------------------------------
  // Every slide is laid out (inactive ones are opacity/visibility-hidden, NOT
  // display:none) so geometry is measurable for ALL slides at once. The "safe
  // box" = the slide's content box: its padding already encodes the chrome-
  // avoidance safe zone (deck--chrome adds extra top/bottom). Any descendant
  // whose rect spills past that box is a real, otherwise-silently-clipped
  // overflow (.deck__stage is overflow:hidden). Used by:
  //   · the on-screen sentinel (draws a red boundary + badge on the active slide)
  //   · the `?audit` headless gate (scripts/check-overflow.mjs reads the report)
  var OVF_TOL = 1.5; // sub-pixel rounding tolerance, in stage px
  function stageScale() {
    var sw = stage.offsetWidth || 1280;            // unscaled layout width (1280)
    var rect = stage.getBoundingClientRect();      // scaled on-screen width
    return rect.width ? rect.width / sw : 1;
  }
  // Safe box in UNSCALED stage coordinates (origin = stage top-left).
  function safeBox(slide) {
    var cs = getComputedStyle(slide);
    var W = stage.offsetWidth || 1280, H = stage.offsetHeight || 720;
    return {
      left: parseFloat(cs.paddingLeft) || 0,
      top: parseFloat(cs.paddingTop) || 0,
      right: W - (parseFloat(cs.paddingRight) || 0),
      bottom: H - (parseFloat(cs.paddingBottom) || 0),
    };
  }
  function shortSel(el) {
    var t = el.tagName.toLowerCase();
    var c = (el.getAttribute("class") || "").trim().split(/\s+/)[0];
    return c ? t + "." + c : t;
  }
  // Measure worst overflow (in stage px) of any descendant past the safe box.
  function measureOverflow(slide) {
    var box = safeBox(slide);
    var srect = stage.getBoundingClientRect();
    var scale = stageScale();
    var toStage = function (r) {
      return {
        left: (r.left - srect.left) / scale, top: (r.top - srect.top) / scale,
        right: (r.right - srect.left) / scale, bottom: (r.bottom - srect.top) / scale,
      };
    };
    var nodes = slide.querySelectorAll("*");
    var worst = { top: 0, right: 0, bottom: 0, left: 0 }, worstEl = null, worstSum = 0;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.classList.contains("notes")) continue;             // speaker notes overlay, off-stage
      if (el.classList.contains("slide__num") || el.classList.contains("slide__foot")) continue;
      var cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      if (cs.position === "absolute" || cs.position === "fixed") continue; // decor/chrome out of flow
      var r = toStage(el.getBoundingClientRect());
      if ((r.right - r.left) < 0.5 && (r.bottom - r.top) < 0.5) continue;
      // INK overflow: nowrap text / over-long content spills past its OWN box
      // without enlarging its rect. When overflow is visible it's really on
      // screen, so extend the measured edge by scroll-vs-client (end-direction).
      if (cs.overflowX === "visible") { var ix = el.scrollWidth - el.clientWidth; if (ix > 1) r.right += ix; }
      if (cs.overflowY === "visible") { var iy = el.scrollHeight - el.clientHeight; if (iy > 1) r.bottom += iy; }
      var oT = box.top - r.top, oB = r.bottom - box.bottom;
      var oL = box.left - r.left, oR = r.right - box.right;
      var sum = Math.max(0, oT) + Math.max(0, oB) + Math.max(0, oL) + Math.max(0, oR);
      if (sum > worstSum) {
        worstSum = sum; worstEl = el;
        worst = { top: Math.max(0, oT), right: Math.max(0, oR), bottom: Math.max(0, oB), left: Math.max(0, oL) };
      }
    }
    var round = function (v) { return Math.round(v); };
    return {
      overflow: worstSum > OVF_TOL,
      top: round(worst.top), right: round(worst.right), bottom: round(worst.bottom), left: round(worst.left),
      el: worstEl ? shortSel(worstEl) : null,
    };
  }

  // on-screen sentinel: red dashed safe-box + corner badge on the active slide
  var ovf = document.createElement("div");
  ovf.className = "ppt-ovf";
  ovf.innerHTML = '<div class="ppt-ovf__box"></div><div class="ppt-ovf__badge"></div>';
  stage.appendChild(ovf);
  var ovfBox = ovf.querySelector(".ppt-ovf__box");
  var ovfBadge = ovf.querySelector(".ppt-ovf__badge");
  var guidesOn = false; // G key: always show the safe-box outline (authoring aid)
  function drawSentinel() {
    if (isExportLike) { ovf.classList.remove("is-on", "is-guide"); return; }
    var slide = slides[idx];
    var box = safeBox(slide);
    ovfBox.style.left = box.left + "px";
    ovfBox.style.top = box.top + "px";
    ovfBox.style.right = ((stage.offsetWidth || 1280) - box.right) + "px";
    ovfBox.style.bottom = ((stage.offsetHeight || 720) - box.bottom) + "px";
    var m = measureOverflow(slide);
    if (m.overflow) {
      var dirs = [];
      if (m.top) dirs.push("↑" + m.top); if (m.bottom) dirs.push("↓" + m.bottom);
      if (m.left) dirs.push("←" + m.left); if (m.right) dirs.push("→" + m.right);
      ovfBadge.textContent = "⚠ 第 " + (idx + 1) + " 页溢出 " + dirs.join(" ") + "px · " + (m.el || "");
      ovf.classList.add("is-on");
      if (typeof console !== "undefined" && console.warn)
        console.warn("[ppt-overflow] slide " + (idx + 1) + " overflows safe zone by " +
          JSON.stringify({ top: m.top, right: m.right, bottom: m.bottom, left: m.left }) +
          " px — offender: " + (m.el || "?"));
    } else {
      ovf.classList.remove("is-on");
    }
    ovf.classList.toggle("is-guide", guidesOn);
  }
  function toggleGuides() { guidesOn = !guidesOn; drawSentinel(); }

  // --- fit-text: shrink a non-wrapping hero line until it fits its container --
  // Measures against the original font-size (cached) so it's idempotent across
  // re-runs (resize, theme/dark toggle). Width-only by design: keep it simple,
  // predictable, and safe — vertical overflow is caught by the sentinel/gate.
  function fitText(slide) {
    var els = slide.querySelectorAll(".fit-text");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var base = el.getAttribute("data-fit-base");
      if (!base) { base = parseFloat(getComputedStyle(el).fontSize) || 16; el.setAttribute("data-fit-base", base); }
      base = parseFloat(base);
      el.style.fontSize = base + "px";
      var avail = el.clientWidth;                 // .fit-text is max-width:100% of its box
      if (!avail) continue;
      var size = base, guard = 0;
      while (guard++ < 48 && el.scrollWidth > el.clientWidth + 1) { size *= 0.95; el.style.fontSize = size + "px"; }
    }
  }

  function show(n) {
    idx = clamp(n);
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
    var pct = slides.length > 1 ? (idx / (slides.length - 1)) * 100 : 100;
    deck.style.setProperty("--progress", pct + "%");
    if (progFill) progFill.style.width = pct + "%";
    var num = slides[idx].querySelector(".slide__num");
    if (!num) {
      num = document.createElement("div");
      num.className = "slide__num";
      slides[idx].appendChild(num);
    }
    num.textContent = String(idx + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    syncChrome();
    syncNotes();
    fitText(slides[idx]);
    drawSentinel();
    if (history.replaceState) history.replaceState(null, "", "#/" + (idx + 1));
  }

  // editorial chrome (工业纸感): page counter + section label + accent zone
  var chromePage = stage.querySelector(".chrome-top__page");
  var chromeSec = stage.querySelector(".chrome-top__sec");
  function syncChrome() {
    var s = slides[idx];
    // propagate the active slide's accent zone up to the deck so chrome matches
    var acc = s.getAttribute("data-accent");
    if (acc) deck.setAttribute("data-accent", acc); else deck.removeAttribute("data-accent");
    if (chromePage) chromePage.textContent =
      String(idx + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    if (chromeSec) {
      var sec = s.getAttribute("data-section");
      if (sec) chromeSec.textContent = sec;
    }
  }

  function next() { if (idx < slides.length - 1) show(idx + 1); }
  function prev() { if (idx > 0) show(idx - 1); }

  // --- speaker notes overlay (S) --------------------------------------------
  var notesEl = document.createElement("div");
  notesEl.className = "ppt-notes-overlay";
  document.body.appendChild(notesEl);
  function syncNotes() {
    var n = slides[idx].querySelector(".notes");
    notesEl.innerHTML = n ? n.innerHTML : "<em style='opacity:.5'>（本页无讲者备注）</em>";
  }
  function toggleNotes() { notesEl.classList.toggle("is-open"); }

  // --- overview grid (O) -----------------------------------------------------
  var overview = document.createElement("div");
  overview.className = "ppt-overview";
  document.body.appendChild(overview);
  function buildOverview() {
    overview.innerHTML = "";
    var theme = deck.getAttribute("data-theme");
    var grain = deck.hasAttribute("data-grain");
    slides.forEach(function (s, i) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "ppt-ov__cell" + (i === idx ? " is-current" : "");
      // real preview: clone the slide into a mini deck/stage scaffold (so global selectors match),
      // forced visible + animations finalized (ppt-exporting), then scaled to fit (scaleThumbs).
      var frame = document.createElement("div"); frame.className = "ppt-ov__frame";
      var mdeck = document.createElement("div");
      mdeck.className = "deck deck--chrome ppt-exporting";
      if (grain) mdeck.setAttribute("data-grain", "");
      if (theme) mdeck.setAttribute("data-theme", theme);
      var mstage = document.createElement("div"); mstage.className = "deck__stage";
      var clone = s.cloneNode(true);
      clone.classList.add("is-active");
      Array.prototype.forEach.call(clone.querySelectorAll(".notes"), function (n) { n.remove(); });
      Array.prototype.forEach.call(clone.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
      Array.prototype.forEach.call(clone.querySelectorAll("[contenteditable]"), function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit"); });
      mstage.appendChild(clone); mdeck.appendChild(mstage); frame.appendChild(mdeck);
      var cap = document.createElement("span"); cap.className = "ppt-ov__cap";
      var title = ((s.querySelector(".display, .h1, .h2, .h3, .eyebrow") || {}).textContent || ("Slide " + (i + 1))).trim();
      cap.innerHTML = "<b>" + String(i + 1).padStart(2, "0") + "</b><span></span>";
      cap.querySelector("span").textContent = title;
      cell.appendChild(frame); cell.appendChild(cap);
      cell.addEventListener("click", function () { show(i); overview.classList.remove("is-open"); });
      overview.appendChild(cell);
    });
    scaleThumbs();
  }
  function scaleThumbs() {
    Array.prototype.forEach.call(overview.querySelectorAll(".ppt-ov__frame"), function (fr) {
      var st = fr.querySelector(".deck__stage"); if (!st) return;
      var bw = st.offsetWidth || 1280, bh = st.offsetHeight || 720;
      fr.style.aspectRatio = bw + " / " + bh;
      var w = fr.clientWidth; if (!w) return;
      st.style.transform = "scale(" + (w / bw) + ")";
    });
  }
  function toggleOverview() {
    if (overview.classList.contains("is-open")) { overview.classList.remove("is-open"); return; }
    overview.classList.add("is-open");
    buildOverview();
    requestAnimationFrame(scaleThumbs);   // measure once the grid has laid out
  }
  window.addEventListener("resize", function () { if (overview.classList.contains("is-open")) scaleThumbs(); });

  // --- keyboard help affordance (hover / click / ? / H) ---------------------
  // Screen-only: skipped entirely when exporting (render.sh appends ?export),
  // so it never appears in PNG / PDF deliverables.
  var isExport = isExportLike;
  var toggleHelp = function () {};
  if (!isExport) {
    var help = document.createElement("div");
    help.className = "ppt-help";
    help.innerHTML =
      '<button class="ppt-help__btn" type="button" aria-label="键盘快捷键">? 快捷键</button>' +
      '<div class="ppt-help__panel" role="dialog" aria-label="键盘快捷键">' +
        '<div class="ppt-help__row"><span class="k"><kbd>←</kbd><kbd>→</kbd><kbd>Space</kbd></span><b>翻页</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>1</kbd>–<kbd>9</kbd></span><b>跳到第 N 页</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>0</kbd> / <kbd>O</kbd></span><b>幻灯片总览</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>F</kbd></span><b>全屏放映</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>S</kbd></span><b>讲者备注</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>T</kbd></span><b>浅色 / 深色</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>G</kbd></span><b>安全区参考线 / 溢出检查</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>?</kbd></span><b>显示 / 隐藏帮助</b></div>' +
      '</div>';
    document.body.appendChild(help);
    help.querySelector(".ppt-help__btn").addEventListener("click", function () { help.classList.toggle("is-open"); });
    toggleHelp = function () { help.classList.toggle("is-open"); };
  }

  // --- light / dark toggle (T) ----------------------------------------------
  // Toggles the SAME theme between light and dark (not a jarring multi-theme
  // cycle). Each theme defines a :root (light) + a .deck[data-theme="dark"] block.
  function toggleDark() {
    if (deck.getAttribute("data-theme") === "dark") deck.removeAttribute("data-theme");
    else deck.setAttribute("data-theme", "dark");
  }

  // --- fullscreen (F) — fullscreen the DECK so authoring chrome (dock, help)
  //     is excluded from the presentation; CSS :fullscreen hides what remains.
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (deck.requestFullscreen) deck.requestFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  // --- keyboard --------------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    // number keys: 1–9 → jump to that slide · 0 → toggle overview grid
    if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var d = e.key.charCodeAt(0) - 48;
      if (d <= slides.length) { show(d - 1); e.preventDefault(); }
      return;
    }
    if (e.key === "0" && !e.ctrlKey && !e.metaKey && !e.altKey) { toggleOverview(); e.preventDefault(); return; }
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ": next(); e.preventDefault(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": prev(); e.preventDefault(); break;
      case "Home": show(0); break;
      case "End": show(slides.length - 1); break;
      case "f": case "F": fullscreen(); break;
      case "s": case "S": toggleNotes(); break;
      case "o": case "O": toggleOverview(); break;
      case "t": case "T": toggleDark(); break;
      case "g": case "G": toggleGuides(); break;
      case "?": case "h": case "H": toggleHelp(); break;
      case "Escape":
        notesEl.classList.remove("is-open"); overview.classList.remove("is-open");
        if (typeof help !== "undefined" && help) help.classList.remove("is-open");
        break;
    }
  });

  // click right/left thirds to navigate (touch-friendly)
  stage.addEventListener("click", function (e) {
    if (e.target.closest("a,button,input,.no-nav")) return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.66) next(); else if (x < 0.34) prev();
  });

  // --- deep link (#/N) — render.sh iterates these for PNG export -------------
  function fromHash() {
    var m = (location.hash || "").match(/#\/(\d+)/);
    return m ? clamp(parseInt(m[1], 10) - 1) : 0;
  }

  window.addEventListener("resize", function () { fit(); fitText(slides[idx]); drawSentinel(); });
  window.addEventListener("hashchange", function () { show(fromHash()); });

  // expose for headless export tooling
  window.PptDeck = { show: show, next: next, prev: prev, count: slides.length, fit: fit };

  fit();
  show(fromHash());

  // --- headless overflow audit (?audit) -------------------------------------
  // scripts/check-overflow.mjs loads the deck with ?audit in headless Chrome,
  // waits, then --dump-dom and parses #ppt-ovf-report. We finalize entrance
  // animations (ppt-exporting) so transforms don't create false positives, then
  // measure EVERY slide at once (all are laid out) and write a JSON report.
  if (isAudit) {
    deck.classList.add("ppt-exporting");
    var runAudit = function () {
      fit();
      var report = slides.map(function (s, i) {
        fitText(s);                  // apply shrink-to-fit before measuring
        var m = measureOverflow(s);
        return { n: i + 1, overflow: m.overflow, top: m.top, right: m.right, bottom: m.bottom, left: m.left, el: m.el };
      });
      var node = document.getElementById("ppt-ovf-report") || document.createElement("script");
      node.type = "application/json"; node.id = "ppt-ovf-report";
      node.textContent = JSON.stringify({ w: stage.offsetWidth || 1280, h: stage.offsetHeight || 720, slides: report });
      document.body.appendChild(node);
      document.documentElement.setAttribute("data-ppt-audit", "done");
    };
    // let fonts + layout settle across a few frames before measuring
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(runAudit, 250); }); });
  }
})();
