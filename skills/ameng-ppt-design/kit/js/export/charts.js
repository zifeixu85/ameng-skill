/* export/charts.js — native PowerPoint charts with an embedded workbook, so
   "Edit Data" works and every number stays a number. Styled from the same theme
   tokens as the web chart. */
(function () {
  "use strict";
  var X = window.PptxXml, esc = X.esc;
  var NS = 'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  function col(n) { var s = ""; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
  function strCache(list) { return '<c:strCache><c:ptCount val="' + list.length + '"/>' + list.map(function (v, i) { return '<c:pt idx="' + i + '"><c:v>' + esc(v) + "</c:v></c:pt>"; }).join("") + "</c:strCache>"; }
  function numCache(list, fmt) { return "<c:numCache><c:formatCode>" + esc(fmt || "General") + '</c:formatCode><c:ptCount val="' + list.length + '"/>' + list.map(function (v, i) { return v == null ? "" : '<c:pt idx="' + i + '"><c:v>' + v + "</c:v></c:pt>"; }).join("") + "</c:numCache>"; }
  function solid(hex, a) { return '<a:solidFill><a:srgbClr val="' + hex + '">' + (a != null && a < 1 ? '<a:alpha val="' + Math.round(a * 100000) + '"/>' : "") + "</a:srgbClr></a:solidFill>"; }
  function txPr(hex, size, bold, fonts) {
    return '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="' + Math.round(size * 100) + '" b="' + (bold ? 1 : 0) + '">' + solid(hex) + '<a:latin typeface="' + esc(fonts[0]) + '"/><a:ea typeface="' + esc(fonts[1]) + '"/></a:defRPr></a:pPr><a:endParaRPr lang="zh-CN"/></a:p></c:txPr>';
  }
  function fmtCode(spec) {
    var dec = spec.decimals != null ? spec.decimals : 0, base = dec ? "#,##0." + "0".repeat(dec) : "#,##0";
    return (spec.prefix ? '"' + spec.prefix + '"' : "") + base + (spec.unit ? '"' + spec.unit + '"' : "");
  }
  function tick(fonts, t, size) { return txPr(t["--ink-3"], size, false, fonts); }
  function palette(t) { return ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"].map(function (k) { return t[k]; }); }

  function catAx(id, cross, pos, t, fonts, o) {
    o = o || {};
    return '<c:catAx><c:axId val="' + id + '"/><c:scaling><c:orientation val="' + (o.reverse ? "maxMin" : "minMax") + '"/></c:scaling><c:delete val="0"/><c:axPos val="' + pos + '"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>' +
      '<c:spPr><a:ln w="19050">' + solid(t["--line-2"]) + "</a:ln></c:spPr>" + txPr(o.ink || t["--ink-2"], o.size || 13, false, fonts) + '<c:crossAx val="' + cross + '"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>';
  }
  function valAx(id, cross, pos, t, fonts, o) {
    o = o || {};
    var scale = '<c:scaling><c:orientation val="minMax"/>' + (o.max != null ? '<c:max val="' + o.max + '"/>' : "") + (o.min != null ? '<c:min val="' + o.min + '"/>' : "") + "</c:scaling>";
    var unit = o.unit ? '<c:majorUnit val="' + o.unit + '"/>' : "";
    return '<c:valAx><c:axId val="' + id + '"/>' + scale + '<c:delete val="' + (o.hide ? 1 : 0) + '"/><c:axPos val="' + pos + '"/>' + (o.grid === false ? "" : '<c:majorGridlines><c:spPr><a:ln w="9525">' + solid(t["--line"]) + "</a:ln></c:spPr></c:majorGridlines>") +
      '<c:numFmt formatCode="' + esc(o.fmt || "General") + '" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>' + tick(fonts, t, 12) + '<c:crossAx val="' + cross + '"/><c:crosses val="' + (o.crosses || "autoZero") + '"/><c:crossBetween val="' + (o.between || "between") + '"/>' + unit + "</c:valAx>";
  }
  function labels(t, fonts, pos, fmt, size) {
    return "<c:dLbls>" + '<c:numFmt formatCode="' + esc(fmt) + '" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>' + txPr(t["--ink"], size || 15, true, fonts) + (pos ? '<c:dLblPos val="' + pos + '"/>' : "") + '<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>';
  }
  function noLabels() { return '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'; }
  function refs(i, rowsN, cats, values, name, fmt) {
    var c = col(i + 1);
    return {
      tx: "<c:tx><c:strRef><c:f>Sheet1!$" + c + "$1</c:f>" + strCache([name]) + "</c:strRef></c:tx>",
      cat: "<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$" + (rowsN + 1) + "</c:f>" + strCache(cats) + "</c:strRef></c:cat>",
      val: "<c:val><c:numRef><c:f>Sheet1!$" + c + "$2:$" + c + "$" + (rowsN + 1) + "</c:f>" + numCache(values, fmt) + "</c:numRef></c:val>"
    };
  }
  function seriesOf(s) { return s.series || [{ name: s.name || "数值", values: s.values || [] }]; }
  function hotAt(s, cat) { return s.highlight == null || s.highlight === cat || (Array.isArray(s.highlight) && s.highlight.indexOf(cat) >= 0); }

  function barXml(it, fonts) {
    var s = it.spec, t = it.tokens, cats = s.categories, ss = seriesOf(s), P = palette(t), horiz = s.type === "hbar", n = cats.length, fmt = fmtCode(s);
    var labelMode = s.labels || (ss.length === 1 ? "all" : "none");
    var sers = ss.map(function (a, i) {
      var r = refs(i, n, cats, a.values, a.name, fmt), base = ss.length === 1 ? P[0] : P[i % 6], dpts = "";
      if (ss.length === 1 && s.highlight != null) cats.forEach(function (c, k) { if (!hotAt(s, c)) dpts += '<c:dPt><c:idx val="' + k + '"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/><c:spPr>' + solid(t["--chart-mute"]) + "</c:spPr></c:dPt>"; });
      return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + r.tx + "<c:spPr>" + solid(base) + '</c:spPr><c:invertIfNegative val="0"/>' + dpts + (labelMode === "all" ? labels(t, fonts, s.stacked ? "ctr" : "outEnd", fmt) : noLabels()) + r.cat + r.val + "</c:ser>";
    }).join("");
    var hi = Math.max(0, Math.max.apply(null, ss.map(function (a) { return Math.max.apply(null, a.values.filter(isFinite)); })));
    var lo = Math.min(0, Math.min.apply(null, ss.map(function (a) { return Math.min.apply(null, a.values.filter(isFinite)); })));
    var plot = '<c:barChart><c:barDir val="' + (horiz ? "bar" : "col") + '"/><c:grouping val="' + (s.stacked ? "stacked" : "clustered") + '"/><c:varyColors val="0"/>' + sers + '<c:gapWidth val="' + (horiz ? 100 : 90) + '"/>' + (s.stacked ? '<c:overlap val="100"/>' : ss.length > 1 ? '<c:overlap val="-6"/>' : "") + '<c:axId val="111"/><c:axId val="222"/></c:barChart>';
    var totals = cats.map(function (_, k) { return ss.reduce(function (a, b) { return a + (b.values[k] || 0); }, 0); });
    var tk = Charts.ticks(s.stacked ? 0 : lo, Math.max(s.stacked ? Math.max.apply(null, totals) : hi, 0), 4), axis = labelMode !== "all";
    var top = hi > 0 ? +(hi * 1.14).toFixed(2) : 1;
    return plot + catAx(111, 222, horiz ? "l" : "b", t, fonts, { reverse: horiz, ink: t["--ink"], size: 14 }) + valAx(222, 111, horiz ? "t" : "l", t, fonts, { hide: !axis, grid: axis, fmt: fmt, min: axis ? tk[0] : (lo < 0 ? +(lo * 1.14).toFixed(2) : 0), max: axis ? tk[tk.length - 1] : top, unit: axis ? tk[1] - tk[0] : null });
  }
  function lineXml(it, fonts) {
    var s = it.spec, t = it.tokens, cats = s.categories, ss = seriesOf(s), P = palette(t), n = cats.length, fmt = fmtCode(s), area = s.type === "area";
    var sers = ss.map(function (a, i) {
      var r = refs(i, n, cats, a.values, a.name, fmt), c = s.highlight != null && s.highlight !== a.name ? t["--chart-mute"] : P[i % 6];
      var last = '<c:dLbls><c:dLbl><c:idx val="' + (n - 1) + '"/><c:spPr><a:noFill/></c:spPr>' + txPr(t["--ink"], 13, true, fonts) + '<c:dLblPos val="r"/><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="1"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbl><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>';
      var mark = '<c:marker><c:symbol val="none"/></c:marker><c:dPt><c:idx val="' + (n - 1) + '"/><c:marker><c:symbol val="circle"/><c:size val="9"/><c:spPr>' + solid(c) + '<a:ln w="19050">' + solid(t["--bg"]) + '</a:ln></c:spPr></c:marker><c:bubble3D val="0"/><c:spPr><a:ln w="31750" cap="rnd">' + solid(c) + "<a:round/></a:ln></c:spPr></c:dPt>";
      if (area) return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + r.tx + "<c:spPr>" + solid(c, s.stacked ? .86 : .22) + '<a:ln w="31750">' + solid(c) + "</a:ln></c:spPr>" + r.cat + r.val + "</c:ser>";
      return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + r.tx + '<c:spPr><a:ln w="31750" cap="rnd">' + solid(c) + "<a:round/></a:ln></c:spPr>" + mark + last + r.cat + r.val + '<c:smooth val="' + (s.smooth === false ? 0 : 1) + '"/></c:ser>';
    }).join("");
    var plot = area
      ? '<c:areaChart><c:grouping val="' + (s.stacked ? "stacked" : "standard") + '"/><c:varyColors val="0"/>' + sers + '<c:axId val="111"/><c:axId val="222"/></c:areaChart>'
      : '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' + sers + '<c:marker val="1"/><c:axId val="111"/><c:axId val="222"/></c:lineChart>';
    var flat = [].concat.apply([], ss.map(function (a) { return a.values; })).filter(function (v) { return v != null; });
    var tk = Charts.ticks(s.zero === false ? Math.min.apply(null, flat) : 0, Math.max.apply(null, flat), 4);
    return plot + catAx(111, 222, "b", t, fonts, { size: 12, ink: t["--ink-3"] }) + valAx(222, 111, "l", t, fonts, { fmt: fmt, between: "midCat", min: tk[0], max: tk[tk.length - 1], unit: tk[1] - tk[0] });
  }
  function ringXml(it, fonts) {
    var s = it.spec, t = it.tokens, P = palette(t), parts = s.parts || s.categories.map(function (c, i) { return { name: c, value: s.series[0].values[i] }; });
    var cats = parts.map(function (p) { return p.name; }), vals = parts.map(function (p) { return p.value; }), n = cats.length, r = refs(0, n, cats, vals, s.name || "数值", fmtCode(s));
    var dpts = parts.map(function (p, i) { var c = s.highlight != null && s.highlight !== p.name ? t["--chart-mute"] : P[i % 6]; return '<c:dPt><c:idx val="' + i + '"/><c:bubble3D val="0"/><c:spPr>' + solid(c) + '<a:ln w="19050">' + solid(t["--bg"]) + "</a:ln></c:spPr></c:dPt>"; }).join("");
    var ser = '<c:ser><c:idx val="0"/><c:order val="0"/>' + r.tx + dpts + noLabels() + r.cat + r.val + "</c:ser>";
    if (s.type === "pie") return '<c:pieChart><c:varyColors val="1"/>' + ser + '<c:firstSliceAng val="0"/></c:pieChart>';
    return '<c:doughnutChart><c:varyColors val="1"/>' + ser + '<c:firstSliceAng val="0"/><c:holeSize val="70"/></c:doughnutChart>';
  }
  function radarXml(it, fonts) {
    var s = it.spec, t = it.tokens, cats = s.categories, ss = s.series, P = palette(t), n = cats.length;
    var sers = ss.map(function (a, i) {
      var r = refs(i, n, cats, a.values, a.name, "General"), c = P[i % 6];
      return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + r.tx + "<c:spPr>" + solid(c, .18) + '<a:ln w="31750">' + solid(c) + '</a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>' + r.cat + r.val + "</c:ser>";
    }).join("");
    return '<c:radarChart><c:radarStyle val="filled"/><c:varyColors val="0"/>' + sers + '<c:axId val="111"/><c:axId val="222"/></c:radarChart>' + catAx(111, 222, "b", t, fonts, { ink: t["--ink"], size: 13 }) + valAx(222, 111, "l", t, fonts, { hide: true, between: "between", min: 0, max: s.max });
  }
  function pointsXml(it, fonts) {
    var s = it.spec, t = it.tokens, P = palette(t), pts = s.points || [], bubble = s.type === "bubble", groups = {};
    pts.forEach(function (p) { var g = p.group || 0; (groups[g] = groups[g] || []).push(p); });
    var row = 2, sers = Object.keys(groups).map(function (g, i) {
      var list = groups[g], a = row, b = row + list.length - 1; row = b + 1;
      var xs = list.map(function (p) { return p.x; }), ys = list.map(function (p) { return p.y; }), rs = list.map(function (p) { return p.r || 1; }), c = P[i % 6];
      var names = list.map(function (p, k) {
        if (!p.name || p.label === false || !(bubble || s.labels === "all" || s.highlight === p.name)) return "";
        return '<c:dLbl><c:idx val="' + k + '"/><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:rPr lang="zh-CN" sz="1300">' + solid(t["--ink"]) + "</a:rPr><a:t>" + esc(p.name) + '</a:t></a:r></a:p></c:rich></c:tx><c:dLblPos val="r"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbl>';
      }).join("");
      var dpts = s.highlight == null ? "" : list.map(function (p, k) {
        if (p.name === s.highlight) return "";
        if (bubble) return '<c:dPt><c:idx val="' + k + '"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/><c:spPr>' + solid(t["--chart-mute"]) + "</c:spPr></c:dPt>";
        return '<c:dPt><c:idx val="' + k + '"/><c:marker><c:symbol val="circle"/><c:size val="12"/><c:spPr>' + solid(t["--chart-mute"]) + '</c:spPr></c:marker><c:bubble3D val="0"/></c:dPt>';
      }).join("");
      var lbl = dpts + "<c:dLbls>" + names + '<c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>';
      var tx = "<c:tx><c:v>" + esc(s.name || "数据") + "</c:v></c:tx>";
      var xv = "<c:xVal><c:numRef><c:f>Sheet1!$B$" + a + ":$B$" + b + "</c:f>" + numCache(xs) + "</c:numRef></c:xVal>", yv = "<c:yVal><c:numRef><c:f>Sheet1!$C$" + a + ":$C$" + b + "</c:f>" + numCache(ys) + "</c:numRef></c:yVal>";
      if (bubble) return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + tx + "<c:spPr>" + solid(c, .82) + '</c:spPr><c:invertIfNegative val="0"/>' + lbl + xv + yv + "<c:bubbleSize><c:numRef><c:f>Sheet1!$D$" + a + ":$D$" + b + "</c:f>" + numCache(rs) + '</c:numRef></c:bubbleSize><c:bubble3D val="0"/></c:ser>';
      return '<c:ser><c:idx val="' + i + '"/><c:order val="' + i + '"/>' + tx + '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="12"/><c:spPr>' + solid(c) + "</c:spPr></c:marker>" + lbl + xv + yv + '<c:smooth val="0"/></c:ser>';
    }).join("");
    var plot = bubble
      ? '<c:bubbleChart><c:varyColors val="0"/>' + sers + '<c:bubbleScale val="70"/><c:showNegBubbles val="0"/><c:axId val="111"/><c:axId val="222"/></c:bubbleChart>'
      : '<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>' + sers + '<c:axId val="111"/><c:axId val="222"/></c:scatterChart>';
    var room = bubble ? 1.18 : 1.02;
    var tx = Charts.ticks(Math.min.apply(null, pts.map(function (p) { return p.x; }).concat(s.zero === false ? [] : [0])), Math.max.apply(null, pts.map(function (p) { return p.x; })) * room, 5);
    var ty = Charts.ticks(Math.min.apply(null, pts.map(function (p) { return p.y; }).concat(s.zero === false ? [] : [0])), Math.max.apply(null, pts.map(function (p) { return p.y; })) * room, 4);
    return plot + valAx(111, 222, "b", t, fonts, { between: "midCat", grid: false, min: tx[0], max: tx[tx.length - 1], unit: tx[1] - tx[0] }) + valAx(222, 111, "l", t, fonts, { between: "midCat", min: ty[0], max: ty[ty.length - 1], unit: ty[1] - ty[0] });
  }

  function chartXml(it, mode) {
    var fonts = X.fontsFor(it.family, mode), s = it.spec, body;
    if (s.type === "bar" || s.type === "hbar") body = barXml(it, fonts);
    else if (s.type === "line" || s.type === "area") body = lineXml(it, fonts);
    else if (s.type === "donut" || s.type === "pie") body = ringXml(it, fonts);
    else if (s.type === "radar") body = radarXml(it, fonts);
    else body = pointsXml(it, fonts);
    var multi = (s.series || []).length > 1, legend = ((s.type === "bar" && multi) || s.type === "radar" || (s.type === "area" && multi))
      ? '<c:legend><c:legendPos val="t"/><c:overlay val="0"/>' + txPr(it.tokens["--ink-2"], 13, false, fonts) + "</c:legend>" : "";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace ' + NS + '><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart><c:autoTitleDeleted val="1"/><c:plotArea>' + (s.type === "line" ? '<c:layout><c:manualLayout><c:layoutTarget val="inner"/><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.07"/><c:y val="0.04"/><c:w val="0.8"/><c:h val="0.84"/></c:manualLayout></c:layout>' : "<c:layout/>") + body + "</c:plotArea>" + legend + '<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>' + txPr(it.tokens["--ink-2"], 13, false, fonts) + '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>';
  }

  /* the sheet behind "Edit Data" */
  function sheetRows(s) {
    if (s.type === "scatter" || s.type === "bubble") {
      var rows = [["名称", "X", "Y"].concat(s.type === "bubble" ? ["大小"] : [])], g = {};
      (s.points || []).forEach(function (p) { (g[p.group || 0] = g[p.group || 0] || []).push(p); });
      Object.keys(g).forEach(function (k) { g[k].forEach(function (p) { rows.push([p.name || "", p.x, p.y].concat(s.type === "bubble" ? [p.r || 1] : [])); }); });
      return rows;
    }
    if (s.type === "donut" || s.type === "pie") {
      var P = s.parts || s.categories.map(function (c, i) { return { name: c, value: s.series[0].values[i] }; });
      return [["", s.name || "数值"]].concat(P.map(function (p) { return [p.name, p.value]; }));
    }
    var ss = seriesOf(s);
    return [[""].concat(ss.map(function (a) { return a.name; }))].concat(s.categories.map(function (c, i) { return [c].concat(ss.map(function (a) { return a.values[i]; })); }));
  }
  function workbook(rows) {
    var z = new JSZip();
    z.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    z.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    z.file("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>');
    z.file("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    var body = rows.map(function (r, i) {
      return '<row r="' + (i + 1) + '">' + r.map(function (v, j) {
        var ref = col(j) + (i + 1);
        if (v == null || v === "") return "";
        return typeof v === "number" ? '<c r="' + ref + '"><v>' + v + "</v></c>" : '<c r="' + ref + '" t="inlineStr"><is><t>' + esc(v) + "</t></is></c>";
      }).join("") + "</row>";
    }).join("");
    z.file("xl/worksheets/sheet1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + body + "</sheetData></worksheet>");
    return z.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  }
  window.PptxCharts = { xml: chartXml, rows: sheetRows, workbook: workbook };
})();
