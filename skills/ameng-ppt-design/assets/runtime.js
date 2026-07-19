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
  // audience window (?audience): pure playback for the projector — no presenter,
  // no notes overlay, no help/authoring chrome; still animates & syncs (Phase B).
  var isAudience = /[?&]audience\b/.test(location.search);

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
      if (el.classList.contains("notes") || el.classList.contains("script")) continue; // speaker notes / verbatim script, off-stage
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
      // a clipping ancestor (.frame overflow:hidden etc.) bounds what's actually
      // painted — intersect, so a tall .frame--scroll image isn't a false spill
      for (var anc = el.parentElement; anc && anc !== slide; anc = anc.parentElement) {
        var acs = getComputedStyle(anc);
        if (acs.overflow !== "visible" || acs.overflowY !== "visible" || acs.overflowX !== "visible") {
          var ar = toStage(anc.getBoundingClientRect());
          if (ar.left > r.left) r.left = ar.left; if (ar.top > r.top) r.top = ar.top;
          if (ar.right < r.right) r.right = ar.right; if (ar.bottom < r.bottom) r.bottom = ar.bottom;
        }
      }
      var oT = box.top - r.top, oB = r.bottom - box.bottom;
      if (el.closest(".slide-fx")) continue;   // decorative bg layer is full-bleed BY DESIGN
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

  // --- render-time contrast + balance helpers (used by the ?audit gate) ------
  // Colors come back from getComputedStyle in whatever space they were authored
  // (oklch stays oklch), so normalize ANY css color through a 1×1 canvas.
  var _cv = null;
  function colorToRgba(str) {
    if (!_cv) { _cv = document.createElement("canvas"); _cv.width = _cv.height = 1; }
    var ctx = _cv.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000"; ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  }
  function relLum(rgb) {
    function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  }
  function wcagRatio(a, b) {
    var y1 = relLum(a), y2 = relLum(b);
    return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
  }
  // nearest solid background behind el (el's own bg counts). Returns null when
  // an image/gradient/semi-transparent veil intervenes — uncertain, don't judge.
  function effBg(el) {
    var node = el;
    while (node && node !== stage.parentElement) {
      var cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      var c = colorToRgba(cs.backgroundColor);
      if (c[3] >= 0.95) return c;
      if (c[3] > 0.05) return null;
      node = node.parentElement;
    }
    return null;
  }
  // WCAG check for every text-bearing element on a slide; reports ratios < 3
  // (3.0 fails even large/bold text — the green-on-green class of bug).
  function measureContrast(slide) {
    var out = [];
    var els = slide.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var hasText = false;
      for (var c = el.firstChild; c; c = c.nextSibling)
        if (c.nodeType === 3 && c.nodeValue.replace(/\s+/g, "").length >= 2) { hasText = true; break; }
      if (!hasText) continue;
      if (el.closest(".notes, .script")) continue;              // speaker notes / verbatim script, off-stage
      // caption text over a media scrim (.imghero / .imggrid): legibility comes
      // from the scrim+photo, a SIBLING layer effBg() can't see (it would resolve
      // the component's solid fallback bg and false-flag near-white --on-media text
      // as 1.1). The component ships the scrim, so trust it — same spirit as the
      // .slide-fx exemption above.
      if (el.closest(".imghero, .imggrid")) continue;
      var cs = getComputedStyle(el);
      // NOTE: no visibility check — during ?audit every non-active slide is
      // visibility:hidden but fully laid out; colors/rects are still valid.
      if (cs.display === "none" || parseFloat(cs.opacity) < 0.45) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      var bg = effBg(el);
      if (!bg) continue;
      var fg = colorToRgba(cs.color);
      if (fg[3] < 1) fg = [fg[0] * fg[3] + bg[0] * (1 - fg[3]), fg[1] * fg[3] + bg[1] * (1 - fg[3]), fg[2] * fg[3] + bg[2] * (1 - fg[3]), 1];
      var ratio = wcagRatio(fg, bg);
      // Projection-context tiers: a 1280 stage is viewed at distance, so slide
      // copy ≥16px gets the WCAG large-text floor (3.0). Genuinely tiny text
      // (<16px) needs 4.5 — unless it's a deliberately de-emphasized chrome /
      // support label (kickers, axis labels, captions, placeholders, bylines).
      var fs = parseFloat(cs.fontSize) || 16;
      var cls = typeof el.className === "string" ? el.className : "";
      var isChromeLabel =
        /\b(?:eyebrow|tag|comment|muted|frame__placeholder|mx-y|mx-x)\b/.test(cls) ||
        /__(?:d|ic|cap|src|label|by)(?:\s|$)/.test(cls) ||
        !!el.closest(".terminal, .slide__foot, .slide__num, .chrome-top, .chrome-foot, .card__tags");
      var need = fs >= 16 || isChromeLabel ? 3.0 : 4.5;
      if (ratio < need) out.push({ el: shortSel(el), ratio: Math.round(ratio * 100) / 100, need: need, px: Math.round(fs) });
    }
    out.sort(function (a, b) { return a.ratio - b.ratio; });
    return out.slice(0, 3);
  }
  // vertical balance: how much of the safe zone the content actually spans.
  // A non-center slide with a huge dead band at the bottom reads as top-heavy.
  function measureFill(slide) {
    var box = safeBox(slide);
    var els = slide.querySelectorAll("*");
    var top = null, bot = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest(".notes, .script, .slide__num, .slide__foot, .slide-fx")) continue;
      var cs = getComputedStyle(el);
      if (cs.display === "none") continue;   // (visibility:hidden = inactive slide, still laid out)
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (top === null || r.top < top) top = r.top;
      if (bot === null || r.bottom > bot) bot = r.bottom;
    }
    if (bot === null) return null;
    var safeH = box.bottom - box.top || 1;
    return {
      fill: Math.round(((Math.min(bot, box.bottom) - Math.max(top, box.top)) / safeH) * 100),
      gapBottom: Math.round(Math.max(0, box.bottom - bot)),
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
  var sentinelT;        // delayed re-measure after entrance animations
  function drawSentinel(quiet) {
    if (isExportLike) { ovf.classList.remove("is-on", "is-guide"); return; }
    var slide = slides[idx];
    var box = safeBox(slide);
    ovfBox.style.left = box.left + "px";
    ovfBox.style.top = box.top + "px";
    ovfBox.style.right = ((stage.offsetWidth || 1280) - box.right) + "px";
    ovfBox.style.bottom = ((stage.offsetHeight || 720) - box.bottom) + "px";
    // quiet = called the instant a slide activates: AUTO-MOTION's translateY entrance
    // is mid-flight, so measuring now paints a false ⚠ overflow. Just position the
    // guide box and wait for the 1100ms settle re-measure to do the real check.
    if (quiet) { ovf.classList.remove("is-on"); ovf.classList.toggle("is-guide", guidesOn); return; }
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
  function toggleGuides() { if (isAudience) { audienceHint(); return; } guidesOn = !guidesOn; drawSentinel(); }

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

  // --- fx-count: numbers count up when their slide becomes active -----------
  // <el data-count="30000">3万<span class="unit">+字</span></el> animates the
  // text 0→30,000 then restores the original markup (units/styling intact).
  // Skipped in export/audit (final markup is already the end state) and under
  // prefers-reduced-motion.
  function runCounts(slide) {
    var exporting = isExportLike || isAudit || deck.classList.contains("ppt-exporting");
    var els = slide.querySelectorAll("[data-count]");
    for (var i = 0; i < els.length; i++) (function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (!isFinite(target)) return;
      if (!el.getAttribute("data-count-final")) el.setAttribute("data-count-final", el.innerHTML);
      var fin = el.getAttribute("data-count-final");
      // export/audit/reduced-motion: snap straight to the final markup — the
      // toolbar export iterates slides via show(), so a live count here would
      // get photographed mid-flight ("PDF 里数字变成 12,632" bug)
      if (exporting || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
        el.innerHTML = fin; return;
      }
      var t0 = null, dur = 900;
      function tick(t) {
        // bail to the final state the moment an export starts or the slide flips
        if (!slide.classList.contains("is-active") || deck.classList.contains("ppt-exporting")) { el.innerHTML = fin; return; }
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) { el.textContent = Math.round(target * eased).toLocaleString("en-US"); requestAnimationFrame(tick); }
        else el.innerHTML = fin;
      }
      requestAnimationFrame(tick);
    })(els[i]);
  }

  function show(n, fromRemote) {
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
    syncPresenter();      // no-op unless presenter view is open
    fitText(slides[idx]);
    runCounts(slides[idx]);
    drawSentinel(true);   // quiet: position guides only — AUTO-MOTION still mid-flight
    // real overflow check after entrance animations settle (a mid-flight rise/
    // translateY otherwise paints a false ⚠ overflow badge for ~a second)
    clearTimeout(sentinelT);
    sentinelT = setTimeout(function () { drawSentinel(); }, 1100);
    if (history.replaceState) history.replaceState(null, "", "#/" + (idx + 1));
    // twin-window sync: only LOCAL user navigation broadcasts — remote-driven
    // show() must not echo (loop guard), and export's page-stepping must not
    // flip the audience window mid-export.
    if (!fromRemote && !deck.classList.contains("ppt-exporting")) syncSend({ t: "goto", idx: idx });
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
  // Same single source as the presenter prompt: the slide's .notes element.
  // Structure = grip (drag to resize) + body (editable via editor.js). syncNotes
  // only ever touches the body so the grip survives page flips.
  var notesEl = document.createElement("div");
  notesEl.className = "ppt-notes-overlay";
  notesEl.innerHTML = '<div class="ppt-notes-overlay__grip" title="拖拽调整高度"><span></span></div>' +
                      '<div class="ppt-notes-overlay__body"></div>';
  document.body.appendChild(notesEl);
  var notesBody = notesEl.querySelector(".ppt-notes-overlay__body");
  function slideNotesHTML(i) {
    var n = slides[i].querySelector(".notes");
    if (n) return n.innerHTML;
    var legacy = slides[i].querySelector(".script");   // pre-merge decks: surface old .script content
    return legacy ? legacy.innerHTML : "";
  }
  function syncNotes() {
    if (document.activeElement === notesBody) return;   // don't clobber while typing
    var html = slideNotesHTML(idx);
    notesBody.innerHTML = html || "<em style='opacity:.5'>（本页无讲者备注 · 点击直接写）</em>";
  }
  // audience window: a suppressed shortcut looks like "keys are broken" when the
  // window isn't fullscreen yet (user testing / arranging screens) — say why.
  // Silent when fullscreen: nothing may pollute the live projector.
  var audHintEl = null, audHintT = null;
  function audienceHint() {
    if (!isAudience || document.fullscreenElement) return;
    if (!audHintEl) { audHintEl = document.createElement("div"); audHintEl.className = "ppt-aud-hint"; document.body.appendChild(audHintEl); }
    audHintEl.textContent = "这是观众窗（投屏用，快捷键已精简）— 提词 / 备注 / 演讲者操作请回演讲者窗";
    audHintEl.classList.add("is-show");
    clearTimeout(audHintT); audHintT = setTimeout(function () { audHintEl.classList.remove("is-show"); }, 4000);
  }
  function toggleNotes() {
    if (isAudience) { audienceHint(); return; }         // speaker notes never reach the projector
    if (presenterOpen) return;                          // presenter already shows the same notes, big
    var opening = !notesEl.classList.contains("is-open");
    notesEl.classList.toggle("is-open");
    if (opening) syncNotes();                           // pick up edits made elsewhere (presenter prompt)
  }
  (function notesGrip() {                               // drag the top edge to resize the sheet
    var grip = notesEl.querySelector(".ppt-notes-overlay__grip"), dragging = false;
    function move(e) {
      if (!dragging) return;
      var h = Math.max(110, Math.min(window.innerHeight * 0.8, window.innerHeight - e.clientY));
      notesEl.style.setProperty("--notes-h", h + "px");
      e.preventDefault();
    }
    function up() { dragging = false; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
    grip.addEventListener("pointerdown", function (e) { dragging = true; document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); e.preventDefault(); });
  })();

  // --- overview grid (O) -----------------------------------------------------
  var overview = document.createElement("div");
  overview.className = "ppt-overview";
  document.body.appendChild(overview);
  // real preview: clone a slide into a mini deck/stage scaffold (so global
  // selectors match), forced visible + animations finalized (ppt-exporting),
  // off-stage/editing cruft stripped. Shared by overview (O) and presenter (P).
  // Caller scales the frame to its container via scaleThumb().
  function renderThumb(slide, frameEl) {
    frameEl.classList.add("ppt-thumb");   // shared marker: base.css sizes the mini deck/stage off this
    frameEl.innerHTML = "";
    if (!slide) return frameEl;
    var theme = deck.getAttribute("data-theme");
    var grain = deck.hasAttribute("data-grain");
    var mdeck = document.createElement("div");
    mdeck.className = "deck deck--chrome ppt-exporting";
    if (grain) mdeck.setAttribute("data-grain", "");
    if (theme) mdeck.setAttribute("data-theme", theme);
    var mstage = document.createElement("div"); mstage.className = "deck__stage";
    var clone = slide.cloneNode(true);
    clone.classList.add("is-active");
    Array.prototype.forEach.call(clone.querySelectorAll(".notes, .script"), function (n) { n.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    Array.prototype.forEach.call(clone.querySelectorAll("[contenteditable]"), function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit"); });
    mstage.appendChild(clone); mdeck.appendChild(mstage); frameEl.appendChild(mdeck);
    return frameEl;
  }
  function scaleThumb(frameEl) {
    var st = frameEl.querySelector(".deck"); if (!st) return;   // scale the mini .deck (stage transform is force-reset by export CSS)
    var bw = st.offsetWidth || 1280, bh = st.offsetHeight || 720;
    frameEl.style.aspectRatio = bw + " / " + bh;
    var w = frameEl.clientWidth;
    if (!w) { requestAnimationFrame(function () { scaleThumb(frameEl); }); return; }  // frame not laid out yet
    st.style.transform = "scale(" + (w / bw) + ")";
  }
  // fit a thumbnail to CONTAIN inside its slot (presenter): size the FRAME
  // itself to the scaled deck (bw*s × bh*s) and let CSS flex center it — frame
  // and deck are welded to the same `s`, so a stale measurement can only make
  // the pair momentarily smaller/larger, never the "deck shifted left, empty
  // frame showing on the right" tear. Slot = the frame's parent (.ppt-pv__current/__next).
  function fitThumbBox(frameEl) {
    var st = frameEl.querySelector(".deck"); if (!st) return;   // scale the mini .deck (stage transform is force-reset by export CSS)
    var box = frameEl.parentNode;
    var bw = st.offsetWidth || 1280, bh = st.offsetHeight || 720;
    var fw = box.clientWidth, fh = box.clientHeight;
    if (!fw || !fh) return;
    var s = Math.min(fw / bw, fh / bh);
    frameEl.style.width = (bw * s) + "px";
    frameEl.style.height = (bh * s) + "px";
    st.style.transform = "scale(" + s + ")";
  }
  function buildOverview() {
    if (overviewRO) overviewRO.disconnect();   // drop the previous build's frames
    overview.innerHTML = "";
    slides.forEach(function (s, i) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "ppt-ov__cell" + (i === idx ? " is-current" : "");
      var frame = document.createElement("div"); frame.className = "ppt-ov__frame";
      renderThumb(s, frame);
      var cap = document.createElement("span"); cap.className = "ppt-ov__cap";
      var title = ((s.querySelector(".display, .h1, .h2, .h3, .eyebrow") || {}).textContent || ("Slide " + (i + 1))).trim();
      cap.innerHTML = "<b>" + String(i + 1).padStart(2, "0") + "</b><span></span>";
      cap.querySelector("span").textContent = title;
      cell.appendChild(frame); cell.appendChild(cap);
      cell.addEventListener("click", function () { show(i); overview.classList.remove("is-open"); });
      overview.appendChild(cell);
      if (overviewRO) overviewRO.observe(frame);   // re-scale each cell the moment it (re)gets a size — kills layout races
    });
    scaleThumbs();
  }
  var overviewRO = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(function (entries) { entries.forEach(function (en) { scaleThumb(en.target); }); })
    : null;
  function scaleThumbs() {
    Array.prototype.forEach.call(overview.querySelectorAll(".ppt-ov__frame"), scaleThumb);
  }
  function toggleOverview() {
    if (overview.classList.contains("is-open")) { overview.classList.remove("is-open"); return; }
    if (presenterOpen) togglePresenter();   // overview replaces presenter — never stack
    overview.classList.add("is-open");
    buildOverview();
    requestAnimationFrame(scaleThumbs);   // measure once the grid has laid out
  }
  window.addEventListener("resize", function () {
    if (overview.classList.contains("is-open")) scaleThumbs();
    if (presenterOpen) syncPresenter();
  });

  // --- presenter view (P) — single-window console overlay -------------------
  // A console the speaker looks at: current-page big preview + next-page thumb +
  // timer/clock/page + the slide's .notes as a large editable teleprompter
  // (same single source the S overlay shows). Built from renderThumb (shared
  // with overview O). Screen-only via isExportLike, so it never reaches
  // render.sh / print / audit. Single-window skeleton; Phase B adds the
  // audience window (window.open + BroadcastChannel).
  var presenterEl = null, presenterOpen = false, presenterTickT = null, presenterRO = null;
  var pvFontScale = 1;
  // view layouts: which page the big/small frames show. Cycled by the toolbar
  // chip or the V key. "-only" modes hide the small frame and widen the big one.
  var PV_LAYOUTS = ["cur-big", "next-big", "cur-only", "next-only"];
  var PV_LAYOUT_LABEL = { "cur-big": "当前大", "next-big": "下一页大", "cur-only": "仅当前", "next-only": "仅下一页" };
  var pvLayout = "cur-big";
  function pvLayoutNext() {
    pvLayout = PV_LAYOUTS[(PV_LAYOUTS.indexOf(pvLayout) + 1) % PV_LAYOUTS.length];
    if (!presenterEl) return;
    presenterEl.setAttribute("data-pv-layout", pvLayout);
    pvQ("layoutbtn").textContent = "视图 · " + PV_LAYOUT_LABEL[pvLayout];
    syncPresenter();
    requestAnimationFrame(fitFrames);
  }
  // rehearsal timer: count-up (elapsed) OR count-down (target − elapsed).
  // state idle → running ⇄ paused → (reset) idle. accum = ms banked while not
  // running; since = wall time the current run began. userSet flips once the
  // user touches the target (input/±/countdown) — it gates the pace light.
  var deckTargetMin = parseFloat(deck.getAttribute("data-target-min")) || 0;
  var pvTimer = { state: "idle", accum: 0, since: 0, mode: "up", userSet: false,
                  targetMs: (deckTargetMin || 20) * 60000 };
  // pace budget: cumulative ms that SHOULD be spent once slide i is done.
  // Slides may pin an exact data-sec; the rest split the remaining target evenly.
  function pvBudgetMs(i) {
    var secs = slides.map(function (s) { return Math.max(0, parseFloat(s.getAttribute("data-sec")) || 0); });
    var known = 0, unknown = 0;
    secs.forEach(function (v) { if (v > 0) known += v; else unknown++; });
    var fill = unknown ? Math.max(0, pvTimer.targetMs / 1000 - known) / unknown : 0;
    var acc = 0;
    for (var k = 0; k <= i && k < secs.length; k++) acc += secs[k] > 0 ? secs[k] : fill;
    return acc * 1000;
  }
  function pvHasTarget() { return pvTimer.userSet || pvTimer.mode === "down" || deckTargetMin > 0; }
  function pvElapsed() { return pvTimer.accum + (pvTimer.state === "running" ? (Date.now() - pvTimer.since) : 0); }
  function pvFmt(ms) { var neg = ms < 0; ms = Math.abs(ms); var s = Math.floor(ms / 1000); return (neg ? "-" : "") + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  function pvParseTime(str) {   // "20" → 20min · "20:30" → 20m30s · else null
    str = String(str).trim();
    if (/^\d+$/.test(str)) return parseInt(str, 10) * 60000;
    var m = str.match(/^(\d+):([0-5]?\d)$/);
    return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000 : null;
  }
  function nowClock() { var d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function pvQ(role) { return presenterEl.querySelector('[data-role="' + role + '"]'); }
  // ONE source of truth for speaker notes: the slide's .notes element. Writing
  // goes through editor.js's PptNotes (persists with the doc, never versioned);
  // standalone decks without editor.js fall back to a plain DOM write.
  function writeNotes(i, html) {
    if (window.PptNotes && window.PptNotes.set) { window.PptNotes.set(i, html); return; }
    var s = slides[i], n = s.querySelector(".notes");
    if (!n) { n = document.createElement("div"); n.className = "notes"; s.appendChild(n); }
    n.innerHTML = html;
  }

  function buildPresenter() {
    if (presenterEl || isExportLike) return;
    presenterEl = document.createElement("div");
    presenterEl.className = "ppt-presenter";
    presenterEl.setAttribute("data-pv-layout", pvLayout);
    presenterEl.innerHTML =
      '<div class="ppt-pv__stage">' +
        '<div class="ppt-pv__current"><span class="ppt-pv__tag" data-role="tagbig">当前</span><div class="ppt-pv__frame-area"><div class="ppt-pv__frame" data-role="big"></div></div></div>' +
        '<div class="ppt-pv__side">' +
          '<div class="ppt-pv__next"><span class="ppt-pv__tag" data-role="tagsmall">下一页</span><div class="ppt-pv__frame-area"><div class="ppt-pv__frame" data-role="small"></div></div></div>' +
          '<div class="ppt-pv__meta">' +
            '<div class="ppt-pv__timer" data-role="elapsed">00:00</div>' +
            '<div class="ppt-pv__pace is-hidden" data-role="pace"><i></i><span data-role="pacetxt"></span></div>' +
            '<div class="ppt-pv__tcontrol">' +
              '<button type="button" class="ppt-pv__chip" data-act="mode" data-role="modebtn">正计时</button>' +
              '<span class="ppt-pv__target is-hidden"><button type="button" class="ppt-pv__chip" data-act="tdec" aria-label="目标减一分钟">−</button>' +
              '<input class="ppt-pv__tinput" data-role="target" inputmode="numeric" value="20:00" aria-label="目标时长（分钟或 分:秒）" />' +
              '<button type="button" class="ppt-pv__chip" data-act="tinc" aria-label="目标加一分钟">+</button></span>' +
            '</div>' +
            '<div class="ppt-pv__submeta"><span data-role="clock">--:--</span><span class="ppt-pv__page" data-role="page">– / –</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ppt-pv__grip" data-role="grip" title="拖拽调整备注区高度"><span></span></div>' +
      '<div class="ppt-pv__read"><div class="ppt-pv__prompt" data-role="prompt" contenteditable="true" spellcheck="false"></div></div>' +
      '<div class="ppt-pv__bar">' +
        '<button type="button" class="ppt-pv__btn" data-act="prev" aria-label="上一页">◀</button>' +
        '<button type="button" class="ppt-pv__btn" data-act="next" aria-label="下一页">▶</button>' +
        '<span class="ppt-pv__seg"><button type="button" class="ppt-pv__btn" data-act="timer" data-role="timerbtn">⏱ 开始</button>' +
        '<button type="button" class="ppt-pv__btn ppt-pv__btn--ghost" data-act="reset" aria-label="重置计时">↺</button></span>' +
        '<span class="ppt-pv__seg"><button type="button" class="ppt-pv__btn ppt-pv__btn--ghost" data-act="fdec" aria-label="逐字稿缩小">A−</button>' +
        '<button type="button" class="ppt-pv__btn ppt-pv__btn--ghost" data-act="finc" aria-label="逐字稿放大">A+</button></span>' +
        '<button type="button" class="ppt-pv__btn ppt-pv__btn--ghost" data-act="layout" data-role="layoutbtn" title="切换视图布局（V）">视图 · 当前大</button>' +
        '<span class="ppt-pv__spacer"></span>' +
        '<button type="button" class="ppt-pv__btn ppt-pv__btn--ghost" data-act="close">收起 · P</button>' +
      '</div>';
    document.body.appendChild(presenterEl);
    presenterEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      switch (b.getAttribute("data-act")) {
        case "prev": prev(); break;
        case "next": next(); break;
        case "timer": pvTimerToggle(); break;
        case "reset": pvTimerReset(); break;
        case "layout": pvLayoutNext(); break;
        case "mode": pvMode(); break;
        case "tdec": pvTarget(-1); break;
        case "tinc": pvTarget(1); break;
        case "fdec": pvFont(-0.1); break;
        case "finc": pvFont(0.1); break;
        case "close": togglePresenter(); break;
      }
    });
    var sBox = pvQ("prompt");
    sBox.addEventListener("input", function () {   // edit the slide's .notes in place (persists, never versioned)
      writeNotes(idx, sBox.innerHTML);
      sBox.classList.toggle("is-empty", !sBox.textContent.trim());
    });
    var tIn = pvQ("target");                        // countdown target: type minutes or M:SS directly
    function commitTarget() { var v = pvParseTime(tIn.value); if (v != null) { pvTimer.userSet = true; pvTimer.targetMs = Math.max(60000, Math.min(180 * 60000, v)); } pvTimerSync(); }
    tIn.addEventListener("change", commitTarget);
    tIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { commitTarget(); tIn.blur(); } });
    tIn.addEventListener("focus", function () { tIn.select(); });
    setupGrip(pvQ("grip"));
    if (typeof ResizeObserver !== "undefined") {
      // observe the SLOTS (frame parents), not the frames — fitThumbBox sizes the
      // frames itself, and observing them would loop the observer on every fit.
      presenterRO = new ResizeObserver(function () { if (presenterOpen) fitFrames(); });
      presenterRO.observe(presenterEl.querySelector(".ppt-pv__current"));
      presenterRO.observe(presenterEl.querySelector(".ppt-pv__next"));
    }
  }
  function fitFrames() {
    if (!presenterEl) return;
    fitThumbBox(pvQ("big"));
    fitThumbBox(pvQ("small"));
  }
  function pvFont(delta) {
    pvFontScale = Math.max(0.7, Math.min(1.7, Math.round((pvFontScale + delta) * 10) / 10));
    if (presenterEl) presenterEl.style.setProperty("--pv-script-scale", pvFontScale);
  }
  function pvTimerToggle() {
    if (pvTimer.state === "running") { pvTimer.accum = pvElapsed(); pvTimer.state = "paused"; }
    else { pvTimer.since = Date.now(); pvTimer.state = "running"; }
    pvTimerSync();
  }
  function pvTimerReset() { pvTimer.state = "idle"; pvTimer.accum = 0; pvTimer.since = 0; pvTimerSync(); }
  function pvMode() { pvTimer.mode = pvTimer.mode === "down" ? "up" : "down"; if (pvTimer.mode === "down") pvTimer.userSet = true; pvTimerSync(); }
  function pvTarget(deltaMin) { pvTimer.userSet = true; pvTimer.targetMs = Math.max(60000, Math.min(180 * 60000, pvTimer.targetMs + deltaMin * 60000)); pvTimerSync(); }
  function pvRender() {   // paint the live timer value (called by the 500ms tick + on any state change)
    if (!presenterEl) return;
    var el = pvQ("elapsed"), ms = pvTimer.mode === "down" ? (pvTimer.targetMs - pvElapsed()) : pvElapsed();
    el.textContent = pvFmt(ms);
    var over = pvTimer.mode === "down" && ms < 0;
    el.classList.toggle("is-running", pvTimer.state === "running" && !over);
    el.classList.toggle("is-over", over);
    // pace light: linear/data-sec budget vs elapsed — green ≤8% of target off,
    // yellow ≤18%, red beyond (both too fast and too slow are problems).
    var pace = pvQ("pace"), show = pvTimer.state !== "idle" && pvHasTarget();
    pace.classList.toggle("is-hidden", !show);
    if (show) {
      var delta = pvElapsed() - pvBudgetMs(idx);
      var tol = Math.abs(delta) / pvTimer.targetMs;
      pace.classList.toggle("is-ok", tol <= 0.08);
      pace.classList.toggle("is-warn", tol > 0.08 && tol <= 0.18);
      pace.classList.toggle("is-bad", tol > 0.18);
      pvQ("pacetxt").textContent = tol <= 0.08 ? "配速 · 正点"
        : (delta < 0 ? "快 " : "慢 ") + pvFmt(Math.abs(delta));
    }
  }
  function pvTimerSync() {
    if (!presenterEl) return;
    pvQ("timerbtn").textContent = pvTimer.state === "running" ? "⏸ 暂停" : (pvTimer.state === "paused" ? "⏱ 继续" : "⏱ 开始");   // ⏱ so ▶ stays nav-only
    pvQ("modebtn").textContent = pvTimer.mode === "down" ? "倒计时" : "正计时";
    presenterEl.querySelector(".ppt-pv__target").classList.toggle("is-hidden", pvTimer.mode !== "down");
    if (document.activeElement !== pvQ("target")) pvQ("target").value = pvFmt(pvTimer.targetMs);  // don't fight the user mid-type
    pvRender();
  }
  // drag the grip to resize the script (read) panel; stage takes the rest.
  function setupGrip(grip) {
    var dragging = false;
    function move(e) {
      if (!dragging) return;
      var rect = presenterEl.getBoundingClientRect();
      var cs = getComputedStyle(presenterEl);
      var barH = presenterEl.querySelector(".ppt-pv__bar").offsetHeight;
      var padB = parseFloat(cs.paddingBottom) || 0, gap = parseFloat(cs.rowGap) || 0;
      var h = rect.bottom - padB - barH - gap - e.clientY;
      h = Math.max(70, Math.min(rect.height * 0.72, h));
      presenterEl.style.setProperty("--pv-read-h", h + "px");
      fitFrames();
      e.preventDefault();
    }
    function up() { dragging = false; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
    grip.addEventListener("pointerdown", function (e) { dragging = true; document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); e.preventDefault(); });
  }
  function syncPresenter() {
    if (!presenterOpen || !presenterEl) return;
    // resolve which page each frame shows under the active view layout
    var bigIdx = (pvLayout === "next-big" || pvLayout === "next-only") ? idx + 1 : idx;
    var smallIdx = pvLayout === "cur-big" ? idx + 1 : (pvLayout === "next-big" ? idx : -1);
    var bigF = pvQ("big"), tagBig = pvQ("tagbig");
    if (bigIdx < slides.length) {
      tagBig.textContent = bigIdx === idx ? "当前" : "下一页";
      renderThumb(slides[bigIdx], bigF); fitThumbBox(bigF);
    } else {                                                   // "next" view on the last slide
      tagBig.textContent = "下一页 ·（已是最后一页）";
      bigF.innerHTML = ""; bigF.style.width = ""; bigF.style.height = "";
    }
    var smallWrap = presenterEl.querySelector(".ppt-pv__next");
    var showSmall = smallIdx >= 0 && smallIdx < slides.length;
    smallWrap.classList.toggle("is-hidden", !showSmall);
    var nf = pvQ("small");
    if (showSmall) {
      pvQ("tagsmall").textContent = smallIdx === idx ? "当前" : "下一页";
      renderThumb(slides[smallIdx], nf); fitThumbBox(nf);
    } else { nf.innerHTML = ""; }   // belt-and-suspenders: nothing to pierce through
    var promptBox = pvQ("prompt");
    if (document.activeElement !== promptBox) promptBox.innerHTML = slideNotesHTML(idx);  // don't clobber while typing
    promptBox.classList.toggle("is-empty", !promptBox.textContent.trim());
    pvQ("page").textContent = String(idx + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    pvQ("clock").textContent = nowClock();
    pvRender();
  }
  // audience window handle: opened on P, reused on re-open (never a second one)
  var audienceWin = null;
  function openAudience() {
    if (audienceWin && !audienceWin.closed) { try { audienceWin.focus(); } catch (e) {} return; }
    var url = location.pathname + (location.search ? location.search + "&" : "?") + "audience" + location.hash;
    audienceWin = window.open(url, "ppt-audience");
    if (!audienceWin) pvNotice("弹窗被浏览器拦截 — 允许本站弹窗后重按 P 开观众窗（当前先用单窗排练）");
    else if (location.protocol === "file:") pvNotice("file:// 下双窗无法同步 — 用 ./scripts/serve.sh 起本地服务再开");
  }
  function pvNotice(msg) {
    if (!presenterEl) return;
    var n = presenterEl.querySelector(".ppt-pv__notice");
    if (!n) { n = document.createElement("div"); n.className = "ppt-pv__notice"; presenterEl.appendChild(n); }
    n.textContent = msg; n.classList.add("is-show");
    clearTimeout(pvNotice._t); pvNotice._t = setTimeout(function () { n.classList.remove("is-show"); }, 6000);
  }
  function togglePresenter() {
    if (isExportLike) return;
    if (isAudience) { audienceHint(); return; }                         // audience window never hosts a presenter
    if (!presenterEl) buildPresenter();
    presenterOpen = !presenterOpen;
    deck.classList.toggle("is-presenting", presenterOpen);
    presenterEl.classList.toggle("is-open", presenterOpen);
    if (presenterOpen) {
      overview.classList.remove("is-open");                             // presenter replaces overview / notes — never stack
      notesEl.classList.remove("is-open");
      openAudience();                                                    // pop the clean projector window (B2)
      if (!presenterEl.style.getPropertyValue("--pv-read-h"))            // first open: default script panel ≈ 30% height
        presenterEl.style.setProperty("--pv-read-h", Math.round(presenterEl.clientHeight * 0.3) + "px");
      pvTimerSync();
      syncPresenter();
      requestAnimationFrame(function () { fitFrames(); requestAnimationFrame(fitFrames); });  // settle grid before fit
      setTimeout(fitFrames, 120);                                       // fallback if layout settles late
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFrames);  // refit after web-font swap reflow
      presenterTickT = setInterval(function () {                          // live clock + timer
        if (!presenterEl) return;
        pvQ("clock").textContent = nowClock();
        pvRender();
      }, 500);
    } else if (presenterTickT) { clearInterval(presenterTickT); presenterTickT = null; }
  }

  // --- keyboard help affordance (hover / click / ? / H) ---------------------
  // Screen-only: skipped when exporting (render.sh appends ?export) AND in the
  // audience window — the projector shows content only.
  var isExport = isExportLike || isAudience;
  var toggleHelp = isAudience ? audienceHint : function () {};
  if (!isExport) {
    var help = document.createElement("div");
    help.className = "ppt-help";
    help.innerHTML =
      '<button class="ppt-help__btn" type="button" aria-label="键盘快捷键">? 快捷键</button>' +
      '<div class="ppt-help__panel" role="dialog" aria-label="键盘快捷键">' +
        '<div class="ppt-help__row"><span class="k"><kbd>←</kbd><kbd>→</kbd><kbd>Space</kbd></span><b>翻页</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>1</kbd>–<kbd>9</kbd></span><b>跳到第 N 页</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>0</kbd> / <kbd>O</kbd></span><b>幻灯片总览</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>P</kbd></span><b>演讲者视图（提词 + 计时 + 弹观众窗）</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>V</kbd></span><b>演讲者视图布局（当前/下一页/仅一屏）</b></div>' +
        '<div class="ppt-help__row"><span class="k"><kbd>R</kbd></span><b>重置排练计时（演讲者视图内）</b></div>' +
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
  function applyDark(on, fromRemote) {
    if (on) deck.setAttribute("data-theme", "dark"); else deck.removeAttribute("data-theme");
    if (!fromRemote) syncSend({ t: "theme", dark: on });
  }
  function toggleDark() { applyDark(deck.getAttribute("data-theme") !== "dark"); }

  // --- twin-window sync (Phase B) --------------------------------------------
  // Presenter laptop + audience projector window stay in step over a
  // BroadcastChannel named after the deck's pathname (same URL = same channel;
  // different decks never cross-talk). Symmetric: whichever window the user
  // drives broadcasts, the other applies with fromRemote=true (no echo).
  // hello → the other side replies with full state (late joiners catch up).
  // No BroadcastChannel (ancient browser) → localStorage `storage` fallback.
  // NOTE: needs http:// (serve.sh) — file:// windows have opaque origins.
  var syncCh = null, syncLS = false, SYNC_KEY = "ppt:" + location.pathname;
  function syncSend(m) {
    if (syncCh) syncCh.postMessage(m);
    else if (syncLS) { try { localStorage.setItem(SYNC_KEY, JSON.stringify({ m: m, n: Date.now() + Math.random() })); } catch (e) {} }
  }
  function syncRecv(m) {
    if (!m || !m.t) return;
    if (m.t === "goto" && typeof m.idx === "number") show(m.idx, true);
    else if (m.t === "theme") applyDark(!!m.dark, true);
    else if (m.t === "hello") { syncSend({ t: "goto", idx: idx }); syncSend({ t: "theme", dark: deck.getAttribute("data-theme") === "dark" }); }
  }
  if (!isExportLike) (function syncInit() {
    if (typeof BroadcastChannel !== "undefined") {
      syncCh = new BroadcastChannel(SYNC_KEY);
      syncCh.onmessage = function (e) { syncRecv(e.data); };
    } else {
      syncLS = true;
      window.addEventListener("storage", function (e) {
        if (e.key === SYNC_KEY && e.newValue) { try { syncRecv(JSON.parse(e.newValue).m); } catch (err) {} }
      });
    }
    syncSend({ t: "hello" });                        // late joiner asks for state
    window.addEventListener("beforeunload", function () { syncSend({ t: "bye" }); });
  })();

  // --- fullscreen (F) — fullscreen the DECK so authoring chrome (dock, help)
  //     is excluded from the presentation; CSS :fullscreen hides what remains.
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (deck.requestFullscreen) deck.requestFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  // --- keyboard --------------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    // typing in the presenter teleprompter: keep keys in the field (don't let
    // 'p'/'0'/arrows navigate). Esc exits editing. Scoped to .ppt-pv__prompt so
    // editor.js's own edit-mode / notes handling is untouched.
    var ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || (ae.classList && ae.classList.contains("ppt-pv__prompt")))) { if (e.key === "Escape") ae.blur(); return; }
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
      case "p": case "P": togglePresenter(); break;
      case "r": case "R": if (presenterOpen) { pvTimerReset(); e.preventDefault(); } break;
      case "v": case "V": if (presenterOpen) { pvLayoutNext(); e.preventDefault(); } break;
      case "t": case "T": toggleDark(); break;
      case "g": case "G": toggleGuides(); break;
      case "?": case "h": case "H": toggleHelp(); break;
      case "Escape":
        notesEl.classList.remove("is-open"); overview.classList.remove("is-open");
        if (typeof help !== "undefined" && help) help.classList.remove("is-open");
        if (presenterOpen) togglePresenter();
        break;
    }
  });

  // click right/left thirds to navigate (touch-friendly)
  stage.addEventListener("click", function (e) {
    if (e.target.closest("a,button,input,.no-nav")) return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.66) next(); else if (x < 0.34) prev();
  });

  // horizontal swipe to navigate (touch devices); vertical drags left to scroll
  var swipeX = null, swipeY = null;
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1 || deck.classList.contains("is-editing")) { swipeX = null; return; }
    swipeX = e.touches[0].clientX; swipeY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (swipeX == null) return;
    var dx = e.changedTouches[0].clientX - swipeX;
    var dy = e.changedTouches[0].clientY - swipeY;
    swipeX = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  // --- deep link (#/N) — render.sh iterates these for PNG export -------------
  function fromHash() {
    var m = (location.hash || "").match(/#\/(\d+)/);
    return m ? clamp(parseInt(m[1], 10) - 1) : 0;
  }

  window.addEventListener("resize", function () {
    fit(); fitText(slides[idx]); drawSentinel(true);   // quiet now (load/font reflow may hit mid-animation)
    clearTimeout(sentinelT); sentinelT = setTimeout(function () { drawSentinel(); }, 400);  // real check after settle
  });
  window.addEventListener("hashchange", function () { show(fromHash()); });

  // expose for headless export tooling
  window.PptDeck = { show: show, next: next, prev: prev, count: slides.length, fit: fit };

  fit();
  show(fromHash(), true);   // boot silently: a freshly-opened window must not drag its twin to its own start page

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
        var fillInfo = measureFill(s);
        return {
          n: i + 1, overflow: m.overflow, top: m.top, right: m.right, bottom: m.bottom, left: m.left, el: m.el,
          center: s.classList.contains("center"),
          contrast: measureContrast(s),
          fill: fillInfo ? fillInfo.fill : null,
          gapBottom: fillInfo ? fillInfo.gapBottom : null,
        };
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
