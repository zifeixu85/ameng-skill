/* ============================================================================
   ameng-ppt-design · export.js
   Image-based export so output keeps EVERY style (no print-engine loss):
     1) render each slide to a high-res PNG (modern-screenshot, OKLCH-faithful)
     2) assemble → PDF (jsPDF) / PPTX (PptxGenJS, one full-bleed image per slide)
     • PNG  — current slide, or all slides zipped (JSZip)
     • HTML — fully self-contained: all CSS inlined, fonts embedded, navigable
   Libs are vendored in assets/vendor/ (committed → works offline out of the box;
   re-fetch with scripts/fetch-export-libs.sh). Adds a "导出" item to the dock.
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
  var ASSETS = SELF.replace(/[^\/]*$/, "");            // .../assets/
  var VENDOR = ASSETS + "vendor/";
  var stageW = stage.offsetWidth || 1280, stageH = stage.offsetHeight || 720;
  function toast(m) { (window.PptEditor && window.PptEditor.toast) ? window.PptEditor.toast(m) : console.log(m); }
  function currentIdx() { return window.PptEditor && window.PptEditor.currentIdx ? window.PptEditor.currentIdx() : 0; }
  function deckName() {
    return (deck.getAttribute("data-ppt-id") || (document.title || "slides").replace(/[·•|].*$/, "").trim() || "slides")
      .replace(/[^\w一-龥-]+/g, "-").replace(/^-+|-+$/g, "") || "slides";
  }
  function pad(n) { return ("0" + n).slice(-2); }
  function ensureLib(file, glob) {
    if (window[glob]) return Promise.resolve(window[glob]);
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = VENDOR + file;
      s.onload = function () { window[glob] ? res(window[glob]) : rej(0); };
      s.onerror = function () { rej(0); };
      document.head.appendChild(s);
    });
  }
  function download(blobOrUrl, name) {
    var a = document.createElement("a"); a.download = name;
    a.href = (typeof blobOrUrl === "string") ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    document.body.appendChild(a); a.click(); a.remove();
    if (typeof blobOrUrl !== "string") setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  /* ---- capture each slide to a PNG dataURL (all styles preserved) -------- */
  function withCapture(fn) {
    deck.classList.add("ppt-exporting");
    var prevOpacity = stage.style.opacity; stage.style.opacity = "0";   // hide on-screen flash
    return Promise.resolve()
      .then(fn)
      .finally(function () { stage.style.opacity = prevOpacity; deck.classList.remove("ppt-exporting"); });
  }
  function shoot(ms, slideEl) {
    return ms.domToPng(slideEl, {
      width: slideEl.offsetWidth, height: slideEl.offsetHeight, scale: 2,
      backgroundColor: getComputedStyle(stage).backgroundColor,
      style: { transform: "none", opacity: "1", visibility: "visible" }
    });
  }
  function captureAll(ms) {
    var urls = [];
    return slides.reduce(function (p, s) {
      return p.then(function () { return shoot(ms, s); }).then(function (u) { urls.push(u); });
    }, Promise.resolve()).then(function () { return urls; });
  }

  /* ---- PDF (images assembled, exact slide size) -------------------------- */
  function exportPDF() {
    toast("正在导出 PDF…");
    Promise.all([ensureLib("modern-screenshot.js", "modernScreenshot"), ensureLib("jspdf.umd.min.js", "jspdf")])
      .then(function (libs) {
        var ms = libs[0], jsPDF = libs[1].jsPDF;
        return withCapture(function () { return captureAll(ms); }).then(function (urls) {
          var pdf = new jsPDF({ orientation: stageW >= stageH ? "landscape" : "portrait", unit: "px", format: [stageW, stageH], compress: true });
          urls.forEach(function (u, i) {
            if (i) pdf.addPage([stageW, stageH], stageW >= stageH ? "landscape" : "portrait");
            pdf.addImage(u, "PNG", 0, 0, stageW, stageH);
          });
          pdf.save(deckName() + ".pdf"); toast("PDF 已导出（" + urls.length + " 页，全样式）");
        });
      }).catch(function () { toast("PDF 导出失败：缺库则跑 scripts/fetch-export-libs.sh；file:// 打开请改用本地服务器或 render.sh"); });
  }

  /* ---- PPTX (one full-bleed image per slide) ----------------------------- */
  function exportPPTX() {
    toast("正在导出 PPTX…");
    Promise.all([ensureLib("modern-screenshot.js", "modernScreenshot"), ensureLib("pptxgen.bundle.js", "PptxGenJS")])
      .then(function (libs) {
        var ms = libs[0], Pptx = libs[1];
        return withCapture(function () { return captureAll(ms); }).then(function (urls) {
          var p = new Pptx(), inW = stageW / 96, inH = stageH / 96;
          p.defineLayout({ name: "PPT", width: inW, height: inH }); p.layout = "PPT";
          urls.forEach(function (u) { p.addSlide().addImage({ data: u, x: 0, y: 0, w: inW, h: inH }); });
          return p.writeFile({ fileName: deckName() + ".pptx" }).then(function () { toast("PPTX 已导出（每页整图，全样式）"); });
        });
      }).catch(function () { toast("PPTX 导出失败：缺库则跑 scripts/fetch-export-libs.sh；file:// 请改用本地服务器"); });
  }

  /* ---- PNG (current page, or all zipped) --------------------------------- */
  function exportPNG(all) {
    toast(all ? "正在导出全部 PNG…" : "正在导出当前页 PNG…");
    ensureLib("modern-screenshot.js", "modernScreenshot").then(function (ms) {
      if (!all) {
        return withCapture(function () { return shoot(ms, slides[currentIdx()]); })
          .then(function (u) { download(u, deckName() + "-" + pad(currentIdx() + 1) + ".png"); toast("当前页 PNG 已导出"); });
      }
      return ensureLib("jszip.min.js", "JSZip").then(function (JSZip) {
        return withCapture(function () { return captureAll(ms); }).then(function (urls) {
          var zip = new JSZip(), nm = deckName();
          urls.forEach(function (u, i) { zip.file(nm + "-" + pad(i + 1) + ".png", u.split(",")[1], { base64: true }); });
          return zip.generateAsync({ type: "blob" }).then(function (blob) { download(blob, nm + "-png.zip"); toast("全部 PNG 已打包导出"); });
        });
      });
    }).catch(function () { toast("PNG 导出失败：缺库则跑 scripts/fetch-export-libs.sh；file:// 请改用本地服务器或 render.sh"); });
  }

  /* ---- HTML (fully self-contained: inline CSS + embed fonts) ------------- */
  function exportHTML() {
    toast("正在打包完整 HTML…");
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
    var runtimeSrc = (document.querySelector('script[src*="runtime.js"]') || {}).src;
    var b64 = function (buf) { var s = "", b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); };
    var inlineFontUrls = function (css, baseUrl) {
      var urls = []; css.replace(/url\(\s*['"]?([^'")]+\.woff2?)['"]?\s*\)/g, function (_, u) { urls.push(u); return _; });
      return Promise.all(urls.map(function (u) {
        var abs = new URL(u, baseUrl).href;
        return fetch(abs).then(function (r) { return r.arrayBuffer(); })
          .then(function (buf) { return { u: u, data: "data:font/woff2;base64," + b64(buf) }; })
          .catch(function () { return null; });
      })).then(function (subs) {
        subs.filter(Boolean).forEach(function (s) { css = css.split(s.u).join(s.data); });
        return css;
      });
    };
    Promise.all(links.map(function (l) {
      return fetch(l.href).then(function (r) { return r.text(); }).then(function (css) { return inlineFontUrls(css, l.href); }).catch(function () { return null; });
    })).then(function (cssTexts) {
      var styles = cssTexts.filter(Boolean).map(function (c) { return "<style>\n" + c + "\n</style>"; }).join("\n");
      var rt = runtimeSrc ? fetch(runtimeSrc).then(function (r) { return r.text(); }).catch(function () { return ""; }) : Promise.resolve("");
      return rt.then(function (rtCode) {
        var clone = document.documentElement.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('link[rel="stylesheet"],script,.ppt-dock,.ppt-history,.ppt-toast,.ppt-overview,.ppt-notes-overlay,.ppt-help,.slide__num'), function (n) { n.remove(); });
        Array.prototype.forEach.call(clone.querySelectorAll("[contenteditable]"), function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit"); });
        var d = clone.querySelector(".deck"); if (d) { d.classList.remove("is-editing", "ppt-exporting"); }
        var head = clone.querySelector("head"); if (head) head.insertAdjacentHTML("beforeend", styles);
        var body = clone.querySelector("body"); if (body && rtCode) body.insertAdjacentHTML("beforeend", "<script>\n" + rtCode + "\n<\/script>");
        var html = "<!doctype html>\n" + clone.outerHTML;
        download(new Blob([html], { type: "text/html;charset=utf-8" }), deckName() + ".html");
        toast("已导出完整 HTML（样式/字体内联，可独立打开）");
      });
    }).catch(function () { toast("HTML 打包失败（file:// 限制 fetch）。请用本地服务器打开后再导出，或用 scripts/render.sh"); });
  }

  /* ---- inject "导出" sub-menu into the dock ------------------------------- */
  var slot = document.getElementById("ppt-dock-export-slot");
  if (!slot) return;
  var sub = document.createElement("span"); sub.className = "ppt-sub"; sub.id = "ppt-export-sub"; sub.style.display = "contents";
  sub.innerHTML =
    '<button type="button" class="ppt-act" id="ppt-export-btn"><span class="ppt-act__ico">⤓</span>导出</button>' +
    '<div class="ppt-sub__list" id="ppt-export-list">' +
      '<button class="ppt-sub__item" data-x="pdf">导出 PDF<small>逐页截图拼装</small></button>' +
      '<button class="ppt-sub__item" data-x="pptx">导出 PPTX<small>每页整图</small></button>' +
      '<div class="ppt-sub__sep"></div>' +
      '<button class="ppt-sub__item" data-x="png1">PNG · 当前页</button>' +
      '<button class="ppt-sub__item" data-x="pngall">PNG · 全部 (zip)</button>' +
      '<div class="ppt-sub__sep"></div>' +
      '<button class="ppt-sub__item" data-x="html">导出 HTML<small>完整含样式</small></button>' +
    '</div>';
  slot.appendChild(sub);
  var subBtn = sub.querySelector("#ppt-export-btn");
  subBtn.addEventListener("click", function (e) { e.stopPropagation(); sub.classList.toggle("is-open"); });
  document.addEventListener("click", function () { sub.classList.remove("is-open"); });
  sub.querySelector("#ppt-export-list").addEventListener("click", function (e) {
    var it = e.target.closest(".ppt-sub__item"); if (!it) return;
    sub.classList.remove("is-open");
    var x = it.getAttribute("data-x");
    if (x === "pdf") exportPDF(); else if (x === "pptx") exportPPTX();
    else if (x === "png1") exportPNG(false); else if (x === "pngall") exportPNG(true);
    else if (x === "html") exportHTML();
  });

  window.PptExport = { pdf: exportPDF, pptx: exportPPTX, png: exportPNG, html: exportHTML };
})();
