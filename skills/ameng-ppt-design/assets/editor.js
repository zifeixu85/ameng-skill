/* ============================================================================
   ameng-ppt-design · editor.js
   Floating dock (top-right, reveals on top-edge hover, theme-aware, inside .deck)
   with in-place editing + auto-versioned, PER-PAGE history.
     • 编辑 → 就地改文字（含讲者备注）→ 完成（退出 + 自动存当前页一个版本）
     • 历史 → 只看「当前页」的版本，带与上一版的文字 diff，可一键恢复；
              「历史」按钮带角标显示当前页有几个版本（无修改不显示）
     • 全屏 → 放映（点按手势）；进入全屏自动退出编辑、并隐藏 dock/帮助
   localStorage, offline, screen-only (hidden on ?export/?print).
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
  var K_DOC = DECK_ID + ":doc", K_VERS = DECK_ID + ":pageVersions", K_BASE = DECK_ID + ":base", MAX_VERS = 40;
  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

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
  function cleanClone(s, dropNotes) {
    var c = s.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll("[contenteditable],[data-ppt-edit],[spellcheck]"), function (e) {
      e.removeAttribute("contenteditable"); e.removeAttribute("data-ppt-edit"); e.removeAttribute("spellcheck");
    });
    var n = c.querySelector(".slide__num"); if (n) n.remove();
    if (dropNotes) { var nt = c.querySelector(".notes"); if (nt) nt.remove(); }
    return c.innerHTML;
  }
  function capture() { return slides.map(function (s) { return cleanClone(s, false); }); }          // full (incl. notes) → persistence
  function captureNoNotes() { return slides.map(function (s) { return cleanClone(s, true); }); }     // content only → versions/diff
  function currentIdx() { for (var i = 0; i < slides.length; i++) if (slides[i].classList.contains("is-active")) return i; return 0; }
  function refreshActive() { if (window.PptDeck && typeof window.PptDeck.show === "function") window.PptDeck.show(currentIdx()); }

  // baseline (pristine) captured once, so the first edit only versions changed pages
  (function init() {
    if (!lsGet(K_BASE, null)) lsSet(K_BASE, captureNoNotes());        // default version 1 (content only)
    var doc = lsGet(K_DOC, null);
    if (doc && doc.length === slides.length) slides.forEach(function (s, i) { if (typeof doc[i] === "string") s.innerHTML = doc[i]; });
  })();

  // --- edit mode (text + speaker notes) -------------------------------------
  var editing = false;
  function markEditable(on) {
    editableEls().forEach(function (el) {
      if (on) { el.setAttribute("contenteditable", "true"); el.setAttribute("data-ppt-edit", ""); el.spellcheck = false; }
      else { el.removeAttribute("contenteditable"); el.removeAttribute("data-ppt-edit"); el.removeAttribute("spellcheck"); }
    });
    slides.forEach(function (s) {                                   // speaker notes editable too (shown in edit mode via CSS)
      var n = s.querySelector(".notes");
      if (!n) return;
      if (on) { n.setAttribute("contenteditable", "true"); n.setAttribute("data-ppt-edit", ""); n.spellcheck = false; }
      else { n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit"); n.removeAttribute("spellcheck"); }
    });
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
      var c = autoVersion();
      toast(c ? ("已保存 " + c + " 页的新版本") : "已退出编辑（内容无改动）");
    }
  }
  function fullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (deck.requestFullscreen) deck.requestFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch (e) { toast("全屏被浏览器拦截"); }
  }
  document.addEventListener("fullscreenchange", function () { if (document.fullscreenElement && editing) setEditing(false); });

  // --- per-page version store -----------------------------------------------
  function autoVersion() {
    lsSet(K_DOC, capture());                          // persist full (incl. notes) so notes survive reload
    var doc = captureNoNotes();                        // notes excluded → editing notes never makes a version
    var base = lsGet(K_BASE, null) || [];
    var vmap = lsGet(K_VERS, {});
    var now = new Date().toISOString(), changed = 0;
    for (var i = 0; i < doc.length; i++) {
      var list = vmap[i] || [];
      var prev = list.length ? list[0].html : (base[i] != null ? base[i] : null);
      if (doc[i] !== prev) { list.unshift({ t: now, html: doc[i] }); if (list.length > MAX_VERS) list = list.slice(0, MAX_VERS); vmap[i] = list; changed++; }
    }
    if (changed) lsSet(K_VERS, vmap);
    updateBadge();
    return changed;
  }
  function restoreContent(idx, html) {                 // restore a content version while KEEPING current notes
    var cur = slides[idx], notes = cur.querySelector(".notes"), keep = notes ? notes.cloneNode(true) : null;
    cur.innerHTML = html; if (keep) cur.appendChild(keep);
    if (editing) markEditable(true);
    refreshActive(); lsSet(K_DOC, capture()); updateBadge();
  }

  // --- dock (inside .deck → theme scope) ------------------------------------
  var dock = document.createElement("div");
  dock.className = "ppt-dock"; dock.id = "ppt-dock";
  dock.innerHTML = '<div class="ppt-dock__handle" id="ppt-dock-handle" title="编辑 / 导出 / 历史">⋯</div><div class="ppt-dock__panel" id="ppt-dock-panel"></div>';
  deck.appendChild(dock);
  var panel = dock.querySelector("#ppt-dock-panel");
  function act(html, cls) { var b = document.createElement("button"); b.type = "button"; b.className = "ppt-act" + (cls ? " " + cls : ""); b.innerHTML = html; return b; }
  var bEdit = act('<span class="ppt-act__ico">✎</span>编辑');
  var bDone = act('<span class="ppt-act__ico">✓</span>完成', "ppt-act--primary"); bDone.hidden = true;
  var slot = document.createElement("span"); slot.id = "ppt-dock-export-slot"; slot.style.display = "contents";
  var bFull = act('<span class="ppt-act__ico">⤢</span>全屏');
  var bHist = act('<span class="ppt-act__ico">🕘</span>历史<sup class="ppt-badge" hidden></sup>');
  [bEdit, bDone, slot, bFull, bHist].forEach(function (n) { panel.appendChild(n); });
  bEdit.addEventListener("click", function () { setEditing(true); });
  bDone.addEventListener("click", function () { setEditing(false); });
  bFull.addEventListener("click", fullscreen);
  bHist.addEventListener("click", function () { renderHistory(); drawer.classList.add("is-open"); });
  dock.querySelector("#ppt-dock-handle").addEventListener("click", function () { dock.classList.toggle("is-open"); });

  // reveal on top-edge hover (no blocking element — uses mousemove threshold)
  var closeT;
  function openDock() { clearTimeout(closeT); dock.classList.add("is-open"); }
  function scheduleClose() {
    clearTimeout(closeT);
    closeT = setTimeout(function () {
      if (editing || dock.matches(":hover")) return;
      if (document.querySelector("#ppt-export-sub.is-open")) return;
      dock.classList.remove("is-open");
    }, 480);
  }
  document.addEventListener("mousemove", function (e) {
    if (e.clientY <= 46) openDock();
    else if (e.clientY > 150 && !dock.contains(e.target)) scheduleClose();
  });
  dock.addEventListener("mouseenter", openDock);
  dock.addEventListener("mouseleave", scheduleClose);

  function updateBadge() {
    var n = (lsGet(K_VERS, {})[currentIdx()] || []).length + 1;   // +1 = the default/initial version
    var b = bHist.querySelector(".ppt-badge");
    if (!b) return;
    if (n >= 2) { b.textContent = n; b.hidden = false; } else { b.hidden = true; }   // show only when there's a real edit
  }

  // --- history drawer (current page only) + diff ----------------------------
  var drawer = document.createElement("div");
  drawer.className = "ppt-history";
  drawer.innerHTML =
    '<div class="ppt-history__head"><span class="ppt-history__title" id="ppt-hist-title">版本历史</span>' +
    '<button type="button" class="ppt-act" id="ppt-hist-close" style="border:1px solid var(--line-strong)">关闭</button></div>' +
    '<p class="ppt-history__hint">只显示「当前页」的版本。每次点「完成」若本页有改动就自动存一版（本浏览器，离线）。下方是与上一版的文字差异。</p>' +
    '<div class="ppt-history__list" id="ppt-hist-list"></div>';
  deck.appendChild(drawer);
  drawer.querySelector("#ppt-hist-close").addEventListener("click", function () { drawer.classList.remove("is-open"); });
  var histList = drawer.querySelector("#ppt-hist-list"), histTitle = drawer.querySelector("#ppt-hist-title");

  function esc(s) { return (s || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function trunc(s, n) { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  var tmp = document.createElement("div");
  function textOf(html) { tmp.innerHTML = html || ""; return tmp.textContent.replace(/\s+/g, " ").trim(); }
  function pageDiff(newHtml, oldHtml) {
    if (oldHtml == null) return '<span class="nochg">初始版本之后的首次改动</span>';
    var a = textOf(newHtml), b = textOf(oldHtml);
    if (a === b) return '<span class="nochg">无文字变化（结构/备注等）</span>';
    return '<span class="del">' + esc(trunc(b, 90)) + '</span><br>→ <span class="add">' + esc(trunc(a, 90)) + '</span>';
  }
  function fmt(iso) { try { return new Date(iso).toLocaleString(); } catch (e) { return iso; } }
  function renderHistory() {
    var idx = currentIdx(), vmap = lsGet(K_VERS, {}), base = lsGet(K_BASE, null) || [], edits = vmap[idx] || [];
    histTitle.textContent = "第 " + (idx + 1) + " 页 · 版本历史";
    histList.innerHTML = "";
    // newest edit → … → 默认版本（版本 1），永远在列表里
    var entries = edits.map(function (v) { return { t: v.t, html: v.html, base: false }; });
    entries.push({ t: null, html: (base[idx] != null ? base[idx] : ""), base: true });
    var total = entries.length, live = captureNoNotes();
    entries.forEach(function (en, j) {
      var num = total - j;                                          // 默认版本（最后一条）= 版本 1
      var older = entries[j + 1] ? entries[j + 1].html : null;
      var isCur = j === 0 && en.html === live[idx];
      var card = document.createElement("div");
      card.className = "ppt-ver" + (isCur ? " is-current" : "");
      card.innerHTML = '<div class="ppt-ver__when">' + (en.base ? "默认版本（初始）" : fmt(en.t)) +
        (isCur ? '<span class="ppt-ver__tag">当前</span>' : '<span class="ppt-ver__tag">版本 ' + num + '</span>') + '</div>' +
        '<div class="ppt-ver__diff">' + (en.base ? '<span class="nochg">这一页的初始内容</span>' : pageDiff(en.html, older)) + '</div>' +
        '<div class="ppt-ver__row"><button type="button" class="ppt-act ppt-act--primary" data-act="restore">恢复此版本</button>' +
        (en.base ? '' : '<button type="button" class="ppt-act" data-act="del">删除</button>') + '</div>';
      card.querySelector('[data-act="restore"]').addEventListener("click", function () {
        restoreContent(idx, en.html); toast(en.base ? "已恢复本页到默认版本" : "已恢复本页到版本 " + num); drawer.classList.remove("is-open");
      });
      var del = card.querySelector('[data-act="del"]');
      if (del) del.addEventListener("click", function () { var m = lsGet(K_VERS, {}); (m[idx] || []).splice(j, 1); lsSet(K_VERS, m); updateBadge(); renderHistory(); });
      histList.appendChild(card);
    });
  }

  // keep badge + open history in sync with the active slide (any nav method)
  var moT; var mo = new MutationObserver(function () { clearTimeout(moT); moT = setTimeout(function () { updateBadge(); if (drawer.classList.contains("is-open")) renderHistory(); }, 90); });
  mo.observe(stage, { subtree: true, attributes: true, attributeFilter: ["class"] });
  updateBadge();

  // --- block runtime nav/shortcuts while typing -----------------------------
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

  window.PptEditor = { capture: capture, deckId: DECK_ID, toast: toast, deck: deck, stage: stage, slides: slides, currentIdx: currentIdx };
})();
