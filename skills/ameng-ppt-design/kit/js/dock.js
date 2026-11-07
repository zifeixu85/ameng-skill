/* dock.js — one quiet pill at the bottom; wakes when the pointer moves near it. */
(function () {
  "use strict";
  if (!window.Deck || Deck.mode.static || Deck.mode.audience) return;
  var THEMES = [["paper", "纸墨", "品牌 · 课程"], ["noir", "夜幕", "发布 · 路演"], ["swiss", "网格", "数据汇报"], ["spec", "规格", "技术 · AI 产品"], ["block", "色块", "课程 · 创意"], ["board", "董事会", "诊断 · 方案"]];
  var ui = document.createElement("div"); ui.className = "ui";
  ui.innerHTML = '<div class="dock" role="toolbar" aria-label="演示工具"><button data-a="prev" aria-label="上一页">←</button><span class="where"></span><button data-a="next" aria-label="下一页">→</button><span class="sep"></span><button data-a="overview">全部</button><button data-a="theme">主题</button><button data-a="edit">编辑</button><button data-a="export">导出</button><span class="sep"></span><button data-a="read">阅读</button><button data-a="present">放映</button><button data-a="more" aria-label="更多">⋯</button></div><div class="menu" data-m="theme" hidden></div><div class="menu" data-m="more" hidden><button data-a="notes">讲者备注 <small>S</small></button><button data-a="speaker">演讲者视图 <small>P</small></button><button data-a="tone">深浅色 <small>T</small></button><button data-a="history">本页版本</button><button data-a="help">快捷键 <small>?</small></button></div><div class="toast" role="status"></div>';
  document.body.appendChild(ui);
  var dock = ui.querySelector(".dock"), where = ui.querySelector(".where"), toastEl = ui.querySelector(".toast"), toastT, sleepT;
  var themeMenu = ui.querySelector('[data-m="theme"]'), moreMenu = ui.querySelector('[data-m="more"]');
  /* <meta name="deck-style" content="id|名称|基础主题"> lists this deck's custom styles */
  var customs = Array.prototype.map.call(document.querySelectorAll('meta[name="deck-style"]'), function (m) { return m.content.split("|"); });
  function esc(t) { var d = document.createElement("i"); d.textContent = t; return d.innerHTML; }
  themeMenu.innerHTML = customs.map(function (c) { return '<button data-theme-pick="' + esc(c[2]) + '" data-style-pick="' + esc(c[0]) + '">' + esc(c[1]) + " <small>为这份定制</small></button>"; }).join("") + (customs.length ? "<hr>" : "") +
    THEMES.map(function (t) { return '<button data-theme-pick="' + t[0] + '">' + t[1] + " <small>" + t[2] + "</small></button>"; }).join("") +
    '<hr><label class="pick">主题色 <input type="color" aria-label="选择主题色"></label><button data-accent-reset>恢复默认色</button><p class="hint">都不满意？在对话里描述你想要的风格，我来生成。</p>';
  var picker = themeMenu.querySelector("input");
  picker.addEventListener("input", function () { Deck.setAccent(picker.value); });

  function toast(msg, ms) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, ms || 2200); }
  function closeMenus() { themeMenu.hidden = true; moreMenu.hidden = true; }
  function place(menu, btn) {
    var r = btn.getBoundingClientRect();
    menu.hidden = false;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, r.left + r.width / 2 - menu.offsetWidth / 2)) + "px";
    menu.style.bottom = (window.innerHeight - r.top + 8) + "px";
  }
  function wake(ms) {
    dock.classList.add("is-awake");
    clearTimeout(sleepT); sleepT = setTimeout(function () { if (!dock.matches(":hover")) dock.classList.remove("is-awake"); }, ms || 2400);
  }
  document.addEventListener("pointermove", function (e) { if (e.clientY > window.innerHeight - 120) wake(); });
  function need(file, then) {
    if (window.KIT_BUNDLED) { then(); return; }
    var s = document.createElement("script");
    s.src = window.KIT_BASE + file; s.onload = then; s.onerror = function () { toast("这个功能的文件缺失：" + file); };
    document.head.appendChild(s);
  }
  function act(a, btn) {
    switch (a) {
      case "prev": Deck.prev(); break;
      case "next": Deck.next(); break;
      case "overview": Overlays.toggleOverview(); break;
      case "theme": var open = themeMenu.hidden; closeMenus(); if (open) { markTheme(); place(themeMenu, btn); } break;
      case "more": var o2 = moreMenu.hidden; closeMenus(); if (o2) place(moreMenu, btn); break;
      case "read": Deck.setRead(!Deck.el.classList.contains("is-read")); break;
      case "present": Deck.fullscreen(); break;
      case "notes": closeMenus(); Overlays.toggleNotes(); break;
      case "help": closeMenus(); Overlays.toggleHelp(); break;
      case "tone": closeMenus(); document.dispatchEvent(new KeyboardEvent("keydown", { key: "t" })); break;
      case "speaker": closeMenus(); Presenter.toggle(); break;
      case "history": closeMenus(); if (window.Editor) Editor.history(); else need("js/edit.js", function () { Editor.history(); }); break;
      case "edit": if (window.Editor) Editor.toggle(); else need("js/edit.js", function () { Editor.toggle(); }); break;
      case "export": if (window.Exporter) Exporter.menu(btn); else need("js/export/load.js", function () { Exporter.menu(btn); }); break;
    }
  }
  function markTheme() {
    var cur = Deck.el.getAttribute("data-theme"), style = Deck.el.getAttribute("data-style");
    Array.prototype.forEach.call(themeMenu.querySelectorAll("[data-theme-pick]"), function (b) {
      b.classList.toggle("is-on", style ? b.getAttribute("data-style-pick") === style : !b.hasAttribute("data-style-pick") && b.getAttribute("data-theme-pick") === cur);
    });
  }
  ui.addEventListener("click", function (e) {
    if (e.target.closest("[data-accent-reset]")) { Deck.setAccent(null); return; }
    var p = e.target.closest("[data-theme-pick]");
    if (p) { Deck.setTheme(p.getAttribute("data-theme-pick"), p.getAttribute("data-style-pick")); markTheme(); return; }
    var b = e.target.closest("[data-a]");
    if (b) act(b.getAttribute("data-a"), b);
  });
  document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".menu,.dock")) closeMenus(); });
  function sync() { where.textContent = (Deck.index + 1) + " / " + Deck.slides.length; }
  Deck.on(function (t, e) {
    if (t === "slide") sync();
    if (t === "key" && (e.key === "e" || e.key === "E")) act("edit");
  });
  /* load the editor early when served, so edits made in the notes sheet persist too */
  if (location.protocol !== "file:") need("js/edit.js", function () {});
  sync(); wake(9000);  /* theme and export live here, so stay visible long enough to be found */
  window.Dock = { toast: toast, wake: wake, close: closeMenus, need: need };
})();
