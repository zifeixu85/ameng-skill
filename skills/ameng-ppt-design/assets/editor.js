/* ============================================================================
   ameng-ppt-design · editor.js
   In-place text editing + local save + per-deck version history.
   Adds a top-right "编辑" control; in edit mode you can click any text to edit,
   保存 (persist to this browser), 存历史 (snapshot a restorable version),
   历史 (browse + restore + delete versions). Screen-only, zero dependencies,
   fully offline (localStorage). Hidden when ?export / ?print (clean deliverables).
   ============================================================================ */
(function () {
  "use strict";
  if (/[?&](export|print)\b/.test(location.search)) return;       // deliverables stay clean
  var deck = document.querySelector(".deck");
  if (!deck) return;
  var stage = deck.querySelector(".deck__stage") || deck;
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  if (!slides.length) return;

  // --- storage keys (stable per deck file) ----------------------------------
  var DECK_ID = "ameng-ppt:" + (deck.getAttribute("data-ppt-id")
    || (location.pathname.replace(/\/index\.html?$/i, "") || document.title || "deck"));
  var K_DOC = DECK_ID + ":doc";
  var K_VERS = DECK_ID + ":versions";
  var MAX_VERS = 30;

  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // --- which elements are editable (leaf text nodes only) --------------------
  var EDIT_SEL = [
    ".eyebrow", ".display", ".zh-mega", ".h1", ".h2", ".h3", ".lead", ".body",
    ".quote", ".quote__by", ".tag", ".num", ".data-hero__num", ".data-hero__label",
    ".data-hero__src", ".bar__val", ".cmd", ".comment", ".ok",
    ".chrome-top__brand", ".chrome-top__sec", ".chrome-foot span",
    "h1", "h2", "h3", "h4", "p", "li", "blockquote", "figcaption"
  ].join(",");

  function editableEls() {
    var out = [];
    slides.forEach(function (s) {
      var m = Array.prototype.slice.call(s.querySelectorAll(EDIT_SEL));
      m.forEach(function (el) {
        if (el.closest(".notes,.slide__num,.ppt-toolbar")) return;     // skip notes / chrome
        if (m.some(function (o) { return o !== el && el.contains(o); })) return; // keep leaves only
        if (!el.textContent.trim()) return;
        out.push(el);
      });
    });
    return out;
  }

  // --- snapshot / apply slide content ---------------------------------------
  function capture() {
    return slides.map(function (s) {
      var c = s.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll("[contenteditable]"), function (e) {
        e.removeAttribute("contenteditable"); e.removeAttribute("data-ppt-edit");
      });
      var n = c.querySelector(".slide__num"); if (n) n.remove();
      return c.innerHTML;
    });
  }
  function currentIdx() {
    for (var i = 0; i < slides.length; i++) { if (slides[i].classList.contains("is-active")) return i; }
    return 0;
  }
  function apply(arr) {
    if (!arr) return;
    arr.forEach(function (html, i) { if (slides[i] != null && typeof html === "string") slides[i].innerHTML = html; });
    if (editing) markEditable(true);
    if (window.PptDeck && typeof window.PptDeck.show === "function") window.PptDeck.show(currentIdx());
  }

  // --- edit mode -------------------------------------------------------------
  var editing = false;
  function markEditable(on) {
    editableEls().forEach(function (el) {
      if (on) { el.setAttribute("contenteditable", "true"); el.setAttribute("data-ppt-edit", ""); el.spellcheck = false; }
      else { el.removeAttribute("contenteditable"); el.removeAttribute("data-ppt-edit"); }
    });
  }
  function setEditing(on) {
    editing = on;
    deck.classList.toggle("is-editing", on);
    toolbar.classList.toggle("is-editing", on);
    markEditable(on);
    if (!on) { var s = window.getSelection && window.getSelection(); if (s) s.removeAllRanges(); }
  }

  function save() { lsSet(K_DOC, capture()); toast("已保存到本地"); }
  function clearLocal() {
    try { localStorage.removeItem(K_DOC); } catch (e) {}
    toast("已清除本地编辑（刷新还原原稿）");
  }
  function saveVersion() {
    var vers = lsGet(K_VERS, []);
    vers.unshift({ t: new Date().toISOString(), n: slides.length, doc: capture() });
    if (vers.length > MAX_VERS) vers = vers.slice(0, MAX_VERS);
    lsSet(K_VERS, vers); lsSet(K_DOC, capture());
    toast("已存为历史版本"); renderHistory();
  }

  // --- restore on load -------------------------------------------------------
  (function restore() {
    var doc = lsGet(K_DOC, null);
    if (doc && doc.length === slides.length) {
      slides.forEach(function (s, i) { if (typeof doc[i] === "string") s.innerHTML = doc[i]; });
    }
  })();

  // --- toolbar (shared container; export.js appends to the same row) ---------
  var toolbar = document.getElementById("ppt-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "ppt-toolbar"; toolbar.id = "ppt-toolbar";
    toolbar.innerHTML = '<div class="ppt-toolbar__row" id="ppt-toolbar-main"></div>';
    document.body.appendChild(toolbar);
  }
  var mainRow = toolbar.querySelector("#ppt-toolbar-main");

  function btn(label, cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "ppt-btn" + (cls ? " " + cls : "");
    b.innerHTML = label; return b;
  }
  var bEdit = btn('<span class="ppt-btn__ico">✎</span>编辑', "ppt-btn--edit");
  mainRow.appendChild(bEdit);

  var editbar = document.createElement("div");
  editbar.className = "ppt-editbar";
  var bSave = btn('<span class="ppt-btn__ico">💾</span>保存', "ppt-btn--accent");
  var bVer = btn('<span class="ppt-btn__ico">🕘</span>存历史');
  var bHist = btn('<span class="ppt-btn__ico">📚</span>历史');
  var bDone = btn('<span class="ppt-btn__ico">✓</span>完成');
  [bSave, bVer, bHist, bDone].forEach(function (b) { editbar.appendChild(b); });
  toolbar.appendChild(editbar);

  bEdit.addEventListener("click", function () { setEditing(true); });
  bDone.addEventListener("click", function () { setEditing(false); });
  bSave.addEventListener("click", save);
  bVer.addEventListener("click", saveVersion);
  bHist.addEventListener("click", function () { renderHistory(); history_.classList.add("is-open"); });

  // --- history drawer --------------------------------------------------------
  var history_ = document.createElement("div");
  history_.className = "ppt-history";
  history_.innerHTML =
    '<div class="ppt-history__head"><span class="ppt-history__title">版本历史</span>' +
    '<button type="button" class="ppt-btn" id="ppt-hist-close">关闭</button></div>' +
    '<p class="ppt-history__hint">版本保存在本浏览器（localStorage），离线、不上传。「恢复」会把整份内容回退到该版本。</p>' +
    '<div class="ppt-history__list" id="ppt-hist-list"></div>';
  document.body.appendChild(history_);
  history_.querySelector("#ppt-hist-close").addEventListener("click", function () { history_.classList.remove("is-open"); });
  var histList = history_.querySelector("#ppt-hist-list");

  function fmt(iso) { try { return new Date(iso).toLocaleString(); } catch (e) { return iso; } }
  function renderHistory() {
    var vers = lsGet(K_VERS, []);
    histList.innerHTML = "";
    if (!vers.length) { histList.innerHTML = '<div class="ppt-empty">还没有历史版本。编辑后点「存历史」即可创建一个可恢复的快照。</div>'; return; }
    vers.forEach(function (v, i) {
      var row = document.createElement("div");
      row.className = "ppt-ver";
      row.innerHTML = '<div class="ppt-ver__when">' + fmt(v.t) + '</div>' +
        '<div class="ppt-ver__meta">' + (v.n || (v.doc ? v.doc.length : 0)) + ' 页 · #' + (vers.length - i) + '</div>' +
        '<div class="ppt-ver__row"><button type="button" class="ppt-btn ppt-btn--accent" data-act="restore">恢复</button>' +
        '<button type="button" class="ppt-btn" data-act="del">删除</button></div>';
      row.querySelector('[data-act="restore"]').addEventListener("click", function () {
        apply(v.doc); lsSet(K_DOC, capture()); toast("已恢复到该版本"); history_.classList.remove("is-open");
      });
      row.querySelector('[data-act="del"]').addEventListener("click", function () {
        var arr = lsGet(K_VERS, []); arr.splice(i, 1); lsSet(K_VERS, arr); renderHistory();
      });
      histList.appendChild(row);
    });
  }

  // --- keep runtime nav/shortcuts from firing while editing text -------------
  document.addEventListener("keydown", function (e) {
    if (!editing) return;
    var ae = document.activeElement;
    var inText = ae && ae.getAttribute && ae.getAttribute("contenteditable") === "true";
    if (e.key === "Escape") { if (inText) ae.blur(); setEditing(false); e.stopPropagation(); return; }
    if (inText) e.stopPropagation();          // typing 'f','s','o','t', arrows, space → text, not runtime
  }, true);
  stage.addEventListener("click", function (e) {
    if (editing) e.stopPropagation();          // editing a slide must not flip pages
  }, true);

  // --- toast -----------------------------------------------------------------
  var toastEl = document.createElement("div");
  toastEl.className = "ppt-toast"; document.body.appendChild(toastEl);
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("is-show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-show"); }, 1900);
  }

  // expose a tiny API for export.js (capture current edited content)
  window.PptEditor = { capture: capture, deckId: DECK_ID, toast: toast };
})();
