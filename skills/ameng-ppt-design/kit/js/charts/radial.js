/* charts/radial.js — donut, pie, gauge, radar, waffle, spark. */
(function () {
  "use strict";
  var C = window.Charts, h = C.h;

  function polar(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1), big = a1 - a0 > Math.PI ? 1 : 0;
    return "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + "A" + r + " " + r + " 0 " + big + " 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2);
  }
  function wedge(cx, cy, r, a0, a1) {
    return "M" + cx + " " + cy + "L" + polar(cx, cy, r, a0).map(function (n) { return n.toFixed(2); }).join(" ") + arc(cx, cy, r, a0, a1).replace(/^M[^A]+/, "") + "Z";
  }

  /* parts: {name,value}. Slices start at 12 o'clock; legend beside the ring with
     share labels, so identity never depends on color alone. */
  function ring(x, pie) {
    var s = x.spec, P = s.parts || (s.categories || []).map(function (c, i) { return { name: c, value: s.series[0].values[i] }; });
    var total = P.reduce(function (t, p) { return t + p.value; }, 0), legendW = Math.min(x.W * .44, 460);
    var size = Math.min(x.H, x.W - legendW - 40), cx = size / 2, cy = x.H / 2, r = size / 2 - 6, thick = pie ? r : Math.max(46, r * .3), rm = r - thick / 2;
    var g = h("g", null, x.svg), a = -Math.PI / 2, gap = pie ? 0 : .018;
    P.forEach(function (p, i) {
      var sweep = p.value / total * Math.PI * 2, a0 = a + gap / 2, a1 = a + sweep - gap / 2;
      var col = s.highlight != null && s.highlight !== p.name ? x.mute : x.color(i), m;
      if (pie) m = h("path", { d: wedge(cx, cy, r, a0, a1), style: "fill:" + col + ";stroke:var(--bg);stroke-width:3" }, g);
      else m = h("path", { d: arc(cx, cy, rm, a0, a1), style: "fill:none;stroke:" + col + ";stroke-width:" + thick }, g);
      x.anim(m, pie ? "pop" : "draw", { delay: i * 150, dur: 760 });
      x.tip(m, "<b>" + p.name + "</b>" + C.format(p.value, s) + " · " + (p.value / total * 100).toFixed(0) + "%");
      a += sweep;
    });
    if (!pie) {
      var center = s.center != null ? s.center : C.format(total, s);
      var cs = Math.min(92, thick * 1.1 + 24), base = cy + cs * .18;
      x.anim(x.label(g, cx, base, center, { anchor: "middle", size: cs, weight: 800, fill: "var(--ink)", num: true }), "fade", { delay: 700 });
      if (s.centerLabel) x.anim(x.label(g, cx, base + cs * .42 + x.fs, s.centerLabel, { anchor: "middle", size: x.fs, fill: "var(--ink-2)" }), "fade", { delay: 780 });
    }
    var lx = size + 56, rowH = Math.min(84, x.H / P.length), ly = (x.H - rowH * P.length) / 2;
    P.forEach(function (p, i) {
      var y = ly + rowH * i + rowH / 2, lg = h("g", null, g), hot = s.highlight == null || s.highlight === p.name;
      h("rect", { x: lx, y: y - 12, width: 24, height: 24, rx: 5, style: "fill:" + (hot ? x.color(i) : x.mute) }, lg);
      x.label(lg, lx + 40, y + 9, p.name, { fill: "var(--ink)", size: x.fs + 2 });
      x.label(lg, x.W, y + 10, (p.value / total * 100).toFixed(0) + "%", { anchor: "end", fill: "var(--ink)", weight: 700, size: x.fs + 6, num: true });
      x.anim(lg, "up", { delay: 300 + i * 110, dur: 520 });
    });
  }
  C.register("donut", function (x) { ring(x, false); });
  C.register("pie", function (x) { ring(x, true); });

  /* gauge: a bounded value against a domain */
  C.register("gauge", function (x) {
    var s = x.spec, v = s.value, max = s.max || 100, min = s.min || 0, cx = x.W / 2, r = Math.min(x.W / 2 - 16, x.H * .78), cy = r + 20, thick = r * .17;
    var a0 = Math.PI, a1 = Math.PI * 2, av = a0 + (v - min) / (max - min) * Math.PI, g = h("g", null, x.svg);
    h("path", { d: arc(cx, cy, r - thick / 2, a0, a1), style: "fill:none;stroke:var(--bg-2);stroke-width:" + thick }, g);
    var m = h("path", { d: arc(cx, cy, r - thick / 2, a0, av), style: "fill:none;stroke:var(--c1);stroke-width:" + thick + ";stroke-linecap:butt" }, g);
    x.anim(m, "draw", { dur: 1300 });
    if (s.target != null) {
      var at = a0 + (s.target - min) / (max - min) * Math.PI, p0 = polar(cx, cy, r - thick - 8, at), p1 = polar(cx, cy, r + 8, at);
      h("line", { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], style: "stroke:var(--ink);stroke-width:5" }, g);
    }
    x.anim(x.label(g, cx, cy - 40, C.format(v, s), { anchor: "middle", size: Math.min(r * .42, 128), weight: 800, fill: "var(--ink)", num: true }), "fade", { delay: 500 });
    if (s.label) x.anim(x.label(g, cx, cy + 34, s.label, { anchor: "middle", size: x.fs + 2, fill: "var(--ink-2)" }), "fade", { delay: 600 });
  });

  /* radar: 4–8 axes, 1–3 entities */
  C.register("radar", function (x) {
    var s = x.spec, cats = s.categories || [], ss = s.series || [], n = cats.length;
    var top = x.legend(ss.map(function (a) { return a.name; }), ss.map(function (_, i) { return x.color(i); }));
    var cx = x.W / 2, cy = top + (x.H - top) / 2, r = Math.min(x.W * .34, (x.H - top) / 2 - 44), max = s.max || Math.max.apply(null, ss.map(function (a) { return Math.max.apply(null, a.values); })), g = h("g", null, x.svg);
    function pt(i, v) { return polar(cx, cy, r * v / max, -Math.PI / 2 + i / n * Math.PI * 2); }
    [.25, .5, .75, 1].forEach(function (k) {
      h("polygon", { points: cats.map(function (_, i) { return pt(i, max * k).map(function (t) { return t.toFixed(1); }).join(","); }).join(" "), style: "fill:none;stroke:var(--line);stroke-width:1.5" }, g);
    });
    cats.forEach(function (c, i) {
      var e = pt(i, max), l = pt(i, max * 1.13), anchor = Math.abs(l[0] - cx) < 12 ? "middle" : l[0] > cx ? "start" : "end";
      h("line", { x1: cx, y1: cy, x2: e[0], y2: e[1], style: "stroke:var(--line);stroke-width:1.5" }, g);
      x.label(g, l[0], l[1] + 8, c, { anchor: anchor, fill: "var(--ink)", size: x.fs });
    });
    ss.forEach(function (a, k) {
      var col = x.color(k), P = a.values.map(function (v, i) { return pt(i, v).map(function (t) { return t.toFixed(1); }).join(","); }).join(" ");
      var poly = h("polygon", { points: P, style: "fill:" + col + ";fill-opacity:.16;stroke:" + col + ";stroke-width:5;stroke-linejoin:round" }, g);
      x.anim(poly, "pop", { delay: k * 220, dur: 900 });
    });
  });

  /* waffle: 100 cells of one whole */
  C.register("waffle", function (x) {
    var s = x.spec, P = s.parts || [], total = P.reduce(function (t, p) { return t + p.value; }, 0), cols = 10, rows = 10, cell = Math.min(x.H / rows, (x.W * .56) / cols), gap = cell * .14, g = h("g", null, x.svg), idx = 0;
    P.forEach(function (p, k) {
      var count = Math.round(p.value / total * 100);
      for (var i = 0; i < count && idx < 100; i++, idx++) {
        var c = Math.floor(idx / rows), r = rows - 1 - idx % rows;
        x.anim(h("rect", { x: c * cell, y: r * cell, width: cell - gap, height: cell - gap, rx: 3, style: "fill:" + (k === P.length - 1 && P.length > 1 ? x.mute : x.color(k)) }, g), "pop", { delay: idx * 9, dur: 300 });
      }
    });
    var lx = cols * cell + 48, rowH = 96, ly = (x.H - rowH * P.length) / 2;
    P.forEach(function (p, k) {
      var y = ly + rowH * k + 56, lg = h("g", null, g);
      x.label(lg, lx, y, (p.value / total * 100).toFixed(0) + "%", { size: 60, weight: 800, fill: "var(--ink)", num: true });
      x.label(lg, lx + 150, y - 4, p.name, { size: x.fs + 2, fill: "var(--ink-2)" });
      x.anim(lg, "fade", { delay: 500 + k * 150 });
    });
  });

  /* spark: a tiny trend for KPI tiles, no axes */
  C.register("spark", function (x) {
    var v = x.spec.values || [], n = v.length, hi = Math.max.apply(null, v), lo = Math.min.apply(null, v);
    var xs = C.linear(0, n - 1, 4, x.W - 12), y = C.linear(lo, hi, x.H - 8, 10), pts = v.map(function (t, i) { return [xs(i), y(t)]; });
    var col = (x.spec.color || "currentColor");
    var p = h("path", { d: "M" + pts.map(function (t) { return t[0].toFixed(1) + " " + t[1].toFixed(1); }).join("L"), style: "fill:none;stroke:" + col + ";stroke-width:4;stroke-linecap:round;stroke-linejoin:round" }, x.svg);
    x.anim(p, "draw", { dur: 1200 });
    var e = pts[n - 1];
    var end = h("circle", { cx: e[0], cy: e[1], r: 7, style: "fill:" + col }, x.svg);
    x.anim(end, "pop", { delay: 900, dur: 300 });
    x.loops.push({ kind: "halo", el: end, color: col });
  });
})();
