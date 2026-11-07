/* overlays.js — overview (O), notes (S), help (?). Thumbnails are real rasterised
   frames, not cloned DOM, so a 60-page deck opens instantly and shows true pixels. */
(function () {
  "use strict";
  if (!window.Deck || Deck.mode.static || Deck.mode.audience) return;
  var ui = document.createElement("div");
  ui.className = "ui";
  ui.innerHTML = '<div class="overview" role="dialog" aria-label="全部页面"></div><div class="sheet" contenteditable="plaintext-only" spellcheck="false" aria-label="讲者备注"></div>' +
    '<div class="help" role="dialog" aria-label="快捷键"><div><span>翻页 / 下一步</span><kbd>← → 空格</kbd></div><div><span>全部页面</span><kbd>O</kbd></div><div><span>讲者备注</span><kbd>S</kbd></div><div><span>演讲者视图</span><kbd>P</kbd></div><div><span>全屏放映</span><kbd>F</kbd></div><div><span>网页阅读模式</span><kbd>W</kbd></div><div><span>深浅色</span><kbd>T</kbd></div><div><span>编辑</span><kbd>E</kbd></div></div>';
  document.body.appendChild(ui);
  var ov = ui.querySelector(".overview"), sheet = ui.querySelector(".sheet"), help = ui.querySelector(".help");

  /* A thumbnail is a scaled clone: real layout, no scripts, canvases frozen to a picture */
  function mini(slide, frame) {
    var wrap = document.createElement("div"), st = document.createElement("div"), c = slide.cloneNode(true);
    wrap.className = "deck ov-mini"; wrap.setAttribute("data-theme", Deck.el.getAttribute("data-theme"));
    st.className = "stage"; c.classList.add("is-active");
    Array.prototype.forEach.call(c.querySelectorAll("[data-step]"), function (e) { e.style.visibility = ""; });
    Array.prototype.forEach.call(c.querySelectorAll(".notes,script,.chart-tip"), function (e) { e.remove(); });
    var live = slide.querySelectorAll("canvas"), dead = c.querySelectorAll("canvas");
    Array.prototype.forEach.call(dead, function (d, i) {
      var im = new Image();
      try { im.src = live[i].toDataURL("image/jpeg", .7); } catch (e) {}
      im.className = d.className; d.replaceWith(im);
    });
    st.appendChild(c); wrap.appendChild(st); frame.appendChild(wrap);
    requestAnimationFrame(function () { wrap.style.transform = "scale(" + frame.clientWidth / 1920 + ")"; });
  }
  function titleOf(s) { var t = s.querySelector(".title,.hero"); return t ? t.textContent.trim() : ""; }
  function buildOverview() {
    ov.innerHTML = "";
    Deck.slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ov" + (i === Deck.index ? " is-current" : "") + (s.hasAttribute("data-hidden") ? " is-hidden" : "");
      b.innerHTML = '<span class="ov__frame"></span><span class="ov__cap"><b></b><span></span></span>';
      b.querySelector("b").textContent = String(i + 1).padStart(2, "0");
      b.querySelector(".ov__cap span").textContent = titleOf(s);
      b.addEventListener("click", function () { ov.classList.remove("is-open"); Deck.go(i, { instant: true }); });
      ov.appendChild(b);
      mini(s, b.querySelector(".ov__frame"));
    });
  }
  function toggleOverview() {
    if (ov.classList.toggle("is-open")) buildOverview(); else ov.innerHTML = "";
  }
  function noteOf(i) { var n = Deck.slides[i].querySelector(":scope > .notes"); return n ? n.textContent.trim() : ""; }
  function syncNote() { if (document.activeElement !== sheet) sheet.textContent = noteOf(Deck.index); }
  sheet.addEventListener("input", function () {
    var s = Deck.slides[Deck.index], n = s.querySelector(":scope > .notes");
    if (!n) { n = document.createElement("aside"); n.className = "notes"; s.appendChild(n); }
    n.textContent = sheet.textContent;
    Deck.emit("dirty", { slide: Deck.index });
  });
  Deck.on(function (type, e) {
    if (type === "slide") syncNote();
    if (type !== "key") return;
    switch (e.key) {
      case "o": case "O": case "0": toggleOverview(); break;
      case "s": case "S": sheet.classList.toggle("is-open"); syncNote(); break;
      case "?": case "h": case "H": help.classList.toggle("is-open"); break;
      case "Escape": ov.classList.remove("is-open"); sheet.classList.remove("is-open"); help.classList.remove("is-open"); break;
    }
  });
  syncNote();
  window.Overlays = { mini: mini, rebuild: function () { if (ov.classList.contains("is-open")) buildOverview(); }, el: ov, toggleOverview: toggleOverview, toggleNotes: function () { sheet.classList.toggle("is-open"); syncNote(); }, toggleHelp: function () { help.classList.toggle("is-open"); } };
})();
