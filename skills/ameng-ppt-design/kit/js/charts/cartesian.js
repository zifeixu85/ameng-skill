/* charts/cartesian.js — bar, hbar, line, area, scatter, bubble, waterfall, slope,
   dumbbell, bullet. One axis only: two measures of different scale are two charts. */
(function () {
  "use strict";
  var C = window.Charts, h = C.h;

  function series(spec) { return spec.series || [{ name: spec.name || "", values: spec.values || [] }]; }
  function isHot(spec, cat) { return spec.highlight == null || spec.highlight === cat || (Array.isArray(spec.highlight) && spec.highlight.indexOf(cat) >= 0); }

  /* value labels are selective: all | max | last | none (default depends on chart) */
  function shouldLabel(mode, i, n, v, max) {
    if (mode === "all") return true;
    if (mode === "max") return v === max;
    if (mode === "last") return i === n - 1;
    return false;
  }

  C.register("bar", function (x) {
    var s = x.spec, cats = s.categories || [], ss = series(s), n = cats.length;
    var top = x.legend(ss.map(function (a) { return a.name; }), ss.map(function (_, i) { return x.color(i); }));
    var stacked = !!s.stacked, totals = cats.map(function (_, i) { return ss.reduce(function (t, a) { return t + (a.values[i] || 0); }, 0); });
    var maxV = stacked ? Math.max.apply(null, totals) : Math.max.apply(null, ss.map(function (a) { return Math.max.apply(null, a.values); }));
    var minV = Math.min(0, stacked ? 0 : Math.min.apply(null, ss.map(function (a) { return Math.min.apply(null, a.values); })));
    var labels = s.labels || (ss.length === 1 ? "all" : "none"), showAxis = s.axis != null ? s.axis : labels !== "all";
    var tk = C.ticks(minV, Math.max(0, maxV), 4), yMax = tk[tk.length - 1];
    var left = showAxis ? 76 : 0, bottom = 62, yEnd = x.H - bottom, y1 = top + 44;
    var y = C.linear(tk[0], yMax, yEnd, y1), y0 = y(0), band = (x.W - left) / n;
    var g = h("g", null, x.svg);
    if (showAxis) x.grid(g, left, x.W, tk.map(function (v) { return { v: v, y: y(v) }; }), function (v) { return C.format(v, s); });
    else h("line", { x1: 0, x2: x.W, y1: y0, y2: y0, style: "stroke:var(--line-2);stroke-width:2" }, g);
    var groupW = Math.min(band * .64, stacked || ss.length === 1 ? 128 : 200), bw = stacked ? groupW : (groupW - (ss.length - 1) * 6) / ss.length;

    cats.forEach(function (cat, i) {
      var cx = left + band * i + band / 2, acc = 0;
      ss.forEach(function (a, k) {
        var v = a.values[i] || 0, bx = stacked ? cx - groupW / 2 : cx - groupW / 2 + k * (bw + 6);
        var by = stacked ? y(acc + v) : Math.min(y(v), y0), bh = stacked ? y(acc) - y(acc + v) : Math.abs(y0 - y(v));
        var fill = ss.length === 1 ? (isHot(s, cat) ? x.color(0) : x.mute) : x.color(k);
        var m = stacked ? h("rect", { x: bx, y: by + 1, width: bw, height: Math.max(0, bh - 2), style: "fill:" + fill }, g) : x.bar(g, bx, by, bw, bh, fill);
        x.anim(m, "growY", { delay: i * 70 + k * 40 });
        x.tip(m, "<b>" + cat + "</b>" + (a.name ? a.name + " " : "") + C.format(v, s));
        if (!stacked && shouldLabel(labels, i, n, v, maxV)) x.anim(x.label(g, bx + bw / 2, by - 14, C.format(v, s), { anchor: "middle", weight: 700, size: x.fs + 6, fill: "var(--ink)", num: true }), "fade", { delay: 480 + i * 70 });
        acc += v;
      });
      if (stacked && labels !== "none") x.anim(x.label(g, cx, y(totals[i]) - 14, C.format(totals[i], s), { anchor: "middle", weight: 700, size: x.fs + 4, fill: "var(--ink)", num: true }), "fade", { delay: 480 + i * 70 });
      C.wrap(cat, x.fs, band - 12, 2).forEach(function (ln, j) { x.label(g, cx, yEnd + 34 + j * (x.fs + 6), ln, { anchor: "middle", fill: isHot(s, cat) ? "var(--ink)" : "var(--ink-3)", weight: isHot(s, cat) && s.highlight != null ? 700 : 400 }); });
    });
  });

  C.register("hbar", function (x) {
    var s = x.spec, cats = s.categories || [], ss = series(s), n = cats.length, a = ss[0];
    var maxV = Math.max(0, Math.max.apply(null, a.values)), minV = Math.min(0, Math.min.apply(null, a.values)), row = x.H / n, thick = Math.min(row * .54, 52);
    var labelW = Math.min(x.W * .36, Math.max.apply(null, cats.map(function (c) { return C.textWidth(c, x.fs + 2); })) + 28);
    var valW = C.textWidth(C.format(maxV, s), x.fs + 8, 700) + 24, xs = C.linear(minV, maxV === minV ? 1 : maxV, labelW, x.W - valW), x0 = xs(0);
    var g = h("g", null, x.svg);
    cats.forEach(function (c, i) {
      var v = a.values[i], cy = row * i + row / 2, hot = isHot(s, c), bw = Math.max(2, Math.abs(xs(v) - x0)), bx = Math.min(xs(v), x0);
      x.label(g, 0, cy + 9, c, { fill: hot ? "var(--ink)" : "var(--ink-2)", size: x.fs + 2, weight: hot && s.highlight != null ? 700 : 400 });
      var m = x.seg ? segments(x, g, bx, cy - thick / 2, bw, thick, hot ? x.color(0) : x.mute, i) : x.bar(g, bx, cy - thick / 2, bw, thick, hot ? x.color(0) : x.mute, "right");
      if (!x.seg) x.anim(m, "growX", { delay: i * 80 });
      x.anim(x.label(g, bx + bw + 14, cy + 11, C.format(v, s), { weight: 700, size: x.fs + 8, fill: "var(--ink)", num: true }), "fade", { delay: 420 + i * 80 });
      var hit = h("rect", { x: 0, y: row * i, width: x.W, height: row, style: "fill:transparent" }, g);
      x.tip(hit, "<b>" + c + "</b>" + C.format(v, s));
    });
    h("line", { x1: x0, x2: x0, y1: 0, y2: x.H, style: "stroke:var(--line-2);stroke-width:2" }, g);
  });

  /* LED-style bar for the spec theme */
  function segments(x, g, x0, y, w, ht, fill, row) {
    var grp = h("g", null, g), step = 18, cell = 12, count = Math.max(1, Math.floor(w / step));
    for (var i = 0; i < count; i++) {
      var r = h("rect", { x: x0 + i * step, y: y, width: cell, height: ht, style: "fill:" + fill }, grp);
      x.anim(r, "fade", { delay: row * 60 + i * 9, dur: 120 });
    }
    return grp;
  }

  function smoothPath(pts) {
    if (pts.length < 3) return "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join("L");
    var d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = .16;
      d += "C" + (p1[0] + (p2[0] - p0[0]) * t) + " " + (p1[1] + (p2[1] - p0[1]) * t) + " " + (p2[0] - (p3[0] - p1[0]) * t) + " " + (p2[1] - (p3[1] - p1[1]) * t) + " " + p2[0] + " " + p2[1];
    }
    return d;
  }

  function lineLike(x, opts) {
    var s = x.spec, cats = s.categories || [], ss = series(s), n = cats.length;
    var top = x.legend(ss.length > 4 ? ss.map(function (a) { return a.name; }) : null, ss.map(function (_, i) { return x.color(i); }));
    var stacked = opts.stacked, base = cats.map(function () { return 0; });
    var all = [];
    ss.forEach(function (a) { a.values.forEach(function (v, i) { all.push(stacked ? (base[i] += v || 0) : v); }); });
    var hi = Math.max.apply(null, all.filter(function (v) { return v != null; })), lo = stacked || s.zero !== false ? 0 : Math.min.apply(null, all.filter(function (v) { return v != null; }));
    var tk = C.ticks(lo, hi, 4), left = 76, nameW = 0;
    if (ss.length <= 4) nameW = Math.max.apply(null, ss.map(function (a) { return C.textWidth(a.name, x.fs, 700); })) + 26;
    var right = Math.max(nameW, 40), bottom = 56, y0 = x.H - bottom, y1 = top + 20;
    var y = C.linear(tk[0], tk[tk.length - 1], y0, y1), xs = C.linear(0, Math.max(1, n - 1), left + 8, x.W - right);
    var g = h("g", null, x.svg);
    x.grid(g, left, x.W - right + 12, tk.map(function (v) { return { v: v, y: y(v) }; }), function (v) { return C.format(v, s); });
    var every = Math.ceil(n / 8);
    cats.forEach(function (c, i) { if (i % every === 0 || i === n - 1) x.label(g, xs(i), y0 + 38, c, { anchor: "middle", fill: "var(--ink-3)", size: x.fs - 2 }); });
    var acc = cats.map(function () { return 0; }), ends = [];
    ss.forEach(function (a, k) {
      var pts = [], low = acc.slice();
      a.values.forEach(function (v, i) {
        if (v == null) return;
        var val = stacked ? acc[i] + v : v;
        if (stacked) acc[i] = val;
        pts.push([xs(i), y(val)]);
      });
      var col = s.highlight != null && s.highlight !== a.name ? x.mute : x.color(k);
      var d = s.smooth === false ? "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join("L") : smoothPath(pts);
      if (opts.area || s.area) {
        var backPts = stacked ? low.map(function (v, i) { return [xs(i), y(v)]; }).reverse() : [[pts[pts.length - 1][0], y0], [pts[0][0], y0]];
        var area = h("path", { d: d + "L" + backPts.map(function (p) { return p[0] + " " + p[1]; }).join("L") + "Z", style: "fill:" + col + ";fill-opacity:" + (stacked ? .86 : .12) + ";stroke:none" }, g);
        x.anim(area, "wipe", { delay: 200 + k * 120, dur: 1300 });
      }
      if (!stacked) {
        var path = h("path", { d: d, style: "fill:none;stroke:" + col + ";stroke-width:" + (s.highlight === a.name ? 7 : 5) + ";stroke-linecap:round;stroke-linejoin:round" }, g);
        x.anim(path, "draw", { delay: k * 160, dur: 1500 });
      }
      var e = pts[pts.length - 1];
      ends.push({ a: a, e: e, col: col, k: k, v: a.values[a.values.length - 1] });
    });
    /* end labels: nudge apart, never stack on top of each other */
    ends.sort(function (p, q) { return p.e[1] - q.e[1]; });
    var minGap = x.fs + 12, lastY = -1e9;
    ends.forEach(function (o) {
      var ly = Math.max(o.e[1] + 8, lastY + minGap); lastY = ly;
      if (!stacked) {
        var dot = h("circle", { cx: o.e[0], cy: o.e[1], r: 10, style: "fill:" + o.col + ";stroke:var(--bg);stroke-width:4" }, g);
        x.anim(dot, "pop", { delay: 1100 + o.k * 160, dur: 420 });
        x.loops.push({ kind: "halo", el: dot, color: o.col });
      }
      if (ss.length <= 4) x.anim(x.label(g, o.e[0] + 22, ly, o.a.name, { fill: "var(--ink)", weight: 700 }), "fade", { delay: 1200 + o.k * 160 });
    });
    /* crosshair + tooltip */
    var guide = h("line", { y1: y1, y2: y0, style: "stroke:var(--line-2);stroke-width:2;opacity:0" }, g);
    cats.forEach(function (c, i) {
      var bandW = (x.W - right - left) / Math.max(1, n - 1);
      var hit = h("rect", { x: xs(i) - bandW / 2, y: y1, width: bandW, height: y0 - y1, style: "fill:transparent" }, g);
      x.tip(hit, "<b>" + c + "</b>" + ss.map(function (a) { return a.name + " " + C.format(a.values[i], s); }).join("<br>"));
      hit.addEventListener("pointerenter", function () { guide.setAttribute("x1", xs(i)); guide.setAttribute("x2", xs(i)); guide.style.opacity = 1; });
      hit.addEventListener("pointerleave", function () { guide.style.opacity = 0; });
    });
  }
  C.register("line", function (x) { lineLike(x, {}); });
  C.register("area", function (x) { lineLike(x, { area: true, stacked: !!x.spec.stacked }); });

  /* scatter / bubble: points:[{name,x,y,r?,group?}] */
  /* A name sits on the first side that stays clear of every other disc, so it never lands
     on a neighbouring fill, whose color is not one the theme promises text on. */
  function pointLabel(x, g, name, discs, i) {
    var d = discs[i], w = C.textWidth(name, x.fs), hgt = x.fs;
    var spots = [
      { x: d.x + d.r + 10, y: d.y + 8, a: "start", l: d.x + d.r + 10 },
      { x: d.x - d.r - 10, y: d.y + 8, a: "end", l: d.x - d.r - 10 - w },
      { x: d.x, y: d.y - d.r - 10, a: "middle", l: d.x - w / 2 },
      { x: d.x, y: d.y + d.r + hgt + 6, a: "middle", l: d.x - w / 2 }
    ];
    function clear(p) {
      var top = p.y - hgt, bot = p.y + 4;
      if (p.l < 0 || p.l + w > x.W) return false;
      return discs.every(function (o, k) {
        if (k === i) return true;
        var nx = Math.max(p.l, Math.min(o.x, p.l + w)), ny = Math.max(top, Math.min(o.y, bot));
        return Math.hypot(nx - o.x, ny - o.y) > o.r + 2;
      });
    }
    var spot = spots.filter(clear)[0] || spots[0];
    return x.label(g, spot.x, spot.y, name, { anchor: spot.a, fill: "var(--ink)", size: x.fs });
  }

  function points(x, bubble) {
    var s = x.spec, P = s.points || [], left = 84, bottom = 74, top = 18, right = 30;
    var xv = P.map(function (p) { return p.x; }), yv = P.map(function (p) { return p.y; });
    var room = bubble ? 1.18 : 1.02;
    var tx = C.ticks(Math.min.apply(null, xv.concat(s.zero === false ? [] : [0])), Math.max.apply(null, xv) * room, 5), ty = C.ticks(Math.min.apply(null, yv.concat(s.zero === false ? [] : [0])), Math.max.apply(null, yv) * room, 4);
    var xs = C.linear(tx[0], tx[tx.length - 1], left, x.W - right), ys = C.linear(ty[0], ty[ty.length - 1], x.H - bottom, top);
    var g = h("g", null, x.svg);
    x.grid(g, left, x.W - right, ty.map(function (v) { return { v: v, y: ys(v) }; }), function (v) { return C.format(v, s.yFormat || s); });
    tx.forEach(function (v) { x.label(g, xs(v), x.H - bottom + 36, C.format(v, s.xFormat || s), { anchor: "middle", fill: "var(--ink-3)", size: x.fs - 2 }); });
    if (s.xLabel) x.label(g, (left + x.W - right) / 2, x.H - 6, s.xLabel, { anchor: "middle", fill: "var(--ink-2)" });
    if (s.yLabel) x.label(g, left, top - 2, s.yLabel, { fill: "var(--ink-2)" });
    var rMax = bubble ? Math.max.apply(null, P.map(function (p) { return p.r || 1; })) : 1;
    function radius(p) { return bubble ? 16 + 62 * Math.sqrt((p.r || 1) / rMax) : 18; }
    var discs = P.map(function (p) { return { x: xs(p.x), y: ys(p.y), r: radius(p) }; });
    P.forEach(function (p, i) {
      var r = radius(p), hot = s.highlight == null || s.highlight === p.name;
      var c = h("circle", { cx: xs(p.x), cy: ys(p.y), r: r, style: "fill:" + (hot ? x.color(p.group || 0) : x.mute) + ";fill-opacity:" + (bubble ? .82 : 1) + ";stroke:var(--bg);stroke-width:3" }, g);
      x.anim(c, "pop", { delay: i * 45, dur: 620 });
      x.tip(c, "<b>" + (p.name || "") + "</b>" + C.format(p.x, s.xFormat || s) + " · " + C.format(p.y, s.yFormat || s));
      if (p.label !== false && p.name && (bubble || s.labels === "all" || s.highlight === p.name)) x.anim(pointLabel(x, g, p.name, discs, i), "fade", { delay: 500 + i * 45 });
    });
  }
  C.register("scatter", function (x) { points(x, false); });
  C.register("bubble", function (x) { points(x, true); });

  /* waterfall: steps:[{name,value,total?}] */
  C.register("waterfall", function (x) {
    var s = x.spec, S = s.steps || [], run = 0, bars = [];
    S.forEach(function (t) { var a = t.total ? 0 : run, b = t.total ? t.value : run + t.value; bars.push({ n: t.name, lo: Math.min(a, b), hi: Math.max(a, b), v: t.value, total: t.total, end: b }); run = b; });
    var hi = Math.max.apply(null, bars.map(function (b) { return b.hi; })), tk = C.ticks(0, hi, 4), bottom = 66, y0 = x.H - bottom;
    var y = C.linear(0, tk[tk.length - 1], y0, 44), band = x.W / S.length, bw = Math.min(band * .62, 132), g = h("g", null, x.svg);
    h("line", { x1: 0, x2: x.W, y1: y0, y2: y0, style: "stroke:var(--line-2);stroke-width:2" }, g);
    bars.forEach(function (b, i) {
      var cx = band * i + band / 2, col = b.total ? "var(--ink)" : (b.v >= 0 ? x.color(0) : x.mute);
      var m = h("rect", { x: cx - bw / 2, y: y(b.hi), width: bw, height: Math.max(2, y(b.lo) - y(b.hi)), rx: 4, style: "fill:" + col }, g);
      x.anim(m, b.v >= 0 || b.total ? "growY" : "fade", { delay: i * 130 });
      x.tip(m, "<b>" + b.n + "</b>" + C.format(b.v, s));
      x.anim(x.label(g, cx, y(b.hi) - 14, (b.v > 0 && !b.total ? "+" : "") + C.format(b.v, s), { anchor: "middle", weight: 700, size: x.fs + 4, fill: "var(--ink)", num: true }), "fade", { delay: 300 + i * 130 });
      C.wrap(b.n, x.fs, band - 10, 2).forEach(function (ln, j) { x.label(g, cx, y0 + 36 + j * (x.fs + 6), ln, { anchor: "middle" }); });
      if (i < bars.length - 1) x.anim(h("line", { x1: cx + bw / 2, x2: cx + band - bw / 2, y1: y(b.end), y2: y(b.end), style: "stroke:var(--line-2);stroke-width:2" }, g), "fade", { delay: 200 + i * 130 });
    });
  });

  /* slope: two moments, items:[{name,from,to}] */
  C.register("slope", function (x) {
    var s = x.spec, I = s.items || [], L = s.labels || ["之前", "之后"], vals = [];
    I.forEach(function (i) { vals.push(i.from, i.to); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = x.W * .3, y = C.linear(lo, hi, x.H - 40, 76), g = h("g", null, x.svg);
    [pad, x.W - pad].forEach(function (px, k) {
      h("line", { x1: px, x2: px, y1: 54, y2: x.H - 10, style: "stroke:var(--line-2);stroke-width:2" }, g);
      x.label(g, px, 28, L[k], { anchor: "middle", weight: 700, fill: "var(--ink)" });
    });
    I.forEach(function (it, i) {
      var hot = s.highlight == null || s.highlight === it.name, col = hot ? x.color(s.highlight != null ? 0 : i) : x.mute;
      var ln = h("line", { x1: pad, x2: x.W - pad, y1: y(it.from), y2: y(it.to), style: "stroke:" + col + ";stroke-width:" + (hot ? 6 : 4) + ";stroke-linecap:round" }, g);
      x.anim(ln, "draw", { delay: i * 110, dur: 1000 });
      [[pad, it.from], [x.W - pad, it.to]].forEach(function (p) { x.anim(h("circle", { cx: p[0], cy: y(p[1]), r: 10, style: "fill:" + col + ";stroke:var(--bg);stroke-width:4" }, g), "pop", { delay: 500 + i * 110, dur: 360 }); });
      x.label(g, pad - 20, y(it.from) + 8, it.name + " " + C.format(it.from, s), { anchor: "end", fill: hot ? "var(--ink)" : "var(--ink-3)" });
      x.label(g, x.W - pad + 20, y(it.to) + 8, C.format(it.to, s) + " " + it.name, { fill: hot ? "var(--ink)" : "var(--ink-3)", weight: hot ? 700 : 400 });
    });
  });

  /* dumbbell: before/after across items */
  C.register("dumbbell", function (x) {
    var s = x.spec, I = s.items || [], L = s.labels || ["之前", "之后"], vals = [];
    I.forEach(function (i) { vals.push(i.from, i.to); });
    var top = x.legend(L, [x.mute, x.color(0)]), labelW = Math.max.apply(null, I.map(function (i) { return C.textWidth(i.name, x.fs + 2); })) + 34;
    var tk = C.ticks(s.zero === false ? Math.min.apply(null, vals) : 0, Math.max.apply(null, vals), 5), xs = C.linear(tk[0], tk[tk.length - 1], labelW, x.W - 40), row = (x.H - top) / I.length, g = h("g", null, x.svg);
    I.forEach(function (it, i) {
      var cy = top + row * i + row / 2;
      x.label(g, 0, cy + 9, it.name, { fill: "var(--ink)", size: x.fs + 2 });
      h("line", { x1: labelW, x2: x.W - 40, y1: cy, y2: cy, style: "stroke:var(--line);stroke-width:1.5" }, g);
      var c = h("line", { x1: xs(it.from), x2: xs(it.to), y1: cy, y2: cy, style: "stroke:var(--c1);stroke-width:6" }, g);
      x.anim(c, "draw", { delay: i * 100, dur: 700 });
      x.anim(h("circle", { cx: xs(it.from), cy: cy, r: 13, style: "fill:" + x.mute + ";stroke:var(--bg);stroke-width:3" }, g), "pop", { delay: i * 100, dur: 300 });
      x.anim(h("circle", { cx: xs(it.to), cy: cy, r: 15, style: "fill:" + x.color(0) + ";stroke:var(--bg);stroke-width:3" }, g), "pop", { delay: 420 + i * 100, dur: 360 });
      x.anim(x.label(g, xs(it.to) + (it.to >= it.from ? 26 : -26), cy + 9, C.format(it.to, s), { anchor: it.to >= it.from ? "start" : "end", weight: 700, fill: "var(--ink)", num: true }), "fade", { delay: 600 + i * 100 });
    });
  });

  /* bullet: value vs target */
  C.register("bullet", function (x) {
    var s = x.spec, I = s.items || [], labelW = Math.max.apply(null, I.map(function (i) { return C.textWidth(i.name, x.fs + 2); })) + 34, row = x.H / I.length, thick = Math.min(row * .42, 44), g = h("g", null, x.svg);
    I.forEach(function (it, i) {
      var max = it.max || Math.max(it.value, it.target) * 1.2, cy = row * i + row / 2, xs = C.linear(0, max, labelW, x.W - 120);
      x.label(g, 0, cy + 9, it.name, { fill: "var(--ink)", size: x.fs + 2 });
      h("rect", { x: labelW, y: cy - thick / 2 - 8, width: x.W - 120 - labelW, height: thick + 16, rx: 3, style: "fill:var(--bg-2)" }, g);
      var hit = it.value >= it.target, m = x.bar(g, labelW, cy - thick / 2, xs(it.value) - labelW, thick, hit ? x.color(0) : "var(--ink-3)", "right");
      x.anim(m, "growX", { delay: i * 100 });
      h("line", { x1: xs(it.target), x2: xs(it.target), y1: cy - thick / 2 - 14, y2: cy + thick / 2 + 14, style: "stroke:var(--ink);stroke-width:5" }, g);
      x.anim(x.label(g, x.W - 104, cy + 10, C.format(it.value, s), { weight: 700, size: x.fs + 6, fill: "var(--ink)", num: true }), "fade", { delay: 400 + i * 100 });
      x.tip(m, "<b>" + it.name + "</b>实际 " + C.format(it.value, s) + " · 目标 " + C.format(it.target, s));
    });
  });
})();
