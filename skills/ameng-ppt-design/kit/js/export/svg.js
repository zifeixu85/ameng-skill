/* export/svg.js — turns SVG marks into editable PowerPoint geometry, and decides
   when a .chart becomes a native chart object instead. */
(function () {
  "use strict";
  var IR = window.PptxIR;

  /* ---- path parsing: everything normalised to absolute M/L/C/Z ---------------- */
  function tokens(d) { return d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || []; }
  function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
    var sinp = Math.sin(phi), cosp = Math.cos(phi), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    var xp = cosp * dx + sinp * dy, yp = -sinp * dx + cosp * dy;
    var lam = xp * xp / (rx * rx) + yp * yp / (ry * ry);
    if (lam > 1) { var sc = Math.sqrt(lam); rx *= sc; ry *= sc; }
    var num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, den = rx * rx * yp * yp + ry * ry * xp * xp;
    var co = Math.sqrt(Math.max(0, num / den)) * (fa === fs ? -1 : 1);
    var cxp = co * rx * yp / ry, cyp = -co * ry * xp / rx;
    var cx = cosp * cxp - sinp * cyp + (x1 + x2) / 2, cy = sinp * cxp + cosp * cyp + (y1 + y2) / 2;
    function ang(ux, uy, vx, vy) { var a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; }
    var t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry), dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
    var n = Math.ceil(Math.abs(dt) / (Math.PI / 2)), seg = dt / n, out = [], k = 4 / 3 * Math.tan(seg / 4);
    for (var i = 0; i < n; i++) {
      var a = t1 + i * seg, b = a + seg, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      function P(x, y) { return [cosp * rx * x - sinp * ry * y + cx, sinp * rx * x + cosp * ry * y + cy]; }
      var p1 = P(ca - k * sa, sa + k * ca), p2 = P(cb + k * sb, sb - k * cb), p3 = P(cb, sb);
      out.push([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]]);
    }
    return out;
  }
  function parsePath(d) {
    var t = tokens(d), i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0, lx = 0, ly = 0, out = [];
    function num() { return parseFloat(t[i++]); }
    while (i < t.length) {
      if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
      var rel = cmd === cmd.toLowerCase(), c = cmd.toUpperCase();
      if (c === "M") { x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); sx = x; sy = y; out.push(["M", x, y]); cmd = rel ? "l" : "L"; }
      else if (c === "L") { x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); out.push(["L", x, y]); }
      else if (c === "H") { x = num() + (rel ? x : 0); out.push(["L", x, y]); }
      else if (c === "V") { y = num() + (rel ? y : 0); out.push(["L", x, y]); }
      else if (c === "C") {
        var a = num() + (rel ? x : 0), b = num() + (rel ? y : 0), e = num() + (rel ? x : 0), f = num() + (rel ? y : 0), g = num() + (rel ? x : 0), h = num() + (rel ? y : 0);
        out.push(["C", a, b, e, f, g, h]); lx = e; ly = f; x = g; y = h;
      } else if (c === "S") {
        var e2 = num() + (rel ? x : 0), f2 = num() + (rel ? y : 0), g2 = num() + (rel ? x : 0), h2 = num() + (rel ? y : 0);
        out.push(["C", 2 * x - lx, 2 * y - ly, e2, f2, g2, h2]); lx = e2; ly = f2; x = g2; y = h2;
      } else if (c === "Q") {
        var qa = num() + (rel ? x : 0), qb = num() + (rel ? y : 0), qg = num() + (rel ? x : 0), qh = num() + (rel ? y : 0);
        out.push(["C", x + 2 / 3 * (qa - x), y + 2 / 3 * (qb - y), qg + 2 / 3 * (qa - qg), qh + 2 / 3 * (qb - qh), qg, qh]); x = qg; y = qh;
      } else if (c === "A") {
        var rx = num(), ry = num(), rot = num() * Math.PI / 180, fa = num(), fs = num(), ex = num() + (rel ? x : 0), ey = num() + (rel ? y : 0);
        arcToCubics(x, y, rx, ry, rot, fa, fs, ex, ey).forEach(function (q) { out.push(["C"].concat(q)); });
        x = ex; y = ey;
      } else if (c === "Z") { x = sx; y = sy; out.push(["Z"]); }
      else i++;
    }
    return out;
  }
  function transformPath(cmds, m, ctx) {
    function T(x, y) { var p = ctx.pt(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f); return p; }
    return cmds.map(function (c) {
      if (c[0] === "Z") return c;
      var o = [c[0]];
      for (var i = 1; i < c.length; i += 2) { var p = T(c[i], c[i + 1]); o.push(p[0], p[1]); }
      return o;
    });
  }
  function bounds(cmds) {
    var xs = [], ys = [];
    cmds.forEach(function (c) { for (var i = 1; i < c.length; i += 2) { xs.push(c[i]); ys.push(c[i + 1]); } });
    var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    return { x: x0, y: y0, w: Math.max.apply(null, xs) - x0, h: Math.max.apply(null, ys) - y0 };
  }
  function num(v, fallback) { var n = parseFloat(v); return isNaN(n) ? fallback : n; }
  function strokeOf(cs, a, scale) {
    var c = IR.color(cs.stroke, a * num(cs.strokeOpacity, 1));
    if (!c || cs.stroke === "none") return null;
    var w = (parseFloat(cs.strokeWidth) || 1) * scale;
    var dash = cs.strokeDasharray && cs.strokeDasharray !== "none" ? cs.strokeDasharray.split(/[ ,]+/).map(parseFloat) : null;
    return { w: w, color: c, cap: cs.strokeLinecap, join: cs.strokeLinejoin, dash: dash ? (dash[0] <= 3 ? "sysDot" : "dash") : null };
  }
  function fillOf(cs, a) {
    if (!cs.fill || cs.fill === "none" || /^url/.test(cs.fill)) return null;
    var c = IR.color(cs.fill, a * num(cs.fillOpacity, 1));
    return c ? { type: "solid", color: c } : null;
  }

  function shapeFor(n, ctx, a) {
    var cs = getComputedStyle(n), tag = n.tagName.toLowerCase();
    if (cs.display === "none" || cs.visibility === "hidden") return null;
    var alpha = a * num(cs.opacity, 1);
    if (alpha <= .01) return null;
    var m = n.getScreenCTM(); if (!m) return null;
    var scale = Math.sqrt(m.a * m.a + m.b * m.b) / ctx.k, fill = fillOf(cs, alpha), line = strokeOf(cs, alpha, scale), cmds = null;
    if (!fill && !line && tag !== "text") return null;
    if (tag === "rect") {
      /* baseVal resolves percentages; getAttribute would not */
      var x = n.x.baseVal.value, y = n.y.baseVal.value, w = n.width.baseVal.value, h = n.height.baseVal.value, r = n.rx.baseVal.value || 0;
      if (!w || !h) return null;
      var p = ctx.pt(m.a * x + m.e, m.d * y + m.f);
      var R = r * scale, W = w * scale, H = h * scale;
      return { kind: "shape", x: p[0], y: p[1], w: W, h: H, geom: R > .5 ? { type: "round", adj: Math.min(50000, Math.round(R / Math.min(W, H) * 100000)) } : { type: "rect" }, fill: fill, line: line, name: "矩形" };
    }
    if (tag === "circle" || tag === "ellipse") {
      var cx = n.cx.baseVal.value, cy = n.cy.baseVal.value, rx = tag === "circle" ? n.r.baseVal.value : n.rx.baseVal.value, ry = tag === "circle" ? n.r.baseVal.value : n.ry.baseVal.value;
      if (!(rx > 0) || !(ry > 0)) return null;
      var c = ctx.pt(m.a * cx + m.c * cy + m.e, m.b * cx + m.d * cy + m.f);
      return { kind: "shape", x: c[0] - rx * scale, y: c[1] - ry * scale, w: 2 * rx * scale, h: 2 * ry * scale, geom: { type: "ellipse" }, fill: fill, line: line, name: "圆" };
    }
    if (tag === "line") cmds = [["M", n.x1.baseVal.value, n.y1.baseVal.value], ["L", n.x2.baseVal.value, n.y2.baseVal.value]];
    else if (tag === "polyline" || tag === "polygon") {
      var v = (n.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat);
      cmds = [];
      for (var i = 0; i + 1 < v.length; i += 2) cmds.push([i ? "L" : "M", v[i], v[i + 1]]);
      if (tag === "polygon") cmds.push(["Z"]);
    } else if (tag === "path") cmds = parsePath(n.getAttribute("d") || "");
    else if (tag === "text") return textFor(n, cs, ctx, alpha, m);
    if (!cmds || !cmds.length) return null;
    var abs = transformPath(cmds, m, ctx), b = bounds(abs);
    if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.w) || !isFinite(b.h)) return null;
    return { kind: "shape", x: b.x, y: b.y, w: Math.max(b.w, .01), h: Math.max(b.h, .01), geom: { type: "path", cmds: abs }, fill: fill, line: line, name: tag === "line" ? "线" : "路径" };
  }
  function textFor(n, cs, ctx, a, m) {
    var str = n.textContent; if (!str || !str.trim()) return null;
    var size = parseFloat(cs.fontSize), bb = n.getBoundingClientRect(), b = ctx.box(bb);
    var anchor = cs.textAnchor, fill = IR.color(cs.fill, a * (parseFloat(cs.fillOpacity) || 1));
    var tx = n.x.baseVal.numberOfItems ? n.x.baseVal.getItem(0).value : 0, ty = n.y.baseVal.numberOfItems ? n.y.baseVal.getItem(0).value : 0;
    var p = ctx.pt(m.a * tx + m.e, m.d * ty + m.f);
    var pad = 4;
    return {
      kind: "text", x: anchor === "middle" ? b.x - pad : anchor === "end" ? b.x - pad * 2 : b.x, w: b.w + pad * 2, lines: 1, lineHeight: size * 1.2, baseline: p[1], size: size, svgText: true,
      runs: [{ text: str, family: cs.fontFamily, size: size, weight: parseInt(cs.fontWeight, 10) || 400, italic: false, spacing: 0, color: fill }],
      align: anchor === "middle" ? "ctr" : anchor === "end" ? "r" : "l", wrap: false, name: "标注 · " + Array.from(str).slice(0, 14).join("")
    };
  }
  function walk(svg, ctx, a) {
    var out = [];
    (function visit(n) {
      for (var c = n.firstElementChild; c; c = c.nextElementSibling) {
        var tag = c.tagName.toLowerCase();
        if (tag === "defs" || tag === "metadata" || tag === "title") continue;
        if (tag === "g") { visit(c); continue; }
        var s = shapeFor(c, ctx, a);
        if (s) out.push(s);
      }
    })(svg);
    return out;
  }

  /* Chart types with a true PowerPoint counterpart */
  var NATIVE = { bar: 1, hbar: 1, line: 1, area: 1, donut: 1, pie: 1, radar: 1, scatter: 1, bubble: 1 };
  /* only hand PowerPoint data it can chart; anything else stays as editable shapes */
  function nativeReady(s) {
    function ok(v) { return typeof v === "number" && isFinite(v); }
    if (s.points) return s.points.length > 0 && s.points.every(function (p) { return ok(p.x) && ok(p.y); });
    if (s.parts) return s.parts.length > 0 && s.parts.every(function (p) { return ok(p.value); }) && s.parts.some(function (p) { return p.value > 0; });
    if (!s.categories || !s.categories.length || !s.series || !s.series.length) return false;
    return s.series.every(function (x) { return x.values && x.values.length === s.categories.length && x.values.some(ok); });
  }
  function chart(fig, ctx, a) {
    var spec = Charts.readSpec(fig), box = ctx.box(fig.getBoundingClientRect()), svg = fig.querySelector(":scope > svg");
    var useNative = NATIVE[spec.type] && nativeReady(spec) && !fig.hasAttribute("data-shapes") && !(window.PptxOpts && PptxOpts.shapesOnly);
    if (!svg) return [];
    if (!useNative) { return [{ kind: "group", name: "图表 · " + spec.type, items: walk(svg, ctx, a) }]; }
    var cs = getComputedStyle(fig), tokens = {};
    ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6", "--chart-mute", "--ink", "--ink-2", "--ink-3", "--line", "--line-2", "--bg"].forEach(function (t) { var c = IR.color(cs.getPropertyValue(t).trim()); tokens[t] = c ? c.hex : "888888"; });
    var node = { kind: "chart", x: box.x, y: box.y, w: box.w, h: box.h, spec: spec, tokens: tokens, family: cs.fontFamily, numFamily: cs.getPropertyValue("--f-num"), name: "图表 · " + (fig.getAttribute("aria-label") || spec.type), alt: fig.getAttribute("aria-label") || "" };
    if (spec.type === "donut" || spec.type === "pie") {
      /* the ring is native; centre text and legend stay as editable labels */
      var parts = [];
      Array.prototype.forEach.call(svg.querySelectorAll("text,rect"), function (n) { var s = shapeFor(n, ctx, a); if (s) parts.push(s); });
      var size = Math.min(box.h, box.w - Math.min(box.w * .44, 460) - 40);
      node.w = size; node.y = box.y + (box.h - size) / 2; node.h = size;
      return [node].concat(parts);
    }
    return [node];
  }
  window.PptxSvg = { walk: walk, chart: chart };
})();
