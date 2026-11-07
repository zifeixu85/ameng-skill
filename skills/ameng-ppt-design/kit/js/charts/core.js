/* charts/core.js — one JSON spec drives two outputs: an animated SVG in the browser
   and a native PowerPoint chart in the export. Marks use theme tokens through
   var(), so a theme switch needs no data change.

   <figure class="chart" data-type="hbar">
     <script type="application/json">{"categories":[…],"series":[{"name":"…","values":[…]}]}</script>
   </figure>
*/
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var types = {};
  var canvas = document.createElement("canvas").getContext("2d");
  var pixel = null;
  function lum(color) {
    var cv = pixel || (pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true }));
    cv.fillStyle = "#000"; cv.fillStyle = color; cv.fillRect(0, 0, 1, 1);
    var d = cv.getImageData(0, 0, 1, 1).data;
    function lin(c) { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
    return .2126 * lin(d[0]) + .7152 * lin(d[1]) + .0722 * lin(d[2]);
  }

  function h(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function textWidth(str, size, weight, family) {
    canvas.font = (weight || 400) + " " + size + "px " + (family || "'Noto Sans SC', sans-serif");
    return canvas.measureText(String(str)).width;
  }
  function linear(d0, d1, r0, r1) {
    var k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
    return function (v) { return r0 + (v - d0) * k; };
  }
  function niceStep(span, count) {
    var raw = span / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  function ticks(min, max, count) {
    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
    if (max <= min) max = min + (Math.abs(min) || 1);
    var step = niceStep(max - min, count || 4), lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (var v = lo; v <= hi + step * .001; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function format(v, spec) {
    if (v == null || isNaN(v)) return "";
    var s = spec || {}, abs = Math.abs(v), out;
    if (s.compact === "zh" && abs >= 1e8) out = trim(v / 1e8) + "亿";
    else if (s.compact === "zh" && abs >= 1e4) out = trim(v / 1e4) + "万";
    else if (s.compact && abs >= 1e6) out = trim(v / 1e6) + "M";
    else if (s.compact && abs >= 1e3) out = trim(v / 1e3) + "K";
    else out = (s.decimals != null ? v.toFixed(s.decimals) : String(+v.toFixed(2))).replace(/\B(?=(\d{3})+(?!\d))(?=[^.]*$)/g, ",");
    return (s.prefix || "") + out + (s.unit || "");
  }
  function trim(n) { return String(+n.toFixed(1)); }

  /* wrap a CJK/Latin label into at most `max` lines of width w */
  function wrap(str, size, w, max) {
    var lines = [], cur = "";
    String(str).split("").forEach(function (ch) {
      if (textWidth(cur + ch, size) > w && cur) { lines.push(cur); cur = ch; } else cur += ch;
    });
    if (cur) lines.push(cur);
    if (max && lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = lines[max - 1].slice(0, -1) + "…"; }
    return lines;
  }

  function readSpec(fig) {
    var tag = fig.querySelector(':scope > script[type="application/json"]');
    var spec = {};
    try { spec = tag ? JSON.parse(tag.textContent) : JSON.parse(fig.getAttribute("data-spec") || "{}"); }
    catch (e) { console.warn("[chart] bad JSON in", fig, e); }
    spec.type = spec.type || fig.getAttribute("data-type") || "bar";
    if (spec.categories && spec.values && !spec.series) spec.series = [{ name: spec.name || "数值", values: spec.values }];
    if (spec.points) {  /* groups may be names; colors and native series need an index */
      var seen = [];
      spec.points.forEach(function (p) { var g = p.group == null ? 0 : p.group; if (seen.indexOf(g) < 0) seen.push(g); p.group = seen.indexOf(g); });
    }
    return spec;
  }

  function Ctx(fig, spec, svg, W, H) {
    this.fig = fig; this.spec = spec; this.svg = svg; this.W = W; this.H = H; this.anims = []; this.loops = [];
    var cs = getComputedStyle(fig);
    this.seg = (cs.getPropertyValue("--chart-seg") || "").trim() === "1";
    this.round = parseFloat(cs.getPropertyValue("--chart-round")) || 0;
    this.fs = spec.fontSize || 26;
    this.num = cs.getPropertyValue("--f-num").trim() || "inherit";
    this.text = cs.getPropertyValue("--f-text").trim() || "inherit";
  }
  Ctx.prototype = {
    color: function (i) { return "var(--c" + ((i % 6) + 1) + ")"; },
    mute: "var(--chart-mute)",
    label: function (parent, x, y, str, o) {
      o = o || {};
      return h("text", {
        x: x, y: y, "text-anchor": o.anchor || "start", "dominant-baseline": o.base || "alphabetic",
        style: "fill:" + (o.fill || "var(--ink-2)") + ";font-size:" + (o.size || this.fs) + "px;font-weight:" + (o.weight || 400) +
          ";font-family:" + (o.num ? this.num : this.text) + ";font-variant-numeric:tabular-nums"
      }, parent, str);
    },
    legend: function (names, colors) {
      if (!names || names.length < 2 || this.spec.legend === false) return 0;
      var g = h("g", { "data-part": "legend" }, this.svg), x = 0, y = 18;
      names.forEach(function (n, i) {
        h("rect", { x: x, y: y - 14, width: 20, height: 20, rx: 4, style: "fill:" + colors[i] }, g);
        var t = this.label(g, x + 30, y + 3, n, { size: this.fs });
        x += 30 + textWidth(n, this.fs) + 40;
        void t;
      }, this);
      this.anim(g, "fade", { delay: 500 });
      return 52;
    },
    grid: function (parent, x0, x1, ys, fmt) {
      var g = h("g", { "data-part": "grid" }, parent);
      ys.forEach(function (t) {
        h("line", { x1: x0, x2: x1, y1: t.y, y2: t.y, style: "stroke:var(--line);stroke-width:1.5" }, g);
        if (fmt) this.label(g, x0 - 14, t.y + 8, fmt(t.v), { anchor: "end", size: this.fs - 2, fill: "var(--ink-3)" });
      }, this);
      return g;
    },
    /* a data-end rounded rect: square on the baseline, rounded at the value end */
    bar: function (parent, x, y, w, ht, fill, dir) {
      var r = Math.min(this.round, w / 2, ht / 2), d;
      if (dir === "right") d = "M" + x + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + ht - r) + "Q" + (x + w) + " " + (y + ht) + " " + (x + w - r) + " " + (y + ht) + "H" + x + "Z";
      else d = "M" + x + " " + (y + ht) + "V" + (y + r) + "Q" + x + " " + y + " " + (x + r) + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + ht) + "Z";
      return h("path", { d: d, style: "fill:" + fill }, parent);
    },
    anim: function (el, kind, o) { this.anims.push({ el: el, kind: kind, o: o || {} }); return el; },
    tip: function (el, html) {
      var fig = this.fig;
      el.style.cursor = "default";
      el.addEventListener("pointerenter", function () { showTip(fig, html); });
      el.addEventListener("pointermove", function (e) { moveTip(fig, e); });
      el.addEventListener("pointerleave", function () { hideTip(fig); });
    }
  };

  function tipEl(fig) {
    var t = fig.querySelector(":scope > .chart-tip");
    if (!t) { t = document.createElement("div"); t.className = "chart-tip"; t.setAttribute("data-rt", ""); fig.appendChild(t); }
    return t;
  }
  function showTip(fig, html) { var t = tipEl(fig); t.innerHTML = html; t.classList.add("is-on"); }
  function hideTip(fig) { var t = fig.querySelector(":scope > .chart-tip"); if (t) t.classList.remove("is-on"); }
  function moveTip(fig, e) {
    var t = tipEl(fig), r = fig.getBoundingClientRect(), k = r.width / (fig.offsetWidth || 1) || 1;
    var x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, flip = x > fig.offsetWidth * .68;
    t.style.transform = "translate(" + (flip ? x - t.offsetWidth - 22 : x + 22) + "px," + Math.max(0, y - t.offsetHeight - 14) + "px)";
  }

  function render(fig) {
    Array.prototype.forEach.call(fig.querySelectorAll(":scope > svg,:scope > .chart-tip"), function (n) { n.remove(); });
    var W = fig.offsetWidth, H = fig.offsetHeight;
    if (!W || !H) return;
    var spec = readSpec(fig), fn = types[spec.type];
    if (!fn) { console.warn("[chart] unknown type", spec.type); return; }
    var svg = h("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "data-rt": "", "aria-label": fig.getAttribute("aria-label") || spec.title || "图表" });
    fig.appendChild(svg);
    var ctx = new Ctx(fig, spec, svg, W, H);
    try { fn(ctx); }
    catch (e) {
      console.warn("[chart] 无法绘制", spec.type, e);
      svg.textContent = "";
      ctx.anims = [];
      ctx.label(svg, W / 2, H / 2, "图表数据不完整", { anchor: "middle", fill: "var(--ink-3)" });
    }
    fig.__ctx = ctx;
  }

  var EASE = "cubic-bezier(.16,1,.3,1)";
  function run(a, base) {
    var el = a.el, o = a.o, delay = base + (o.delay || 0), dur = o.dur || 900, opt = { duration: dur, delay: delay, easing: o.easing || EASE, fill: "backwards" };
    switch (a.kind) {
      case "growY": el.style.transformBox = "fill-box"; el.style.transformOrigin = "50% 100%"; return el.animate([{ transform: "scaleY(0)" }, { transform: "none" }], opt);
      case "growX": el.style.transformBox = "fill-box"; el.style.transformOrigin = "0% 50%"; return el.animate([{ transform: "scaleX(0)" }, { transform: "none" }], opt);
      case "pop": el.style.transformBox = "fill-box"; el.style.transformOrigin = "50% 50%"; return el.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "none", opacity: 1 }], opt);
      case "draw":
        var len = el.getTotalLength ? el.getTotalLength() : 1000;
        el.style.strokeDasharray = len + " " + len;
        var d = el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], Object.assign({}, opt, { dur: undefined }));
        d.finished.then(function () { el.style.strokeDasharray = ""; }, function () { el.style.strokeDasharray = ""; });
        return d;
      case "wipe": return el.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -2% 0 0)" }], opt);
      case "up": return el.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], opt);
      default: return el.animate([{ opacity: 0 }, { opacity: 1 }], opt);
    }
  }

  window.Charts = {
    h: h, linear: linear, ticks: ticks, format: format, wrap: wrap, textWidth: textWidth,
    register: function (name, fn) { types[name] = fn; },
    types: types,
    readSpec: readSpec,
    render: render,
    /* Label color for a mark whose fill is only known once the theme resolves it. The
       on-fill color wins wherever it reads at 3:1; ink takes the pale end of a ramp. */
    textOn: function (mark, guess) {
      try {
        var cs = getComputedStyle(mark), bg = lum(cs.fill), on = lum(cs.getPropertyValue("--on-fill").trim());
        var ratio = (Math.max(bg, on) + .05) / (Math.min(bg, on) + .05);
        return ratio >= 3 ? "var(--on-fill)" : "var(--ink)";
      } catch (e) { return guess ? "var(--on-fill)" : "var(--ink)"; }
    },
    renderAll: function (root) { Array.prototype.forEach.call(root.querySelectorAll(".chart"), render); },
    loops: function (fig) { return fig.__ctx ? fig.__ctx.loops : []; },
    play: function (fig, base) {
      var ctx = fig.__ctx; if (!ctx) return;
      ctx.anims.forEach(function (a) { try { run(a, base || 0); } catch (e) {} });
    }
  };
})();
