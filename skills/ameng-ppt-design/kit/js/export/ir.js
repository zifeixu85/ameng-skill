/* export/ir.js — reads the laid-out DOM into a flat, z-ordered drawing list.
   Everything is in stage px. Text stays text, boxes stay shapes, data stays data;
   only canvases and tiled textures become pictures. */
(function () {
  "use strict";
  var GROUP_SEL = ".kpi,.mx,.tier,.ring__node,.ring__core,.layer,.step,.tl,.point-col,.versus__side,.window,.caption-box,.dg,.ring,.seal";
  var SKIP_SEL = ".notes,script,style,.tag-sample-hide,[data-no-export],.chart-tip,.progress";
  var cctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

  /* any CSS color (oklab, color-mix, color(srgb …)) → [r,g,b,a] */
  function rgba(css) {
    if (!css || css === "transparent" || css === "none") return null;
    cctx.clearRect(0, 0, 1, 1);
    cctx.fillStyle = "#000"; cctx.fillStyle = css;
    cctx.fillRect(0, 0, 1, 1);
    var d = cctx.getImageData(0, 0, 1, 1).data;
    return d[3] === 0 ? null : [d[0], d[1], d[2], d[3] / 255];
  }
  function hex(c) { return c.slice(0, 3).map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join("").toUpperCase(); }
  function color(css, alpha) {
    var c = rgba(css); if (!c) return null;
    var a = c[3] * (alpha == null ? 1 : alpha);
    return a <= 0.004 ? null : { hex: hex(c), a: +a.toFixed(3) };
  }

  /* ---- CSS gradient parsing -------------------------------------------------- */
  function splitTop(s) {
    var out = [], depth = 0, cur = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === "(") depth++; else if (ch === ")") depth--;
      if (ch === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function parseGradient(img) {
    var m = img.match(/^(linear|radial)-gradient\((.*)\)$/);
    if (!m) return null;
    var parts = splitTop(m[2]), kind = m[1], angle = 180, shape = null;
    if (kind === "linear" && /deg$|^to /.test(parts[0])) {
      var a = parts.shift();
      if (/deg$/.test(a)) angle = parseFloat(a);
      else angle = { "to right": 90, "to left": 270, "to top": 0, "to bottom": 180 }[a] || 180;
    }
    if (kind === "radial" && !/^(rgb|oklab|oklch|color|#|hsl|transparent)/.test(parts[0])) shape = parts.shift();
    var stops = [];
    parts.forEach(function (p) {
      var pm = p.match(/^(.*\))\s*(.*)$/) || p.match(/^(\S+)\s*(.*)$/);
      var col = pm ? pm[1] : p, pos = (pm ? pm[2] : "").trim().split(/\s+/).filter(Boolean);
      if (!pos.length) stops.push({ c: col, p: null });
      pos.forEach(function (q) { stops.push({ c: col, p: q.indexOf("%") >= 0 ? parseFloat(q) / 100 : null, px: /px$/.test(q) ? parseFloat(q) : null }); });
    });
    stops.forEach(function (s, i) { if (s.p == null && s.px == null) s.p = stops.length > 1 ? i / (stops.length - 1) : 0; });
    return { kind: kind, angle: angle, shape: shape, stops: stops };
  }
  function firstGradient(cs) {
    var img = cs.backgroundImage;
    if (!img || img === "none") return null;
    var layers = splitTop(img);
    return layers.length === 1 ? parseGradient(layers[0]) : null;
  }
  /* transparent → color → color → transparent with hard stops is a highlighter band */
  function hardBand(g) {
    if (!g || g.kind !== "linear" || g.stops.length < 3) return null;
    var solid = g.stops.filter(function (s) { var c = rgba(s.c); return c && c[3] > .5; });
    if (solid.length < 2) return null;
    return { from: solid[0].p, to: solid[solid.length - 1].p, color: solid[0].c };
  }
  function gradientFill(g, alpha) {
    /* DrawingML's circular path reaches 100% at the box corners, CSS closest-side at the edges */
    var k = g.kind === "radial" ? Math.SQRT1_2 : 1;
    var usable = g.stops.filter(function (s) { return s.p != null; });
    if (usable.length < 2) {  /* px-positioned stops: fall back to the first real colour */
      var first = g.stops.map(function (s) { return color(s.c, alpha); }).filter(Boolean)[0];
      return first ? { type: "solid", color: first } : null;
    }
    return {
      type: "grad", radial: g.kind === "radial", angle: g.angle, tail: k < 1,
      stops: g.stops.filter(function (s) { return s.p != null; }).map(function (s, i, all) {
        var c = rgba(s.c), near = c || rgba((all[i - 1] || all[i + 1] || {}).c) || [0, 0, 0, 0];
        return { p: Math.max(0, Math.min(1, s.p)) * k, hex: hex(near), a: c ? +(c[3] * alpha).toFixed(3) : 0 };
      })
    };
  }

  function num(v, fallback) { var n = parseFloat(v); return isNaN(n) ? fallback : n; }

  /* ---- geometry ------------------------------------------------------------ */
  function Ctx(stage) {
    var r = stage.getBoundingClientRect();
    this.ox = r.left; this.oy = r.top; this.k = r.width / 1920 || 1;
  }
  Ctx.prototype.box = function (r) { return { x: (r.left - this.ox) / this.k, y: (r.top - this.oy) / this.k, w: r.width / this.k, h: r.height / this.k }; };
  Ctx.prototype.pt = function (x, y) { return [(x - this.ox) / this.k, (y - this.oy) / this.k]; };

  function radii(cs, w, h) {
    function one(v) { var p = v.split(" ")[0]; return p.indexOf("%") >= 0 ? parseFloat(p) / 100 * Math.min(w, h) : parseFloat(p) || 0; }
    var r = [one(cs.borderTopLeftRadius), one(cs.borderTopRightRadius), one(cs.borderBottomRightRadius), one(cs.borderBottomLeftRadius)];
    var pctQuarter = /100%/.test(cs.borderTopLeftRadius) || /100%/.test(cs.borderTopRightRadius) || /100%/.test(cs.borderBottomRightRadius) || /100%/.test(cs.borderBottomLeftRadius);
    if (!pctQuarter) {
      var f = Math.min(1, w / ((r[0] + r[1]) || 1), w / ((r[3] + r[2]) || 1), h / ((r[0] + r[3]) || 1), h / ((r[1] + r[2]) || 1));
      r = r.map(function (v) { return v * f; });
    }
    return r;
  }
  function geomFor(r, w, h) {
    var same = r[0] === r[1] && r[1] === r[2] && r[2] === r[3];
    if (same && r[0] <= .5) return { type: "rect" };
    if (same && r[0] >= Math.min(w, h) / 2 - .5 && Math.abs(w - h) < 1.5) return { type: "ellipse" };
    if (same) return { type: "round", adj: Math.min(50000, Math.round(r[0] / Math.min(w, h) * 100000)) };
    return { type: "corners", r: r };
  }
  function rotationOf(cs) {
    var m = cs.transform; if (!m || m === "none") return 0;
    var v = m.match(/matrix\(([^)]+)\)/); if (!v) return 0;
    var p = v[1].split(",").map(parseFloat);
    return Math.atan2(p[1], p[0]) * 180 / Math.PI;
  }
  function unrotated(b, el, deg) {
    if (!deg) return b;
    var w = el.offsetWidth, h = el.offsetHeight, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
  }
  function shadowList(cs) {
    if (!cs.boxShadow || cs.boxShadow === "none") return [];
    return splitTop(cs.boxShadow).map(function (s) {
      var c = (s.match(/^(rgba?\([^)]*\)|color\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|#\w+)/) || [])[1] || "";
      var rest = s.replace(c, "").trim(), inset = /inset/.test(rest), n = (rest.replace("inset", "").match(/-?[\d.]+px/g) || []).map(parseFloat);
      return { color: c, inset: inset, x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, spread: n[3] || 0 };
    });
  }

  /* ---- text ---------------------------------------------------------------- */
  function inlineOnly(el) {
    var has = false;
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { if (n.nodeValue.trim()) has = true; continue; }
      if (n.nodeType !== 1) continue;
      if (n.matches(SKIP_SEL)) continue;
      if (n.tagName === "BR") continue;
      var d = getComputedStyle(n).display;
      if (d === "none") continue;
      if (!/^inline($| )/.test(d) && d !== "contents") return false;
      if (n.querySelector && n.querySelector("svg,img,canvas")) return false;
      if (n.textContent.trim()) has = true;
    }
    return has;
  }
  function baselineOf(el) {
    var p = document.createElement("span"), d = getComputedStyle(el).display, wrap = null;
    p.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0;border:0";
    if (/flex|grid/.test(d)) {
      wrap = document.createElement("span");
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap);
      wrap.insertBefore(p, wrap.firstChild);
    } else el.insertBefore(p, el.firstChild);
    var y = p.getBoundingClientRect().bottom;
    p.remove();
    if (wrap) { while (wrap.firstChild) el.insertBefore(wrap.firstChild, wrap); wrap.remove(); }
    return y;
  }
  function runStyle(el, alpha) {
    var cs = getComputedStyle(el), run = {
      family: cs.fontFamily, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400,
      italic: cs.fontStyle === "italic", spacing: parseFloat(cs.letterSpacing) || 0, underline: /underline/.test(cs.textDecorationLine)
    };
    var clip = cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text";
    var stroke = parseFloat(cs.webkitTextStrokeWidth) || 0;
    var fill = color(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color ? cs.webkitTextFillColor : cs.color, alpha);
    if (clip) {
      var g = firstGradient(cs);
      if (g) { var gf = gradientFill(g, alpha); if (gf && gf.type === "grad") run.grad = gf; else if (gf) run.color = gf.color; }
    } else if (stroke && !fill) {
      run.outline = { w: stroke, color: color(cs.webkitTextStrokeColor, alpha) };
    }
    run.color = run.color || fill;
    /* inline highlighters stay on the run, so they follow the text when fonts differ */
    var band = hardBand(firstGradient(cs)), bgc = color(cs.backgroundColor, alpha);
    if (band) { if (band.from > .4) run.under = color(band.color, alpha); else run.mark = color(band.color, alpha); }
    else if (bgc && cs.display === "inline") run.mark = bgc;
    if (cs.textEmphasisStyle && cs.textEmphasisStyle !== "none") run.color = color(cs.textEmphasisColor, alpha) || run.color;
    return run;
  }
  /* collect runs with explicit line breaks exactly where the browser broke the line */
  function textRuns(el, alpha, keepBreaks) {
    if (/^pre/.test(getComputedStyle(el).whiteSpace)) return preRuns(el, alpha);
    var runs = [], r = document.createRange(), last = null, lines = 1;
    function push(text, style) {
      if (!text) return;
      var p = runs[runs.length - 1];
      if (p && !p.br && p.sig === style.sig) p.text += text; else runs.push(Object.assign({ text: text }, style));
    }
    (function visit(node, style) {
      for (var n = node.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          var s = n.nodeValue, buf = "";
          for (var i = 0; i < s.length; i++) {
            var ch = s[i];
            if (/[\n\r\t]/.test(ch)) ch = " ";
            r.setStart(n, i); r.setEnd(n, i + 1);
            var rc = r.getClientRects()[0];
            if (rc && rc.width > 0 && !/\s/.test(ch)) {
              var mid = (rc.top + rc.bottom) / 2;
              if (last && (mid < last.top || mid > last.bottom)) {
                lines++;
                if (keepBreaks) { push(buf.replace(/\s+$/, ""), style); buf = ""; runs.push({ br: true }); }
              }
              last = rc;
            }
            if (ch === " " && (!buf || /\s$/.test(buf)) ) { if (!buf) continue; else continue; }
            buf += ch;
          }
          push(buf, style);
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") { if (!keepBreaks) runs.push({ br: true }); continue; }
          if (n.matches(SKIP_SEL)) continue;
          var st = runStyle(n, alpha); st.sig = JSON.stringify(st);
          if ((parseFloat(getComputedStyle(n).marginLeft) || 0) > 1) push(" ", st);
          visit(n, st);
        }
      }
    })(el, (function () { var st = runStyle(el, alpha); st.sig = JSON.stringify(st); return st; })());
    runs.forEach(function (x) { delete x.sig; });
    return { runs: runs, lines: lines };
  }
  function preRuns(el, alpha) {
    var runs = [], lines = 1, base = runStyle(el, alpha);
    (function visit(node, style) {
      for (var n = node.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1) { visit(n, runStyle(n, alpha)); continue; }
        if (n.nodeType !== 3) continue;
        n.nodeValue.split("\n").forEach(function (part, i) {
          if (i) { runs.push({ br: true }); lines++; }
          if (part) runs.push(Object.assign({ text: part }, style));
        });
      }
    })(el, base);
    return { runs: runs, lines: lines };
  }
  function textBounds(el) {
    var r = document.createRange(); r.selectNodeContents(el);
    var rects = Array.prototype.filter.call(r.getClientRects(), function (q) { return q.width > 0 && q.height > 0; });
    if (!rects.length) return null;
    return {
      left: Math.min.apply(null, rects.map(function (q) { return q.left; })), top: Math.min.apply(null, rects.map(function (q) { return q.top; })),
      right: Math.max.apply(null, rects.map(function (q) { return q.right; })), bottom: Math.max.apply(null, rects.map(function (q) { return q.bottom; })),
      width: 0, height: 0
    };
  }
  function textItem(el, cs, ctx, alpha) {
    var tb = textBounds(el); if (!tb) return null;
    var title = el.matches(".title,.hero,.sec-num,.kpi__value,.tier .price") , probe = textRuns(el, alpha, true);
    var keep = title || probe.lines <= 3 || /^pre/.test(cs.whiteSpace);
    var data = keep ? probe : textRuns(el, alpha, false);
    var size = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || size * 1.3;
    if (!/px/.test(cs.lineHeight)) lh = size * 1.3;
    var pad = { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.borderLeftWidth) || 0 };
    var eb = ctx.box(el.getBoundingClientRect()), base = (baselineOf(el) - ctx.oy) / ctx.k;
    var deg = rotationOf(cs);
    var align = cs.textAlign === "center" ? "ctr" : (cs.textAlign === "right" || cs.textAlign === "end") ? "r" : "l";
    var x, w, b = ctx.box({ left: tb.left, top: tb.top, width: tb.right - tb.left, height: tb.bottom - tb.top });
    if (keep) { x = align === "l" ? b.x : eb.x + pad.l + pad.b; w = align === "l" ? b.w : eb.w - pad.l - pad.r - 2 * pad.b; }
    else { x = eb.x + pad.l + pad.b; w = eb.w - pad.l - pad.r - 2 * pad.b; }
    var item = {
      kind: "text", x: x, y: 0, w: w, lines: data.lines, lineHeight: lh, baseline: base, size: size,
      runs: data.runs, align: align, wrap: !keep, name: textName(el)
    };
    if (deg) { var u = unrotated(eb, el, deg); item.x = u.x; item.w = u.w; item.rot = deg; item.rotBox = u; }
    if (el.matches(".title") && !ctx.titleUsed) { item.ph = "title"; ctx.titleUsed = true; }
    if (el.classList.contains("folio")) item.folio = true;
    return item;
  }
  function textName(el) {
    var cls = (el.getAttribute("class") || el.tagName.toLowerCase()).split(/\s+/)[0];
    var t = el.textContent.trim().replace(/\s+/g, " ");
    return cls + " · " + Array.from(t).slice(0, 18).join("");
  }

  /* ---- boxes ---------------------------------------------------------------- */
  function paintBox(el, cs, ctx, alpha, out, clip) {
    var raw = ctx.box(el.getBoundingClientRect()), deg = rotationOf(cs), b = unrotated(raw, el, deg);
    if (b.w < .5 || b.h < .5) return;
    var r = radii(cs, b.w, b.h), g = firstGradient(cs), bg = color(cs.backgroundColor, alpha), fill = null;
    if (g) { var band = hardBand(g); if (band) { b = { x: b.x, y: b.y + b.h * band.from, w: b.w, h: b.h * (band.to - band.from) }; fill = { type: "solid", color: color(band.color, alpha) }; } else fill = gradientFill(g, alpha); }
    else if (bg) fill = { type: "solid", color: bg };
    if (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") fill = null;
    if (clip) r = clipCorners(b, r, clip);
    var line = null, sides = ["Top", "Right", "Bottom", "Left"].map(function (s) {
      return { w: cs["border" + s + "Style"] === "none" ? 0 : parseFloat(cs["border" + s + "Width"]) || 0, c: cs["border" + s + "Color"] };
    });
    var uniform = sides.every(function (s) { return s.w === sides[0].w && s.c === sides[0].c; }) && sides[0].w > 0;
    if (uniform) { var lc = color(sides[0].c, alpha); if (lc) line = { w: sides[0].w, color: lc, inset: true }; }
    var drop = null;
    shadowList(cs).forEach(function (s) {
      if (!s.blur && s.spread) { var c = color(s.color, alpha); if (c && !line) line = { w: s.spread, color: c, inset: s.inset, outset: !s.inset }; }
      else if (!s.inset && s.blur && !drop) drop = { x: s.x, y: s.y, blur: s.blur, color: color(s.color, alpha) };
      else if (!s.inset && !s.blur && (s.x || s.y) && !drop) drop = { x: s.x, y: s.y, blur: 0, color: color(s.color, alpha) };
    });
    if (fill || line || drop) {
      out.push({ kind: "shape", x: b.x, y: b.y, w: b.w, h: b.h, rot: deg || 0, geom: geomFor(r, b.w, b.h), fill: fill, line: line, shadow: drop, name: boxName(el) });
    }
    if (!uniform) sides.forEach(function (s, i) {
      if (!s.w) return;
      var c = color(s.c, alpha); if (!c) return;
      var e = [{ x: b.x, y: b.y, w: b.w, h: s.w }, { x: b.x + b.w - s.w, y: b.y, w: s.w, h: b.h }, { x: b.x, y: b.y + b.h - s.w, w: b.w, h: s.w }, { x: b.x, y: b.y, w: s.w, h: b.h }][i];
      out.push({ kind: "shape", x: e.x, y: e.y, w: e.w, h: e.h, geom: { type: "rect" }, fill: { type: "solid", color: c }, name: "分隔线" });
    });
  }
  function boxName(el) {
    var cls = (el.getAttribute("class") || "").split(/\s+/)[0] || el.tagName.toLowerCase();
    var m = el.getAttribute("data-morph");
    return m ? "!!" + m : cls;
  }
  function clipCorners(b, r, clip) {
    var c = clip.box, t = 1.5, out = r.slice();
    if (Math.abs(b.x - c.x) < t && Math.abs(b.y - c.y) < t) out[0] = Math.max(out[0], clip.r[0]);
    if (Math.abs(b.x + b.w - c.x - c.w) < t && Math.abs(b.y - c.y) < t) out[1] = Math.max(out[1], clip.r[1]);
    if (Math.abs(b.x + b.w - c.x - c.w) < t && Math.abs(b.y + b.h - c.y - c.h) < t) out[2] = Math.max(out[2], clip.r[2]);
    if (Math.abs(b.x - c.x) < t && Math.abs(b.y + b.h - c.y - c.h) < t) out[3] = Math.max(out[3], clip.r[3]);
    return out;
  }
  /* decorative ::before bars and dots */
  function pseudo(el, which, ctx, alpha, out) {
    var ps = getComputedStyle(el, which);
    if (!ps || ps.content === "none" || ps.content === "normal" || ps.position !== "absolute") return;
    var w = parseFloat(ps.width), h = parseFloat(ps.height);
    if (!w || !h) return;
    var b = ctx.box(el.getBoundingClientRect()), a = alpha * (parseFloat(ps.opacity) || 1);
    var x = b.x + (parseFloat(ps.left) || 0), y = b.y + (parseFloat(ps.top) || 0);
    var c = color(ps.backgroundColor, a); if (!c) return;
    out.push({ kind: "shape", x: x, y: y, w: w, h: h, geom: geomFor(radii(ps, w, h), w, h), fill: { type: "solid", color: c }, name: "标记" });
  }

  /* ---- pictures ------------------------------------------------------------- */
  function imageItem(el, cs, ctx, alpha, out, clip) {
    var b = ctx.box(el.getBoundingClientRect());
    var src = null, nat = null;
    if (el.tagName === "CANVAS") {
      try { src = el.toDataURL("image/jpeg", .92); nat = { w: el.width, h: el.height }; } catch (e) { return; }
    } else if (el.tagName === "VIDEO") {
      /* a video exports as the frame on screen */
      try {
        var f = document.createElement("canvas"); f.width = el.videoWidth; f.height = el.videoHeight;
        f.getContext("2d").drawImage(el, 0, 0);
        src = f.toDataURL("image/jpeg", .9); nat = { w: f.width, h: f.height };
      } catch (e) { return; }
    } else {
      src = el.currentSrc || el.src; nat = { w: el.naturalWidth, h: el.naturalHeight };
    }
    if (!src || !nat.w) return;
    var crop = null, fit = cs.objectFit;
    if (fit === "cover") {
      var s = Math.max(b.w / nat.w, b.h / nat.h), vw = b.w / s / nat.w, vh = b.h / s / nat.h;
      var pos = (cs.objectPosition || "50% 50%").split(" ").map(parseFloat), px = (pos[0] || 50) / 100, py = (pos[1] == null ? 50 : pos[1]) / 100;
      crop = { l: (1 - vw) * px, r: (1 - vw) * (1 - px), t: (1 - vh) * py, b: (1 - vh) * (1 - py) };
    }
    var r = radii(cs, b.w, b.h); if (clip) r = clipCorners(b, r, clip);
    out.push({ kind: "image", x: b.x, y: b.y, w: b.w, h: b.h, src: src, crop: crop, geom: geomFor(r, b.w, b.h), alt: el.getAttribute("alt") || "", alpha: alpha, name: el.tagName === "CANVAS" ? "背景动效（定格）" : el.tagName === "VIDEO" ? "视频（定格）" : "图片" });
  }
  /* tiled radial dots (spec theme) → one transparent picture */
  function tilePicture(el, cs, ctx, out) {
    var img = cs.backgroundImage; if (!/radial-gradient/.test(img) || !/px/.test(cs.backgroundSize)) return false;
    var g = parseGradient(img); if (!g) return false;
    var size = parseFloat(cs.backgroundSize), pos = (cs.backgroundPosition || "0 0").split(" ").map(parseFloat);
    var c = document.createElement("canvas"); c.width = 1920; c.height = 1080;
    var x = c.getContext("2d"), col = g.stops[0].c, rad = g.stops[0].px || 1.6;
    x.fillStyle = col;
    for (var yy = (pos[1] || 0) + size / 2 - size; yy < 1080; yy += size) for (var xx = (pos[0] || 0) + size / 2 - size; xx < 1920; xx += size) { x.beginPath(); x.arc(xx, yy, rad, 0, 7); x.fill(); }
    out.push({ kind: "image", x: 0, y: 0, w: 1920, h: 1080, src: c.toDataURL("image/png"), geom: { type: "rect" }, alpha: 1, name: "背景纹理" });
    return true;
  }

  /* ---- table ---------------------------------------------------------------- */
  function tableItem(el, ctx, alpha) {
    var b = ctx.box(el.getBoundingClientRect()), rows = [], taken = {}, width = 0;
    Array.prototype.forEach.call(el.rows, function (tr, ri) {
      var cells = [], col = 0;
      Array.prototype.forEach.call(tr.cells, function (td) {
        while (taken[ri + ":" + col]) { cells.push({ vMerge: true }); col++; }
        var cs = getComputedStyle(td), t = textRuns(td, alpha, false), bb = parseFloat(cs.borderBottomWidth) || 0;
        var span = td.colSpan || 1, down = td.rowSpan || 1;
        cells.push({
          runs: t.runs.filter(function (r) { return !r.br; }), size: parseFloat(cs.fontSize), family: cs.fontFamily, weight: parseInt(cs.fontWeight, 10) || 400,
          align: cs.textAlign === "right" ? "r" : cs.textAlign === "center" ? "ctr" : "l",
          valign: cs.verticalAlign === "bottom" ? "b" : cs.verticalAlign === "top" ? "t" : "ctr", fill: color(cs.backgroundColor, alpha),
          border: bb ? { w: bb, color: color(cs.borderBottomColor, alpha) } : null,
          padL: parseFloat(cs.paddingLeft) || 0, padR: parseFloat(cs.paddingRight) || 0, span: span, down: down
        });
        for (var k = 1; k < span; k++) cells.push({ hMerge: true });
        for (var d = 1; d < down; d++) for (var c = 0; c < span; c++) taken[(ri + d) + ":" + (col + c)] = true;
        col += span;
      });
      while (taken[ri + ":" + col]) { cells.push({ vMerge: true }); col++; }
      width = Math.max(width, cells.length);
      rows.push({ h: tr.getBoundingClientRect().height / ctx.k, cells: cells });
    });
    rows.forEach(function (r) { while (r.cells.length < width) r.cells.push({ runs: [], size: 26, align: "l", valign: "ctr", padL: 0, padR: 0 }); });
    /* widths come from a row with no merged cells, otherwise an even split */
    var plain = Array.prototype.find.call(el.rows, function (tr) { return tr.cells.length === width; });
    var cols = plain ? Array.prototype.map.call(plain.cells, function (c) { return c.getBoundingClientRect().width / ctx.k; }) : new Array(width).fill(b.w / Math.max(1, width));
    return { kind: "table", x: b.x, y: b.y, w: b.w, h: b.h, cols: cols, rows: rows, name: "表格" };
  }

  /* ---- the walk -------------------------------------------------------------- */
  function zSorted(el) {
    var kids = Array.prototype.slice.call(el.children);
    return kids.map(function (k, i) {
      var z = parseInt(getComputedStyle(k).zIndex, 10);
      return { k: k, z: isNaN(z) ? 0 : z, i: i };
    }).sort(function (a, b) { return a.z - b.z || a.i - b.i; }).map(function (o) { return o.k; });
  }
  function walk(el, ctx, alpha, out, clip) {
    if (el.matches(SKIP_SEL)) return;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    var a = alpha * num(cs.opacity, 1);
    if (a <= .01) return;

    if (el.matches(".chart")) { var nodes = window.PptxSvg ? PptxSvg.chart(el, ctx, a) : []; nodes.forEach(function (n) { out.push(n); }); return; }
    if (el.tagName === "svg" || el.tagName === "SVG") { var g = window.PptxSvg ? PptxSvg.walk(el, ctx, a) : []; if (g.length) out.push({ kind: "group", name: "图形", items: g }); return; }
    if (el.tagName === "IMG" || el.tagName === "CANVAS" || el.tagName === "VIDEO") { imageItem(el, cs, ctx, a, out, clip); return; }
    if (el.tagName === "TABLE") { out.push(tableItem(el, ctx, a)); return; }

    var grouped = el.matches(GROUP_SEL) || el.hasAttribute("data-step") || el.hasAttribute("data-morph");
    var bucket = grouped ? [] : out;
    paintBox(el, cs, ctx, a, bucket, clip);
    pseudo(el, "::before", ctx, a, bucket);
    pseudo(el, "::after", ctx, a, bucket);

    if (inlineOnly(el)) {
      var t = textItem(el, cs, ctx, a);
      if (t) bucket.push(t);
    } else {
      var nextClip = clip;
      if (cs.overflow !== "visible" && parseFloat(cs.borderTopLeftRadius)) {
        var eb = ctx.box(el.getBoundingClientRect());
        nextClip = { box: eb, r: radii(cs, eb.w, eb.h) };
      }
      zSorted(el).forEach(function (k) { walk(k, ctx, a, bucket, nextClip); });
    }
    if (grouped && bucket.length) {
      var step = parseInt(el.getAttribute("data-step"), 10) || 0;
      var node = bucket.length === 1 ? bucket[0] : { kind: "group", name: boxName(el), items: bucket };
      if (step) node.step = step;
      if (el.getAttribute("data-morph")) node.name = "!!" + el.getAttribute("data-morph");
      out.push(node);
    }
  }

  window.PptxIR = {
    rgba: rgba, hex: hex, color: color, Ctx: Ctx, parseGradient: parseGradient, gradientFill: gradientFill, textName: textName,
    slide: function (slide, stage) {
      var ctx = new Ctx(stage), out = [], cs = getComputedStyle(slide);
      var bg = color(cs.backgroundColor) || { hex: "FFFFFF", a: 1 };
      tilePicture(slide, cs, ctx, out);
      zSorted(slide).forEach(function (k) { walk(k, ctx, 1, out, null); });
      var note = slide.querySelector(":scope > .notes");
      return {
        bg: bg, items: out, notes: note ? note.textContent.trim() : "",
        transition: slide.getAttribute("data-transition") || "",
        hidden: slide.hasAttribute("data-hidden"),
        morphs: Array.prototype.map.call(slide.querySelectorAll("[data-morph]"), function (e) { return e.getAttribute("data-morph"); })
      };
    }
  };
})();
