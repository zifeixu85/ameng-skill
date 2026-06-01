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

  // --- fit the fixed stage to the viewport ----------------------------------
  function fit() {
    var sw = stage.offsetWidth || 1280, sh = stage.offsetHeight || 720;
    var scale = Math.min(window.innerWidth / sw, window.innerHeight / sh);
    deck.style.setProperty("--fit", scale.toFixed(4));
  }

  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }

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
    slides.forEach(function (s, i) {
      var t = document.createElement("div");
      t.className = "ppt-overview__thumb" + (i === idx ? " is-current" : "");
      var title = (s.querySelector(".display, .h1, .h2, .h3, .eyebrow") || {}).textContent || ("Slide " + (i + 1));
      t.innerHTML = "<b>" + (i + 1) + "</b>";
      var lab = document.createElement("div");
      lab.style.cssText = "position:absolute;inset:auto 8px 8px 8px;color:var(--ink-2);font-size:.8rem;line-height:1.25;font-family:var(--font-body)";
      lab.textContent = title.trim().slice(0, 60);
      t.appendChild(lab);
      t.addEventListener("click", function () { show(i); overview.classList.remove("is-open"); });
      overview.appendChild(t);
    });
  }
  function toggleOverview() {
    if (!overview.classList.contains("is-open")) buildOverview();
    overview.classList.toggle("is-open");
  }

  // --- keyboard help affordance (hover / click / ? / H) ---------------------
  // Screen-only: skipped entirely when exporting (render.sh appends ?export),
  // so it never appears in PNG / PDF deliverables.
  var isExport = /[?&](export|print)\b/.test(location.search);
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

  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", function () { show(fromHash()); });

  // expose for headless export tooling
  window.PptDeck = { show: show, next: next, prev: prev, count: slides.length, fit: fit };

  fit();
  show(fromHash());
})();
