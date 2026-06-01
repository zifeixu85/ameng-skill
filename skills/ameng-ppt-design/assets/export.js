/* ============================================================================
   ameng-ppt-design · export.js
   Image-based export (keeps EVERY style — backgrounds, 角标/小标题/页脚 chrome,
   highlight bands, grain). For each slide we ACTIVATE it then snapshot the whole
   .deck__stage (slide + chrome composited) → assemble:
     • PDF   (jsPDF)              • PPTX 图片版 (PptxGenJS, full-bleed image/slide)
     • PNG   (current / all-zip)  • PPTX 可编辑（文字版, PptxGenJS text boxes — 样式简化）
     • HTML  (self-contained: CSS inlined + fonts embedded + runtime inlined)
   Libs vendored in assets/vendor/ (committed → offline). Adds "导出" to the dock.
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
  function toast(m) { (window.PptEditor && window.PptEditor.toast) ? window.PptEditor.toast(m) : console.log(m); }
  function curIdx() { return window.PptEditor && window.PptEditor.currentIdx ? window.PptEditor.currentIdx() : 0; }
  function show(i) { if (window.PptDeck && window.PptDeck.show) window.PptDeck.show(i); }
  function deckName() {
    return (deck.getAttribute("data-ppt-id") || (document.title || "slides").replace(/[·•|].*$/, "").trim() || "slides")
      .replace(/[^\w一-龥-]+/g, "-").replace(/^-+|-+$/g, "") || "slides";
  }
  function pad(n) { return ("0" + n).slice(-2); }
  function raf2() { return new Promise(function (res) { requestAnimationFrame(function () { requestAnimationFrame(res); }); }); }
  function ensureLib(file, glob) {
    if (window[glob]) return Promise.resolve(window[glob]);
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = VENDOR + file; s.onload = function () { window[glob] ? res(window[glob]) : rej(0); }; s.onerror = function () { rej(0); }; document.head.appendChild(s); });
  }
  function download(blobOrUrl, name) {
    var a = document.createElement("a"); a.download = name;
    a.href = (typeof blobOrUrl === "string") ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    document.body.appendChild(a); a.click(); a.remove();
    if (typeof blobOrUrl !== "string") setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function showCover() { var c = document.createElement("div"); c.className = "ppt-export-cover"; c.style.background = getComputedStyle(stage).backgroundColor; c.textContent = "导出中…"; deck.appendChild(c); return c; }
  function hideCover(c) { if (c && c.parentNode) c.parentNode.removeChild(c); }

  // any CSS color → hex (incl. oklch), via 1px canvas
  var cctx = document.createElement("canvas").getContext("2d");
  function toHex(c) { try { cctx.fillStyle = "#000000"; cctx.fillStyle = c; cctx.fillRect(0, 0, 1, 1); var d = cctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]].map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join(""); } catch (e) { return "111111"; } }

  /* ---- snapshot the whole stage (slide + chrome) for slide i -------------- */
  function snapStage(ms) {
    return ms.domToPng(stage, { width: stageW, height: stageH, scale: 2, backgroundColor: getComputedStyle(stage).backgroundColor, style: { transform: "none" } });
  }
  function captureAll(ms) {
    var saved = curIdx(), cover = showCover();
    deck.classList.add("ppt-exporting");
    var urls = [];
    var chain = slides.reduce(function (p, _, i) {
      return p.then(function () { show(i); return raf2(); }).then(function () { return snapStage(ms); }).then(function (u) { urls.push(u); });
    }, Promise.resolve());
    return chain.then(function () { show(saved); deck.classList.remove("ppt-exporting"); hideCover(cover); return urls; })
      .catch(function (e) { show(saved); deck.classList.remove("ppt-exporting"); hideCover(cover); throw e; });
  }
  function captureOne(ms) {
    var cover = showCover(); deck.classList.add("ppt-exporting");
    return raf2().then(function () { return snapStage(ms); })
      .then(function (u) { deck.classList.remove("ppt-exporting"); hideCover(cover); return u; })
      .catch(function (e) { deck.classList.remove("ppt-exporting"); hideCover(cover); throw e; });
  }

  /* ---- PDF (image per page) ---------------------------------------------- */
  function exportPDF() {
    toast("正在导出 PDF…");
    Promise.all([ensureLib("modern-screenshot.js", "modernScreenshot"), ensureLib("jspdf.umd.min.js", "jspdf")]).then(function (l) {
      return captureAll(l[0]).then(function (urls) {
        var jsPDF = l[1].jsPDF, o = stageW >= stageH ? "landscape" : "portrait";
        var pdf = new jsPDF({ orientation: o, unit: "px", format: [stageW, stageH], compress: true });
        urls.forEach(function (u, i) { if (i) pdf.addPage([stageW, stageH], o); pdf.addImage(u, "PNG", 0, 0, stageW, stageH); });
        pdf.save(deckName() + ".pdf"); toast("PDF 已导出（" + urls.length + " 页，全样式含角标）");
      });
    }).catch(function () { toast("PDF 失败：缺库跑 scripts/fetch-export-libs.sh；file:// 请用本地服务器或 render.sh"); });
  }

  /* ---- PPTX 图片版 (full-bleed image per slide) -------------------------- */
  function exportPPTXImage() {
    toast("正在导出 PPTX（图片版）…");
    Promise.all([ensureLib("modern-screenshot.js", "modernScreenshot"), ensureLib("pptxgen.bundle.js", "PptxGenJS")]).then(function (l) {
      return captureAll(l[0]).then(function (urls) {
        var Pptx = l[1], p = new Pptx(), inW = stageW / 96, inH = stageH / 96;
        p.defineLayout({ name: "PPT", width: inW, height: inH }); p.layout = "PPT";
        urls.forEach(function (u) { p.addSlide().addImage({ data: u, x: 0, y: 0, w: inW, h: inH }); });
        return p.writeFile({ fileName: deckName() + ".pptx" }).then(function () { toast("PPTX（图片版）已导出，全样式"); });
      });
    }).catch(function () { toast("PPTX 失败：缺库跑 scripts/fetch-export-libs.sh；file:// 请用本地服务器"); });
  }

  /* ---- PPTX 可编辑（文字版，样式简化） ----------------------------------- */
  var TEXT_SEL = ".eyebrow,.display,.zh-mega,.h1,.h2,.h3,.lead,.body,.quote,.quote__by,.tag,.num," +
    ".data-hero__num,.data-hero__label,.data-hero__src,.bar__val,.cmd,.comment,.ok," +
    ".chrome-top__brand,.chrome-top__sec,.chrome-top__page,.chrome-foot span,.slide__num," +
    "h1,h2,h3,h4,p,li,blockquote,figcaption";
  function leaves(root) {
    var m = Array.prototype.slice.call(root.querySelectorAll(TEXT_SEL));
    return m.filter(function (el) {
      if (el.closest(".notes,.ppt-dock,.ppt-history")) return false;
      if (!el.textContent.trim()) return false;
      var cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") return false;
      return !m.some(function (o) { return o !== el && el.contains(o); });
    });
  }
  function exportPPTXEditable() {
    toast("正在导出可编辑 PPTX（文字版）…");
    ensureLib("pptxgen.bundle.js", "PptxGenJS").then(function (Pptx) {
      var saved = curIdx(), cover = showCover(); deck.classList.add("ppt-exporting");
      var p = new Pptx(), in_ = function (px) { return px / 96; }, inW = in_(stageW), inH = in_(stageH);
      p.defineLayout({ name: "PPT", width: inW, height: inH }); p.layout = "PPT";
      var pageBg = toHex(getComputedStyle(stage).backgroundColor || "#ffffff");
      var chain = slides.reduce(function (pr, _, i) {
        return pr.then(function () { show(i); return raf2(); }).then(function () {
          var slide = p.addSlide(); slide.background = { color: pageBg };
          var srect = stage.getBoundingClientRect(), scale = srect.width / (stage.offsetWidth || stageW) || 1;
          var act = slides[i], abg = getComputedStyle(act).backgroundColor;
          if (abg && abg !== "rgba(0, 0, 0, 0)" && abg !== "transparent")
            slide.addShape(p.ShapeType.rect, { x: 0, y: 0, w: inW, h: inH, fill: { color: toHex(abg) }, line: { type: "none" } });
          leaves(stage).forEach(function (el) {
            var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
            var cs = getComputedStyle(el);
            slide.addText(el.textContent.replace(/\s+/g, " ").trim(), {
              x: in_((r.left - srect.left) / scale), y: in_((r.top - srect.top) / scale),
              w: in_(r.width / scale) + 0.1, h: in_(r.height / scale) + 0.06,
              fontSize: Math.max(6, Math.round(parseFloat(cs.fontSize) / scale * 0.75)),
              color: toHex(cs.color), bold: parseInt(cs.fontWeight, 10) >= 600, italic: cs.fontStyle === "italic",
              align: (cs.textAlign === "center" || cs.textAlign === "right") ? cs.textAlign : "left", valign: "top", margin: 0, wrap: true, autoFit: true
            });
          });
          Array.prototype.forEach.call(act.querySelectorAll("img"), function (img) {
            var r = img.getBoundingClientRect(); if (!r.width) return;
            try { slide.addImage({ path: img.currentSrc || img.src, x: in_((r.left - srect.left) / scale), y: in_((r.top - srect.top) / scale), w: in_(r.width / scale), h: in_(r.height / scale) }); } catch (e) {}
          });
        });
      }, Promise.resolve());
      return chain.then(function () {
        show(saved); deck.classList.remove("ppt-exporting"); hideCover(cover);
        return p.writeFile({ fileName: deckName() + "-editable.pptx" }).then(function () { toast("可编辑 PPTX 已导出（文字版·样式简化，文字可在 PPT 里改）"); });
      }).catch(function (e) { show(saved); deck.classList.remove("ppt-exporting"); hideCover(cover); throw e; });
    }).catch(function () { toast("可编辑 PPTX 失败：缺库跑 scripts/fetch-export-libs.sh"); });
  }

  /* ---- PNG (current / all-zip) ------------------------------------------- */
  function exportPNG(all) {
    toast(all ? "正在导出全部 PNG…" : "正在导出当前页 PNG…");
    ensureLib("modern-screenshot.js", "modernScreenshot").then(function (ms) {
      if (!all) return captureOne(ms).then(function (u) { download(u, deckName() + "-" + pad(curIdx() + 1) + ".png"); toast("当前页 PNG 已导出"); });
      return ensureLib("jszip.min.js", "JSZip").then(function (JSZip) {
        return captureAll(ms).then(function (urls) {
          var zip = new JSZip(), nm = deckName();
          urls.forEach(function (u, i) { zip.file(nm + "-" + pad(i + 1) + ".png", u.split(",")[1], { base64: true }); });
          return zip.generateAsync({ type: "blob" }).then(function (b) { download(b, nm + "-png.zip"); toast("全部 PNG 已打包导出"); });
        });
      });
    }).catch(function () { toast("PNG 失败：缺库跑 scripts/fetch-export-libs.sh；file:// 请用本地服务器或 render.sh"); });
  }

  /* ---- HTML (self-contained) --------------------------------------------- */
  function exportHTML() {
    toast("正在打包完整 HTML…");
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
    var runtimeSrc = (document.querySelector('script[src*="runtime.js"]') || {}).src;
    var b64 = function (buf) { var s = "", b = new Uint8Array(buf), i; for (i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); };
    var embedFonts = function (css, baseUrl) {
      var urls = []; css.replace(/url\(\s*['"]?([^'")]+\.woff2?)['"]?\s*\)/g, function (_, u) { urls.push(u); return _; });
      return Promise.all(urls.map(function (u) {
        return fetch(new URL(u, baseUrl).href).then(function (r) { return r.arrayBuffer(); }).then(function (buf) { return { u: u, d: "data:font/woff2;base64," + b64(buf) }; }).catch(function () { return null; });
      })).then(function (subs) { subs.filter(Boolean).forEach(function (s) { css = css.split(s.u).join(s.d); }); return css; });
    };
    Promise.all(links.map(function (l) { return fetch(l.href).then(function (r) { return r.text(); }).then(function (css) { return embedFonts(css, l.href); }).catch(function () { return null; }); }))
      .then(function (cssTexts) {
        var styles = cssTexts.filter(Boolean).map(function (c) { return "<style>\n" + c + "\n</style>"; }).join("\n");
        return (runtimeSrc ? fetch(runtimeSrc).then(function (r) { return r.text(); }).catch(function () { return ""; }) : Promise.resolve("")).then(function (rt) {
          var clone = document.documentElement.cloneNode(true);
          Array.prototype.forEach.call(clone.querySelectorAll('link[rel="stylesheet"],script,.ppt-dock,.ppt-history,.ppt-toast,.ppt-overview,.ppt-notes-overlay,.ppt-help,.slide__num,.ppt-export-cover'), function (n) { n.remove(); });
          Array.prototype.forEach.call(clone.querySelectorAll("[contenteditable]"), function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("data-ppt-edit"); });
          var d = clone.querySelector(".deck"); if (d) d.classList.remove("is-editing", "ppt-exporting");
          var head = clone.querySelector("head"); if (head) head.insertAdjacentHTML("beforeend", styles);
          var body = clone.querySelector("body"); if (body && rt) body.insertAdjacentHTML("beforeend", "<scr" + "ipt>\n" + rt + "\n</scr" + "ipt>");
          download(new Blob(["<!doctype html>\n" + clone.outerHTML], { type: "text/html;charset=utf-8" }), deckName() + ".html");
          toast("已导出完整 HTML（样式/字体内联，可独立打开）");
        });
      }).catch(function () { toast("HTML 打包失败（file:// 限制）。请用本地服务器打开后再导出"); });
  }

  /* ---- inject "导出" sub-menu into the dock ------------------------------- */
  var slot = document.getElementById("ppt-dock-export-slot");
  if (!slot) return;
  var sub = document.createElement("span"); sub.className = "ppt-sub"; sub.id = "ppt-export-sub"; sub.style.display = "contents";
  sub.innerHTML = '<button type="button" class="ppt-act" id="ppt-export-btn"><span class="ppt-act__ico">⤓</span>导出</button>' +
    '<div class="ppt-sub__list" id="ppt-export-list">' +
      '<button class="ppt-sub__item" data-x="pdf">导出 PDF<small>逐页截图·全样式</small></button>' +
      '<button class="ppt-sub__item" data-x="pptx">PPTX · 图片版<small>每页整图·高保真</small></button>' +
      '<button class="ppt-sub__item" data-x="pptx-edit">PPTX · 可编辑<small>文字版·样式简化</small></button>' +
      '<div class="ppt-sub__sep"></div>' +
      '<button class="ppt-sub__item" data-x="png1">PNG · 当前页</button>' +
      '<button class="ppt-sub__item" data-x="pngall">PNG · 全部 (zip)</button>' +
      '<div class="ppt-sub__sep"></div>' +
      '<button class="ppt-sub__item" data-x="html">导出 HTML<small>完整含样式</small></button>' +
    '</div>';
  slot.appendChild(sub);
  sub.querySelector("#ppt-export-btn").addEventListener("click", function (e) { e.stopPropagation(); sub.classList.toggle("is-open"); });
  document.addEventListener("click", function () { sub.classList.remove("is-open"); });
  sub.querySelector("#ppt-export-list").addEventListener("click", function (e) {
    var it = e.target.closest(".ppt-sub__item"); if (!it) return;
    sub.classList.remove("is-open");
    var x = it.getAttribute("data-x");
    if (x === "pdf") exportPDF();
    else if (x === "pptx") exportPPTXImage();
    else if (x === "pptx-edit") exportPPTXEditable();
    else if (x === "png1") exportPNG(false);
    else if (x === "pngall") exportPNG(true);
    else if (x === "html") exportHTML();
  });

  window.PptExport = { pdf: exportPDF, pptxImage: exportPPTXImage, pptxEditable: exportPPTXEditable, png: exportPNG, html: exportHTML };
})();
