/* ============================================================================
   ameng-ppt-design · export.js
   Top-right "导出" menu:
     • PDF  — browser print engine (perfect OKLCH, zero dependency)
     • PPTX — editable PowerPoint via self-hosted PptxGenJS (layout-faithful,
              best-effort: text boxes + images positioned from the live layout)
     • PNG  — per-slide image via self-hosted html2canvas (best-effort; for
              pixel-perfect OKLCH output use scripts/render.sh)
     • HTML — download the current (edited) deck as a standalone .html
   PPTX/PNG libs are vendored once by scripts/fetch-export-libs.sh into
   assets/vendor/. PDF + HTML always work with no dependency. Screen-only.
   ============================================================================ */
(function () {
  "use strict";
  if (/[?&](export|print)\b/.test(location.search)) return;
  var deck = document.querySelector(".deck");
  if (!deck) return;
  var stage = deck.querySelector(".deck__stage") || deck;
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  if (!slides.length) return;

  var SELF = (document.currentScript && document.currentScript.src) || "";
  var VENDOR = SELF.replace(/[^\/]*$/, "") + "vendor/";
  var stageW = stage.offsetWidth || 1280, stageH = stage.offsetHeight || 720;

  function toast(m) { (window.PptEditor && window.PptEditor.toast ? window.PptEditor.toast : function (x) { console.log(x); })(m); }
  function deckName() {
    return (deck.getAttribute("data-ppt-id")
      || (document.title || "slides").replace(/[·•|].*$/, "").trim()
      || "slides").replace(/[^\w一-龥-]+/g, "-").replace(/^-+|-+$/g, "") || "slides";
  }
  function currentIdx() { for (var i = 0; i < slides.length; i++) if (slides[i].classList.contains("is-active")) return i; return 0; }
  function ensureLib(file, glob) {
    if (window[glob]) return Promise.resolve(window[glob]);
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = VENDOR + file;
      s.onload = function () { window[glob] ? res(window[glob]) : rej(0); };
      s.onerror = function () { rej(0); };
      document.head.appendChild(s);
    });
  }

  /* ---- PDF: inject exact @page size, then print -------------------------- */
  function exportPDF() {
    var prev = document.getElementById("ppt-print-style");
    if (prev) prev.remove();
    var st = document.createElement("style"); st.id = "ppt-print-style";
    st.textContent = "@media print{@page{size:" + stageW + "px " + stageH + "px;margin:0}}";
    document.head.appendChild(st);
    var done = function () { var e = document.getElementById("ppt-print-style"); if (e) e.remove(); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(function () { window.print(); }, 40);
  }

  /* ---- shared color helper (any CSS color → hex, incl. oklch) ------------ */
  var cctx = document.createElement("canvas").getContext("2d");
  function toHex(c) {
    try { cctx.fillStyle = "#000000"; cctx.fillStyle = c; cctx.fillRect(0, 0, 1, 1);
      var d = cctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]].map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join("");
    } catch (e) { return "111111"; }
  }

  /* ---- PPTX: layout-faithful, best-effort -------------------------------- */
  var TEXT_SEL = ".eyebrow,.display,.zh-mega,.h1,.h2,.h3,.lead,.body,.quote,.quote__by," +
    ".tag,.num,.data-hero__num,.data-hero__label,.data-hero__src,.bar__val,.cmd,.comment,.ok," +
    "h1,h2,h3,h4,p,li,blockquote,figcaption";
  function leaves(root, sel) {
    var m = Array.prototype.slice.call(root.querySelectorAll(sel));
    return m.filter(function (el) {
      if (el.closest(".notes,.slide__num,.ppt-toolbar")) return false;
      if (!el.textContent.trim()) return false;
      return !m.some(function (o) { return o !== el && el.contains(o); });
    });
  }
  function exportPPTX() {
    ensureLib("pptxgen.bundle.js", "PptxGenJS").then(function (Pptx) {
      var px2in = function (px) { return px / 96; };
      var p = new Pptx();
      var inW = px2in(stageW), inH = px2in(stageH);
      p.defineLayout({ name: "PPT", width: inW, height: inH }); p.layout = "PPT";
      var bg = toHex(getComputedStyle(stage).backgroundColor || "#ffffff");
      slides.forEach(function (s) {
        var srect = s.getBoundingClientRect();
        var scale = srect.width / (s.offsetWidth || stageW) || 1;
        var slide = p.addSlide(); slide.background = { color: bg };
        leaves(s, TEXT_SEL).forEach(function (el) {
          var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
          var cs = getComputedStyle(el);
          slide.addText(el.textContent.replace(/\s+/g, " ").trim(), {
            x: px2in((r.left - srect.left) / scale), y: px2in((r.top - srect.top) / scale),
            w: px2in(r.width / scale) + 0.06, h: px2in(r.height / scale) + 0.04,
            fontSize: Math.max(6, Math.round(parseFloat(cs.fontSize) / scale * 0.75)),
            color: toHex(cs.color), bold: parseInt(cs.fontWeight, 10) >= 600,
            italic: cs.fontStyle === "italic",
            align: (cs.textAlign === "center" || cs.textAlign === "right") ? cs.textAlign : "left",
            valign: "top", margin: 0, wrap: true, autoFit: true
          });
        });
        Array.prototype.forEach.call(s.querySelectorAll("img"), function (img) {
          var r = img.getBoundingClientRect(); if (!r.width) return;
          try {
            slide.addImage({ path: img.currentSrc || img.src,
              x: px2in((r.left - srect.left) / scale), y: px2in((r.top - srect.top) / scale),
              w: px2in(r.width / scale), h: px2in(r.height / scale) });
          } catch (e) {}
        });
      });
      toast("正在生成 PPTX…");
      p.writeFile({ fileName: deckName() + ".pptx" }).then(function () { toast("PPTX 已导出（可在 PowerPoint/WPS 编辑）"); });
    }).catch(function () { toast("缺少 PPTX 库：先运行 scripts/fetch-export-libs.sh"); });
  }

  /* ---- PNG: html2canvas, best-effort (script for pixel-perfect) ---------- */
  function exportPNG(all) {
    ensureLib("html2canvas.min.js", "html2canvas").then(function (h2c) {
      var idxs = all ? slides.map(function (_, i) { return i; }) : [currentIdx()];
      var name = deckName();
      (function nextShot(k) {
        if (k >= idxs.length) { toast(all ? "已导出全部 PNG" : "已导出当前页 PNG"); return; }
        var s = slides[idxs[k]];
        h2c(s, { backgroundColor: null, scale: 2, width: s.offsetWidth, height: s.offsetHeight, logging: false })
          .then(function (canvas) {
            var a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = name + "-" + ("0" + (idxs[k] + 1)).slice(-2) + ".png";
            a.click(); setTimeout(function () { nextShot(k + 1); }, 120);
          })
          .catch(function () { toast("PNG 导出失败（本主题用 OKLCH）。请用 scripts/render.sh 出像素级 PNG"); });
      })(0);
    }).catch(function () { toast("缺少 PNG 库：先运行 scripts/fetch-export-libs.sh（或用 scripts/render.sh）"); });
  }

  /* ---- HTML: download current (edited) deck ------------------------------ */
  function exportHTML() {
    var clone = document.documentElement.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll(
      ".ppt-toolbar,.ppt-history,.ppt-toast,.ppt-overview,.ppt-notes-overlay,.slide__num,#ppt-print-style"),
      function (n) { n.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll("[contenteditable]"), function (n) {
      n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit");
    });
    Array.prototype.forEach.call(clone.querySelectorAll(".deck"), function (d) {
      d.classList.remove("is-editing"); d.removeAttribute("data-theme");
    });
    var html = "<!doctype html>\n" + clone.outerHTML;
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = deckName() + ".html"; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("已导出 HTML（含你的编辑；放回 deck 目录即保留样式）");
  }

  /* ---- toolbar button + menu --------------------------------------------- */
  var toolbar = document.getElementById("ppt-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "ppt-toolbar"; toolbar.id = "ppt-toolbar";
    toolbar.innerHTML = '<div class="ppt-toolbar__row" id="ppt-toolbar-main"></div>';
    document.body.appendChild(toolbar);
  }
  var mainRow = toolbar.querySelector("#ppt-toolbar-main") || toolbar;

  var menu = document.createElement("div");
  menu.className = "ppt-menu";
  menu.innerHTML =
    '<button type="button" class="ppt-btn"><span class="ppt-btn__ico">⤓</span>导出</button>' +
    '<div class="ppt-menu__list">' +
      '<button class="ppt-menu__item" data-x="pdf">导出 PDF<small>打印·最佳保真</small></button>' +
      '<button class="ppt-menu__item" data-x="pptx">导出 PPTX<small>可编辑·近似</small></button>' +
      '<div class="ppt-menu__sep"></div>' +
      '<button class="ppt-menu__item" data-x="png1">PNG · 当前页<small>html2canvas</small></button>' +
      '<button class="ppt-menu__item" data-x="pngall">PNG · 全部<small>html2canvas</small></button>' +
      '<div class="ppt-menu__sep"></div>' +
      '<button class="ppt-menu__item" data-x="html">导出 HTML<small>含编辑</small></button>' +
    '</div>';
  mainRow.appendChild(menu);
  var menuBtn = menu.querySelector(".ppt-btn");
  menuBtn.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.toggle("is-open"); });
  document.addEventListener("click", function () { menu.classList.remove("is-open"); });
  menu.querySelector(".ppt-menu__list").addEventListener("click", function (e) {
    var it = e.target.closest(".ppt-menu__item"); if (!it) return;
    menu.classList.remove("is-open");
    var x = it.getAttribute("data-x");
    if (x === "pdf") exportPDF();
    else if (x === "pptx") exportPPTX();
    else if (x === "png1") exportPNG(false);
    else if (x === "pngall") exportPNG(true);
    else if (x === "html") exportHTML();
  });

  window.PptExport = { pdf: exportPDF, pptx: exportPPTX, png: exportPNG, html: exportHTML };
})();
