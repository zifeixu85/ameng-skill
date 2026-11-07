/* charts/flow.js — funnel, heatmap, treemap, sankey, gantt. These have no classic
   PowerPoint chart equivalent, so they export as grouped editable shapes. */
(function () {
  "use strict";
  var C = window.Charts, h = C.h;

  /* funnel: stages:[{name,value}]; widths are true to the data */
  C.register("funnel", function (x) {
    var s = x.spec, S = s.stages || [], first = S[0].value, labelW = Math.min(x.W * .3, 300), area = x.W - labelW - 170, row = x.H / S.length, thick = row * .74, g = h("g", null, x.svg), cx = labelW + area / 2;
    S.forEach(function (st, i) {
      var w = area * st.value / first, nw = S[i + 1] ? area * S[i + 1].value / first : w * .9, y = row * i + (row - thick) / 2;
      var col = s.highlight != null && s.highlight !== st.name ? x.mute : x.color(0);
      var op = s.highlight != null ? 1 : 1 - i * .13;
      var m = h("path", { d: "M" + (cx - w / 2) + " " + y + "H" + (cx + w / 2) + "L" + (cx + nw / 2) + " " + (y + thick) + "H" + (cx - nw / 2) + "Z", style: "fill:" + col + ";fill-opacity:" + op }, g);
      x.anim(m, "up", { delay: i * 130, dur: 640 });
      x.label(g, 0, y + thick / 2 + 9, st.name, { fill: "var(--ink)", size: x.fs + 2 });
      x.anim(x.label(g, x.W, y + thick / 2 + 10, C.format(st.value, s), { anchor: "end", weight: 700, size: x.fs + 8, fill: "var(--ink)", num: true }), "fade", { delay: 340 + i * 130 });
      if (S[i + 1]) x.anim(x.label(g, cx, y + thick + (row - thick) / 2 + 9, "↓ " + (S[i + 1].value / st.value * 100).toFixed(0) + "%", { anchor: "middle", size: x.fs - 3, fill: "var(--ink-3)" }), "fade", { delay: 460 + i * 130 });
      x.tip(m, "<b>" + st.name + "</b>" + C.format(st.value, s) + " · 占首层 " + (st.value / first * 100).toFixed(0) + "%");
    });
  });

  /* heatmap: rows × cols with one sequential hue */
  C.register("heatmap", function (x) {
    var s = x.spec, R = s.rows || [], K = s.cols || [], V = s.values || [], flat = [].concat.apply([], V), hi = Math.max.apply(null, flat), lo = Math.min.apply(null, flat);
    var labelW = Math.max.apply(null, R.map(function (r) { return C.textWidth(r, x.fs); })) + 24, top = 44, cw = (x.W - labelW) / K.length, ch = (x.H - top) / R.length, g = h("g", null, x.svg);
    K.forEach(function (k, j) { x.label(g, labelW + cw * j + cw / 2, 28, k, { anchor: "middle", size: x.fs - 2, fill: "var(--ink-3)" }); });
    R.forEach(function (r, i) {
      x.label(g, 0, top + ch * i + ch / 2 + 8, r, { fill: "var(--ink)", size: x.fs });
      K.forEach(function (k, j) {
        var v = V[i][j], t = (v - lo) / ((hi - lo) || 1);
        var c = h("rect", { x: labelW + cw * j + 2, y: top + ch * i + 2, width: cw - 4, height: ch - 4, rx: 4, style: "fill:color-mix(in oklab,var(--fill) " + Math.round(8 + t * 92) + "%,var(--bg))" }, g);
        x.anim(c, "fade", { delay: (i + j) * 34, dur: 420 });
        x.tip(c, "<b>" + r + " · " + k + "</b>" + C.format(v, s));
        if (s.labels !== "none" && cw > 70) x.anim(x.label(g, labelW + cw * j + cw / 2, top + ch * i + ch / 2 + 8, C.format(v, s), { anchor: "middle", size: x.fs + 2, weight: 600, fill: C.textOn(c, t > .5), num: true }), "fade", { delay: 200 + (i + j) * 34 });
      });
    });
  });

  /* squarified treemap */
  function squarify(items, x0, y0, w, ht) {
    var out = [], total = items.reduce(function (t, i) { return t + i.value; }, 0), k = w * ht / total, rest = items.slice().sort(function (a, b) { return b.value - a.value; });
    function worst(row, side) {
      var sum = row.reduce(function (t, r) { return t + r.a; }, 0), mx = Math.max.apply(null, row.map(function (r) { return r.a; })), mn = Math.min.apply(null, row.map(function (r) { return r.a; }));
      return Math.max(side * side * mx / (sum * sum), sum * sum / (side * side * mn));
    }
    var row = [];
    while (rest.length) {
      var side = Math.min(w, ht), it = { item: rest[0], a: rest[0].value * k };
      if (!row.length || worst(row.concat(it), side) <= worst(row, side)) { row.push(it); rest.shift(); continue; }
      lay();
    }
    if (row.length) lay();
    function lay() {
      var sum = row.reduce(function (t, r) { return t + r.a; }, 0), horiz = w >= ht, thick = sum / (horiz ? ht : w), pos = horiz ? y0 : x0;
      row.forEach(function (r) {
        var len = r.a / thick;
        out.push(horiz ? { item: r.item, x: x0, y: pos, w: thick, h: len } : { item: r.item, x: pos, y: y0, w: len, h: thick });
        pos += len;
      });
      if (horiz) { x0 += thick; w -= thick; } else { y0 += thick; ht -= thick; }
      row = [];
    }
    return out;
  }
  C.register("treemap", function (x) {
    var s = x.spec, I = s.items || [], g = h("g", null, x.svg), total = I.reduce(function (t, i) { return t + i.value; }, 0);
    squarify(I, 0, 0, x.W, x.H).forEach(function (b, i) {
      var hot = s.highlight == null ? i === 0 : s.highlight === b.item.name;
      var m = h("rect", { x: b.x + 3, y: b.y + 3, width: b.w - 6, height: b.h - 6, rx: 6, style: "fill:" + (hot ? "var(--fill)" : "var(--chart-tile)") }, g);
      x.anim(m, "pop", { delay: i * 70, dur: 620 });
      x.tip(m, "<b>" + b.item.name + "</b>" + C.format(b.item.value, s) + " · " + (b.item.value / total * 100).toFixed(0) + "%");
      if (b.w > 150 && b.h > 92) {
        var col = hot ? "var(--on-fill)" : "var(--ink)";
        x.anim(x.label(g, b.x + 24, b.y + 46, b.item.name, { fill: col, size: x.fs + 2, weight: 600 }), "fade", { delay: 240 + i * 70 });
        x.anim(x.label(g, b.x + 24, b.y + 88, (b.item.value / total * 100).toFixed(0) + "%", { fill: col, size: x.fs + 8, weight: 700, num: true }), "fade", { delay: 300 + i * 70 });
      }
    });
  });

  /* sankey: nodes grouped in columns by longest path from a source */
  C.register("sankey", function (x) {
    var s = x.spec, links = s.links || [], names = [], depth = {};
    links.forEach(function (l) { [l.from, l.to].forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); }); });
    names.forEach(function (n) { depth[n] = 0; });
    for (var pass = 0; pass < names.length; pass++) links.forEach(function (l) { depth[l.to] = Math.max(depth[l.to], depth[l.from] + 1); });
    var cols = Math.max.apply(null, names.map(function (n) { return depth[n]; })) + 1, nodeW = 28, labelPad = 260, usable = x.W - labelPad - nodeW;
    var val = {}, inV = {}, outV = {};
    names.forEach(function (n) { inV[n] = 0; outV[n] = 0; });
    links.forEach(function (l) { outV[l.from] += l.value; inV[l.to] += l.value; });
    names.forEach(function (n) { val[n] = Math.max(inV[n], outV[n]); });
    var perCol = {}; names.forEach(function (n) { (perCol[depth[n]] = perCol[depth[n]] || []).push(n); });
    var gap = 26, k = Infinity;
    Object.keys(perCol).forEach(function (c) { var sum = perCol[c].reduce(function (t, n) { return t + val[n]; }, 0); k = Math.min(k, (x.H - gap * (perCol[c].length - 1)) / sum); });
    var pos = {};
    Object.keys(perCol).forEach(function (c) {
      var sum = perCol[c].reduce(function (t, n) { return t + val[n] * k; }, 0) + gap * (perCol[c].length - 1), y = (x.H - sum) / 2;
      perCol[c].forEach(function (n) { pos[n] = { x: (cols > 1 ? usable * c / (cols - 1) : 0), y: y, h: val[n] * k, oy: 0, iy: 0 }; y += val[n] * k + gap; });
    });
    var g = h("g", null, x.svg), hotName = s.highlight;
    links.forEach(function (l, i) {
      var a = pos[l.from], b = pos[l.to], t = l.value * k, x0 = a.x + nodeW, x1 = b.x, y0 = a.y + a.oy + t / 2, y1 = b.y + b.iy + t / 2, mid = (x0 + x1) / 2;
      a.oy += t; b.iy += t;
      var hot = hotName == null ? false : (l.from === hotName || l.to === hotName);
      var p = h("path", { d: "M" + x0 + " " + y0 + "C" + mid + " " + y0 + " " + mid + " " + y1 + " " + x1 + " " + y1, style: "fill:none;stroke:" + (hot ? "var(--c1)" : "var(--ink-3)") + ";stroke-opacity:" + (hot ? .62 : .24) + ";stroke-width:" + Math.max(2, t) }, g);
      x.anim(p, "draw", { delay: 240 + depth[l.from] * 360 + i * 30, dur: 900 });
      x.loops.push({ kind: "flow", el: p, width: Math.max(2, t), hot: hot });
      x.tip(p, "<b>" + l.from + " → " + l.to + "</b>" + C.format(l.value, s));
    });
    names.forEach(function (n) {
      var p = pos[n], hot = hotName === n, m = h("rect", { x: p.x, y: p.y, width: nodeW, height: Math.max(3, p.h), rx: 3, style: "fill:" + (hot ? "var(--c1)" : "var(--ink)") }, g);
      x.anim(m, "fade", { delay: depth[n] * 360, dur: 400 });
      var right = depth[n] === cols - 1, tx = right ? p.x + nodeW + 16 : p.x + nodeW + 16;
      var txt = n + "  " + C.format(val[n], s), ty = p.y + Math.max(p.h, 26) / 2 + 9, tw = C.textWidth(txt, x.fs, hot ? 700 : 400);
      if (!right) x.anim(h("rect", { x: tx - 10, y: ty - x.fs - 2, width: tw + 20, height: x.fs + 14, rx: 6, style: "fill:var(--bg)" }, g), "fade", { delay: 120 + depth[n] * 360 });
      x.anim(x.label(g, tx, ty, txt, { fill: "var(--ink)", size: x.fs, weight: hot ? 700 : 400 }), "fade", { delay: 120 + depth[n] * 360 });
    });
  });

  /* gantt: tasks:[{name,start,end,hot?}] in any numeric unit (weeks by default) */
  C.register("gantt", function (x) {
    var s = x.spec, T = s.tasks || [], lo = Math.min.apply(null, T.map(function (t) { return t.start; })), hi = Math.max.apply(null, T.map(function (t) { return t.end; }));
    var labelW = Math.max.apply(null, T.map(function (t) { return C.textWidth(t.name, x.fs + 2); })) + 32, top = 46, xs = C.linear(lo, hi, labelW, x.W), row = (x.H - top) / T.length, thick = Math.min(row * .54, 46), g = h("g", null, x.svg);
    for (var w = lo; w <= hi; w++) {
      h("line", { x1: xs(w), x2: xs(w), y1: top, y2: x.H, style: "stroke:var(--line);stroke-width:1.5" }, g);
      if (w < hi) x.label(g, xs(w) + 8, 28, (s.unit || "W") + (w + 1), { size: x.fs - 3, fill: "var(--ink-3)" });
    }
    T.forEach(function (t, i) {
      var y = top + row * i + row / 2;
      x.label(g, 0, y + 9, t.name, { fill: "var(--ink)", size: x.fs + 2 });
      var m = h("rect", { x: xs(t.start), y: y - thick / 2, width: xs(t.end) - xs(t.start), height: thick, rx: 6, style: "fill:" + (t.hot ? "var(--c1)" : "var(--ink-2)") }, g);
      x.anim(m, "growX", { delay: i * 110 });
    });
  });
})();
