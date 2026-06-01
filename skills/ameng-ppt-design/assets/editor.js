/* ============================================================================
   ameng-ppt-design · editor.js
   Floating dock (top-right, auto-hiding, theme-aware) with in-place editing
   and auto-versioned history.
     • 编辑 → 就地改文字 → 完成（退出 + 自动存一个版本）
     • 历史 → 列出每次「完成」的版本，显示与上一版的文字差异(diff)，可一键恢复
     • 全屏 → 进入放映（点按手势，避开浏览器对 F 键全屏的限制）
   Persists to localStorage (offline). Dock is appended INSIDE .deck so it
   inherits the dark-mode token scope. Screen-only (hidden on ?export/?print).
   ============================================================================ */
(function () {
  "use strict";
  if (/[?&](export|print)\b/.test(location.search)) return;
  var deck = document.querySelector(".deck");
  if (!deck) return;
  var stage = deck.querySelector(".deck__stage") || deck;
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  if (!slides.length) return;

  var DECK_ID = "ameng-ppt:" + (deck.getAttribute("data-ppt-id")
    || (location.pathname.replace(/\/index\.html?$/i, "") || document.title || "deck"));
  var K_DOC = DECK_ID + ":doc", K_VERS = DECK_ID + ":versions", MAX_VERS = 40;
  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  var EDIT_SEL = [".eyebrow", ".display", ".zh-mega", ".h1", ".h2", ".h3", ".lead", ".body",
    ".quote", ".quote__by", ".tag", ".num", ".data-hero__num", ".data-hero__label", ".data-hero__src",
    ".bar__val", ".cmd", ".comment", ".ok", ".chrome-top__brand", ".chrome-top__sec", ".chrome-foot span",
    "h1", "h2", "h3", "h4", "p", "li", "blockquote", "figcaption"].join(",");
  function editableEls() {
    var out = [];
    slides.forEach(function (s) {
      var m = Array.prototype.slice.call(s.querySelectorAll(EDIT_SEL));
      m.forEach(function (el) {
        if (el.closest(".notes,.slide__num,.ppt-dock")) return;
        if (m.some(function (o) { return o !== el && el.contains(o); })) return;
        if (!el.textContent.trim()) return;
        out.push(el);
      });
    });
    return out;
  }
  function capture() {
    return slides.map(function (s) {
      var c = s.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll("[contenteditable]"), function (e) { e.removeAttribute("contenteditable"); e.removeAttribute("data-ppt-edit"); });
      var n = c.querySelector(".slide__num"); if (n) n.remove();
      return c.innerHTML;
    });
  }
  function currentIdx() { for (var i = 0; i < slides.length; i++) if (slides[i].classList.contains("is-active")) return i; return 0; }
  function apply(arr) {
    if (!arr) return;
    arr.forEach(function (html, i) { if (slides[i] != null && typeof html === "string") slides[i].innerHTML = html; });
    if (editing) markEditable(true);
    if (window.PptDeck && typeof window.PptDeck.show === "function") window.PptDeck.show(currentIdx());
  }
  (function restore() {
    var doc = lsGet(K_DOC, null);
    if (doc && doc.length === slides.length) slides.forEach(function (s, i) { if (typeof doc[i] === "string") s.innerHTML = doc[i]; });
  })();

  // --- edit mode -------------------------------------------------------------
  var editing = false;
  function markEditable(on) {
    editableEls().forEach(function (el) {
      if (on) { el.setAttribute("contenteditable", "true"); el.setAttribute("data-ppt-edit", ""); el.spellcheck = false; }
      else { el.removeAttribute("contenteditable"); el.removeAttribute("data-ppt-edit"); }
    });
  }
  function eq(a, b) { return a && b && a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }
  function autoVersion() {
    var doc = capture();
    lsSet(K_DOC, doc);
    var vers = lsGet(K_VERS, []);
    if (vers.length && eq(vers[0].doc, doc)) return;              // no change → no dup version
    vers.unshift({ t: new Date().toISOString(), doc: doc });
    if (vers.length > MAX_VERS) vers = vers.slice(0, MAX_VERS);
    lsSet(K_VERS, vers);
  }
  function setEditing(on) {
    if (on === editing) return;
    editing = on;
    deck.classList.toggle("is-editing", on);
    dock.classList.toggle("is-open", on);
    bEdit.hidden = on; bDone.hidden = !on;
    markEditable(on);
    if (!on) {
      var sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
      autoVersion();
      toast("已保存当前版本");
    }
  }
  function fullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (deck.requestFullscreen) deck.requestFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch (e) { toast("全屏被浏览器拦截，按 Esc 退出放映"); }
  }

  // --- dock (inside .deck → theme-aware) ------------------------------------
  var dock = document.createElement("div");
  dock.className = "ppt-dock"; dock.id = "ppt-dock";
  dock.innerHTML =
    '<div class="ppt-dock__handle" id="ppt-dock-handle" title="编辑 / 导出 / 历史">⋯</div>' +
    '<div class="ppt-dock__panel" id="ppt-dock-panel"></div>';
  deck.appendChild(dock);
  var panel = dock.querySelector("#ppt-dock-panel");
  function act(label, cls) { var b = document.createElement("button"); b.type = "button"; b.className = "ppt-act" + (cls ? " " + cls : ""); b.innerHTML = label; return b; }
  var bEdit = act('<span class="ppt-act__ico">✎</span>编辑');
  var bDone = act('<span class="ppt-act__ico">✓</span>完成', "ppt-act--primary"); bDone.hidden = true;
  var slot = document.createElement("span"); slot.id = "ppt-dock-export-slot"; slot.style.display = "contents"; // export.js fills this
  var bFull = act('<span class="ppt-act__ico">⤢</span>全屏');
  var bHist = act('<span class="ppt-act__ico">🕘</span>历史');
  [bEdit, bDone, slot, bFull, bHist].forEach(function (n) { panel.appendChild(n); });

  dock.querySelector("#ppt-dock-handle").addEventListener("click", function () { dock.classList.toggle("is-open"); });
  bEdit.addEventListener("click", function () { setEditing(true); });
  bDone.addEventListener("click", function () { setEditing(false); });
  bFull.addEventListener("click", fullscreen);
  bHist.addEventListener("click", function () { renderHistory(); drawer.classList.add("is-open"); });

  // --- history drawer with diff ---------------------------------------------
  var drawer = document.createElement("div");
  drawer.className = "ppt-history";
  drawer.innerHTML =
    '<div class="ppt-history__head"><span class="ppt-history__title">版本历史</span>' +
    '<button type="button" class="ppt-act" id="ppt-hist-close" style="border:1px solid var(--line-strong)">关闭</button></div>' +
    '<p class="ppt-history__hint">每次点「完成」自动存一个版本（本浏览器，离线）。下方显示与上一版的文字差异，便于判断恢复哪一版。</p>' +
    '<div class="ppt-history__list" id="ppt-hist-list"></div>';
  deck.appendChild(drawer);
  drawer.querySelector("#ppt-hist-close").addEventListener("click", function () { drawer.classList.remove("is-open"); });
  var histList = drawer.querySelector("#ppt-hist-list");

  function esc(s) { return (s || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function trunc(s, n) { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  var tmp = document.createElement("div");
  function texts(doc) { return (doc || []).map(function (h) { tmp.innerHTML = h; return tmp.textContent.replace(/\s+/g, " ").trim(); }); }
  function diffHTML(newer, older) {
    if (!older) return '<span class="nochg">初始版本</span>';
    var a = texts(newer), b = texts(older), rows = [];
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || "") !== (b[i] || "")) {
        rows.push('<div><span class="pg">P' + (i + 1) + '</span>' +
          '<span class="del">' + esc(trunc(b[i], 38)) + '</span> → <span class="add">' + esc(trunc(a[i], 38)) + '</span></div>');
      }
    }
    return rows.length ? rows.join("") : '<span class="nochg">无文字变化</span>';
  }
  function fmt(iso) { try { return new Date(iso).toLocaleString(); } catch (e) { return iso; } }
  function renderHistory() {
    var vers = lsGet(K_VERS, []);
    histList.innerHTML = "";
    if (!vers.length) { histList.innerHTML = '<div class="ppt-empty">还没有版本。进入「编辑」改完点「完成」，就会自动存一个版本。</div>'; return; }
    var live = capture();
    vers.forEach(function (v, i) {
      var card = document.createElement("div");
      var isCur = i === 0 && eq(v.doc, live);
      card.className = "ppt-ver" + (isCur ? " is-current" : "");
      card.innerHTML =
        '<div class="ppt-ver__when">' + fmt(v.t) + (isCur ? '<span class="ppt-ver__tag">当前</span>' : '<span class="ppt-ver__tag">#' + (vers.length - i) + '</span>') + '</div>' +
        '<div class="ppt-ver__diff">' + diffHTML(v.doc, (vers[i + 1] && vers[i + 1].doc)) + '</div>' +
        '<div class="ppt-ver__row"><button type="button" class="ppt-act ppt-act--primary" data-act="restore">恢复此版本</button>' +
        '<button type="button" class="ppt-act" data-act="del">删除</button></div>';
      card.querySelector('[data-act="restore"]').addEventListener("click", function () {
        apply(v.doc); lsSet(K_DOC, capture()); toast("已恢复到该版本"); drawer.classList.remove("is-open");
      });
      card.querySelector('[data-act="del"]').addEventListener("click", function () {
        var arr = lsGet(K_VERS, []); arr.splice(i, 1); lsSet(K_VERS, arr); renderHistory();
      });
      histList.appendChild(card);
    });
  }

  // --- keep runtime nav/shortcuts out of the way while editing text ---------
  document.addEventListener("keydown", function (e) {
    if (!editing) return;
    var ae = document.activeElement, inText = ae && ae.getAttribute && ae.getAttribute("contenteditable") === "true";
    if (e.key === "Escape") { if (inText) ae.blur(); setEditing(false); e.stopPropagation(); return; }
    if (inText) e.stopPropagation();
  }, true);
  stage.addEventListener("click", function (e) { if (editing) e.stopPropagation(); }, true);

  // --- toast -----------------------------------------------------------------
  var toastEl = document.createElement("div"); toastEl.className = "ppt-toast"; deck.appendChild(toastEl);
  var toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-show"); }, 2000); }

  window.PptEditor = { capture: capture, apply: apply, deckId: DECK_ID, toast: toast, deck: deck, dock: dock, slides: slides, currentIdx: currentIdx };
})();
