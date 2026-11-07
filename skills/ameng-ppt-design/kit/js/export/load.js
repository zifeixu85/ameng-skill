/* export/load.js — pulls in the exporter on demand and draws the export menu. */
(function () {
  "use strict";
  var files = ["vendor/jszip.min.js", "js/export/ir.js", "js/export/svg.js", "js/export/xml.js", "js/export/charts.js", "js/export/package.js"];
  function load(f) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = window.KIT_BASE + f; s.async = false; s.onload = res; s.onerror = function () { rej(new Error("缺少文件 " + f)); };
      document.head.appendChild(s);
    });
  }
  var ready = window.KIT_BUNDLED ? Promise.resolve() : files.reduce(function (p, f) { return p.then(function () { return load(f); }); }, Promise.resolve());
  function toast(m, ms) { if (window.Dock) Dock.toast(m, ms); }
  function name() { return (Deck.el.getAttribute("data-title") || document.title || "演示").replace(/[\\/:*?"<>|]/g, "-"); }
  function save(blob, file) {
    var a = document.createElement("a"), u = URL.createObjectURL(blob);
    a.href = u; a.download = file; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  function pptx(fonts) {
    if (location.protocol === "file:" && !window.KIT_BUNDLED) { toast("请用本地地址打开后再导出（node scripts/serve.mjs），否则图片读不到", 5000); return; }
    toast("正在生成可编辑 PPTX…", 8000);
    ready.then(function () { return PptxPackage.build({ fonts: fonts }); }).then(function (u8) {
      save(new Blob([u8], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }), name() + ".pptx");
      toast("已导出：文字、形状和图表都能在 PowerPoint 里改");
    }).catch(function (e) { console.error(e); toast("导出失败：" + e.message, 5000); });
  }
  function server(format, ext, fallback) {
    if (!(window.Editor && Editor.isServed())) { fallback(); return; }
    toast("正在导出…", 8000);
    /* the server exports from the file, so the latest theme and edits must land there first */
    Editor.save(true).then(function (ok) {
      if (!ok) throw new Error("最新修改没有保存");
      return fetch("/__deck/export?format=" + format);
    }).then(function (r) { if (!r.ok) throw new Error("服务返回 " + r.status); return r.blob(); })
      .then(function (b) { save(b, name() + ext); toast("已导出"); }).catch(function (e) { toast("导出失败：" + e.message, 5000); });
  }
  function png() {
    var s = document.createElement("script");
    s.src = window.KIT_BASE + "vendor/modern-screenshot.js";
    s.onload = function () {
      Motion.finishAll();
      modernScreenshot.domToBlob(Deck.stage, { width: 1920, height: 1080, scale: 1, style: { transform: "none", left: "0", top: "0" } }).then(function (b) {
        save(b, name() + "-" + String(Deck.index + 1).padStart(2, "0") + ".png"); toast("已导出本页图片");
      }).catch(function () { toast("这个浏览器不支持截图导出，试试命令行 scripts/shots.mjs", 5000); });
    };
    document.head.appendChild(s);
  }
  var menu = document.createElement("div");
  menu.className = "ui menu"; menu.hidden = true;
  menu.innerHTML = '<button data-x="pptx">可编辑 PPTX <small>文字、形状、图表都能改</small></button><button data-x="pptx-design">可编辑 PPTX · 设计字体 <small>需先装字体</small></button><hr><button data-x="pdf">PDF <small>矢量文字</small></button><button data-x="png">本页图片</button><button data-x="html">单文件网页 <small>可直接发送</small></button>';
  document.body.appendChild(menu);
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-x]"); if (!b) return;
    menu.hidden = true;
    var x = b.getAttribute("data-x");
    if (x === "pptx") pptx("safe");
    else if (x === "pptx-design") pptx("design");
    else if (x === "pdf") server("pdf", ".pdf", function () { window.print(); });
    else if (x === "png") png();
    else if (x === "html") server("html", ".html", function () { toast("单文件需要本地服务：node scripts/bundle.mjs <deck>", 5000); });
  });
  document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".menu,.dock")) menu.hidden = true; });
  window.Exporter = {
    ready: ready,
    menu: function (btn) {
      if (!menu.hidden) { menu.hidden = true; return; }
      if (window.Dock) Dock.close();
      var r = btn.getBoundingClientRect();
      menu.hidden = false;
      menu.style.left = Math.max(8, Math.min(innerWidth - menu.offsetWidth - 8, r.left + r.width / 2 - menu.offsetWidth / 2)) + "px";
      menu.style.bottom = (innerHeight - r.top + 8) + "px"; menu.style.top = "auto";
    }
  };
})();
