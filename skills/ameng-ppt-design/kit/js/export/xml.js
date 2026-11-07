/* export/xml.js — drawing list → PresentationML. 1 stage px = 6350 EMU = 0.5pt. */
(function () {
  "use strict";
  var EMU = 6350;
  function emu(px) { return Math.round(px * EMU); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; })
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/g, "")
      .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "");  /* a lone surrogate is invalid XML */
  }

  /* CSS family → what PowerPoint should use.
     safe: fonts that ship with Office on Mac and Windows, so the file opens the same anywhere.
     design: the deck's own fonts; install kit/fonts-install first for an exact match. */
  var SAFE = {
    "Noto Sans SC": ["Arial", "Microsoft YaHei"], "Noto Serif SC": ["Georgia", "Songti SC"], "Newsreader": ["Georgia", "Songti SC"],
    "Instrument Serif": ["Georgia", "Songti SC"], "Archivo": ["Arial", "Microsoft YaHei"], "Instrument Sans": ["Arial", "Microsoft YaHei"],
    "Bricolage Grotesque": ["Arial", "Microsoft YaHei"], "Smiley Sans": ["Arial", "Microsoft YaHei"], "JetBrains Mono": ["Consolas", "Microsoft YaHei"], "Doto": ["Consolas", "Microsoft YaHei"]
  };
  var DESIGN = {
    "Noto Sans SC": ["Noto Sans SC", "Noto Sans SC"], "Noto Serif SC": ["Noto Serif SC", "Noto Serif SC"], "Newsreader": ["Newsreader", "Noto Serif SC"],
    "Instrument Serif": ["Instrument Serif", "Noto Serif SC"], "Archivo": ["Archivo", "Noto Sans SC"], "Instrument Sans": ["Instrument Sans", "Noto Sans SC"],
    "Bricolage Grotesque": ["Bricolage Grotesque", "Smiley Sans"], "Smiley Sans": ["Smiley Sans", "Smiley Sans"], "JetBrains Mono": ["JetBrains Mono", "Noto Sans SC"], "Doto": ["Doto", "Noto Sans SC"]
  };
  function fontsFor(css, mode) {
    var first = String(css || "").split(",")[0].replace(/["']/g, "").trim();
    var t = mode === "design" ? DESIGN : SAFE;
    if (t[first]) return t[first];
    if (mode === "design") return [first, first];
    /* a custom style's font: fall back by family type */
    var stack = String(css || "");
    if (/mono/i.test(stack)) return SAFE["JetBrains Mono"];
    if (/(^|[\s,"'])serif/i.test(stack.replace(/sans-serif/gi, "")) || /song|宋|serif sc/i.test(stack)) return SAFE["Noto Serif SC"];
    return SAFE["Noto Sans SC"];
  }

  /* Where PowerPoint puts the first baseline in a box with exact line spacing.
     Measured against real PowerPoint renders (see scripts/calibrate-pptx.mjs). */
  var BASE = { a: 0.8, b: 0 };
  function baselineOffset(L, S) { return BASE.a * L + BASE.b * S; }

  function Writer(opts) {
    this.mode = opts.fonts || "safe";
    this.scheme = opts.scheme || {};
    this.major = opts.major; this.minor = opts.minor;
    this.nextId = 2;
    this.media = opts.media; this.charts = opts.charts; this.rels = [];
    this.stepTargets = [];
  }
  Writer.prototype.id = function () { return this.nextId++; };
  Writer.prototype.color = function (c, extra) {
    var a = c.a != null && c.a < .995 ? '<a:alpha val="' + Math.round(c.a * 100000) + '"/>' : "";
    var s = this.scheme[c.hex];
    return s ? '<a:schemeClr val="' + s + '">' + a + (extra || "") + "</a:schemeClr>" : '<a:srgbClr val="' + c.hex + '">' + a + (extra || "") + "</a:srgbClr>";
  };
  Writer.prototype.solid = function (c) { return "<a:solidFill>" + this.color(c) + "</a:solidFill>"; };
  Writer.prototype.grad = function (g) {
    var stops = g.stops.map(function (s) { return '<a:gs pos="' + Math.round(s.p * 100000) + '">' + this.color({ hex: s.hex, a: s.a }) + "</a:gs>"; }, this).join("");
    if (g.tail) { var e = g.stops[g.stops.length - 1]; stops += '<a:gs pos="100000">' + this.color({ hex: e.hex, a: e.a }) + "</a:gs>"; }
    /* CSS 0deg points up and runs clockwise; DrawingML 0 points right */
    var lin = g.radial ? '<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>' : '<a:lin ang="' + Math.round(((g.angle - 90 + 360) % 360) * 60000) + '" scaled="0"/>';
    return '<a:gradFill rotWithShape="1"><a:gsLst>' + stops + "</a:gsLst>" + lin + "</a:gradFill>";
  };
  Writer.prototype.fill = function (f) {
    if (!f) return "<a:noFill/>";
    return f.type === "grad" ? this.grad(f) : this.solid(f.color);
  };
  Writer.prototype.line = function (l) {
    if (!l) return "<a:ln><a:noFill/></a:ln>";
    var cap = l.cap === "round" ? ' cap="rnd"' : "";
    return '<a:ln w="' + emu(l.w) + '"' + cap + ">" + this.solid(l.color) + (l.dash ? '<a:prstDash val="' + l.dash + '"/>' : "") + (l.join === "round" ? "<a:round/>" : "") + "</a:ln>";
  };
  Writer.prototype.shadow = function (s) {
    if (!s || !s.color) return "";
    var dist = Math.sqrt(s.x * s.x + s.y * s.y), dir = (Math.atan2(s.y, s.x) * 180 / Math.PI + 360) % 360;
    return '<a:effectLst><a:outerShdw blurRad="' + emu(s.blur) + '" dist="' + emu(dist) + '" dir="' + Math.round(dir * 60000) + '" algn="ctr" rotWithShape="0">' + this.color(s.color) + "</a:outerShdw></a:effectLst>";
  };

  function cornersPath(w, h, r) {
    var k = .5523, W = emu(w), H = emu(h), R = r.map(emu), p = "";
    function pt(x, y) { return '<a:pt x="' + Math.round(x) + '" y="' + Math.round(y) + '"/>'; }
    p += "<a:moveTo>" + pt(R[0], 0) + "</a:moveTo><a:lnTo>" + pt(W - R[1], 0) + "</a:lnTo>";
    if (R[1]) p += "<a:cubicBezTo>" + pt(W - R[1] * (1 - k), 0) + pt(W, R[1] * (1 - k)) + pt(W, R[1]) + "</a:cubicBezTo>";
    p += "<a:lnTo>" + pt(W, H - R[2]) + "</a:lnTo>";
    if (R[2]) p += "<a:cubicBezTo>" + pt(W, H - R[2] * (1 - k)) + pt(W - R[2] * (1 - k), H) + pt(W - R[2], H) + "</a:cubicBezTo>";
    p += "<a:lnTo>" + pt(R[3], H) + "</a:lnTo>";
    if (R[3]) p += "<a:cubicBezTo>" + pt(R[3] * (1 - k), H) + pt(0, H - R[3] * (1 - k)) + pt(0, H - R[3]) + "</a:cubicBezTo>";
    p += "<a:lnTo>" + pt(0, R[0]) + "</a:lnTo>";
    if (R[0]) p += "<a:cubicBezTo>" + pt(0, R[0] * (1 - k)) + pt(R[0] * (1 - k), 0) + pt(R[0], 0) + "</a:cubicBezTo>";
    return custom(W, H, p + "<a:close/>", false);
  }
  function custom(W, H, body, open) {
    return '<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="' + Math.max(1, W) + '" h="' + Math.max(1, H) + '"' + (open ? ' fill="none"' : "") + ">" + body + "</a:path></a:pathLst></a:custGeom>";
  }
  function pathGeom(item) {
    var ox = item.x, oy = item.y, body = "", closed = false;
    function pt(x, y) { return '<a:pt x="' + emu(x - ox) + '" y="' + emu(y - oy) + '"/>'; }
    item.geom.cmds.forEach(function (c) {
      if (c[0] === "M") body += "<a:moveTo>" + pt(c[1], c[2]) + "</a:moveTo>";
      else if (c[0] === "L") body += "<a:lnTo>" + pt(c[1], c[2]) + "</a:lnTo>";
      else if (c[0] === "C") body += "<a:cubicBezTo>" + pt(c[1], c[2]) + pt(c[3], c[4]) + pt(c[5], c[6]) + "</a:cubicBezTo>";
      else if (c[0] === "Z") { body += "<a:close/>"; closed = true; }
    });
    return custom(emu(item.w), emu(item.h), body, !closed && !item.fill);
  }
  function geometry(it) {
    var g = it.geom || { type: "rect" };
    if (g.type === "ellipse") return '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
    if (g.type === "round") return '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ' + g.adj + '"/></a:avLst></a:prstGeom>';
    if (g.type === "corners") return cornersPath(it.w, it.h, g.r);
    if (g.type === "path") return pathGeom(it);
    return '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
  }
  function xfrm(x, y, w, h, rot, tag) {
    return "<" + (tag || "a:xfrm") + (rot ? ' rot="' + Math.round(((rot % 360) + 360) % 360 * 60000) + '"' : "") + '><a:off x="' + emu(x) + '" y="' + emu(y) + '"/><a:ext cx="' + Math.max(1, emu(w)) + '" cy="' + Math.max(1, emu(h)) + '"/></' + (tag || "a:xfrm") + ">";
  }

  Writer.prototype.rPr = function (r, tag) {
    var f = fontsFor(r.family, this.mode), sz = Math.round((r.size > 0 ? r.size : 28) * 50);
    var attrs = ' lang="zh-CN" sz="' + sz + '" b="' + (r.weight >= 600 ? 1 : 0) + '" i="' + (r.italic ? 1 : 0) + '"' + (r.under ? ' u="heavy"' : r.underline ? ' u="sng"' : "") + (r.spacing ? ' spc="' + Math.round(r.spacing * 50) + '"' : "") + ' dirty="0"';
    var inner = "";
    if (r.outline && r.outline.color) inner += '<a:ln w="' + emu(r.outline.w) + '">' + this.solid(r.outline.color) + "</a:ln><a:noFill/>";
    else if (r.grad) inner += this.grad(r.grad);
    else if (r.color) inner += this.solid(r.color);
    if (r.mark) inner += "<a:highlight>" + this.color({ hex: r.mark.hex }) + "</a:highlight>";
    if (r.under) inner += "<a:uFill>" + this.solid(r.under) + "</a:uFill>";
    var latin = f[0] === this.major[0] ? "+mj-lt" : f[0] === this.minor[0] ? "+mn-lt" : f[0], ea = f[1] === this.major[1] ? "+mj-ea" : f[1] === this.minor[1] ? "+mn-ea" : f[1];
    inner += '<a:latin typeface="' + esc(latin) + '"/><a:ea typeface="' + esc(ea) + '"/><a:cs typeface="' + esc(latin) + '"/>';
    return "<" + (tag || "a:rPr") + attrs + ">" + inner + "</" + (tag || "a:rPr") + ">";
  };
  Writer.prototype.runs = function (runs, folio) {
    var out = "", self = this, first = runs.find(function (r) { return !r.br; }) || {};
    runs.forEach(function (r) {
      if (r.br) { out += "<a:br>" + self.rPr(first) + "</a:br>"; return; }
      if (folio) {
        var m = r.text.match(/^0*(\d+)(.*)$/);
        if (m) {
          out += '<a:fld id="{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}" type="slidenum">' + self.rPr(r) + "<a:t>" + m[1] + "</a:t></a:fld>";
          if (m[2]) out += "<a:r>" + self.rPr(r) + "<a:t>" + esc(m[2]) + "</a:t></a:r>";
          return;
        }
      }
      out += "<a:r>" + self.rPr(r) + "<a:t>" + esc(r.text) + "</a:t></a:r>";
    });
    return out;
  };
  Writer.prototype.para = function (it) {
    var sp = '<a:lnSpc><a:spcPts val="' + Math.round(it.lineHeight * 50) + '"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft>';
    return '<a:p><a:pPr algn="' + it.align + '">' + sp + '<a:buNone/></a:pPr>' + this.runs(it.runs, it.folio) + "</a:p>";
  };

  /* place a text box so its first baseline lands where the browser drew it */
  function placeText(it) {
    var h = it.lines * it.lineHeight;
    it.y = it.baseline - baselineOffset(it.lineHeight, it.size);
    it.h = h;
    if (it.wrap) it.w *= 1.015;
    return it;
  }

  Writer.prototype.text = function (it) {
    placeText(it);
    var id = this.id(), name = esc(it.name || "文本"), w = it.w, x = it.x, rot = it.rot || 0;
    if (!it.wrap) {
      /* no wrapping: the box hugs the line; centre/right alignment stays anchored */
      w = Math.max(w, 1);
    }
    var nv = it.ph
      ? '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr>'
      : '<p:cNvSpPr txBox="1"/><p:nvPr/>';
    var y = it.y;
    if (rot && it.rotBox) { y = it.rotBox.y + it.rotBox.h / 2 - it.h / 2; }
    this.note(id, it);
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + name + '"/>' + nv + "</p:nvSpPr><p:spPr>" + xfrm(x, y, w, it.h, rot) + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>' +
      '<p:txBody><a:bodyPr wrap="' + (it.wrap ? "square" : "none") + '" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:noAutofit/></a:bodyPr><a:lstStyle/>' + this.para(it) + "</p:txBody></p:sp>";
  };
  Writer.prototype.shape = function (it) {
    var id = this.id(), x = it.x, y = it.y, w = it.w, h = it.h;
    if (it.line && it.line.inset) { var d = it.line.w / 2; x += d; y += d; w -= it.line.w; h -= it.line.w; }
    if (it.line && it.line.outset) { var e = it.line.w / 2; x -= e; y -= e; w += it.line.w; h += it.line.w; }
    if (it.geom && it.geom.type === "path") { x = it.x; y = it.y; w = it.w; h = it.h; }
    this.note(id, it);
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + esc(it.name || "形状") + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>' + xfrm(x, y, w, h, it.rot) + geometry(Object.assign({}, it, { x: x, y: y, w: w, h: h })) + this.fill(it.fill) + this.line(it.line) + this.shadow(it.shadow) + "</p:spPr>" +
      '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="zh-CN"/></a:p></p:txBody></p:sp>';
  };
  Writer.prototype.image = function (it) {
    var id = this.id(), rid = this.media(it.src, this), crop = "";
    if (it.crop) { var c = it.crop; crop = '<a:srcRect l="' + Math.round(c.l * 100000) + '" t="' + Math.round(c.t * 100000) + '" r="' + Math.round(c.r * 100000) + '" b="' + Math.round(c.b * 100000) + '"/>'; }
    var alpha = it.alpha < .995 ? '<a:alphaModFix amt="' + Math.round(it.alpha * 100000) + '"/>' : "";
    this.note(id, it);
    return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="' + esc(it.name || "图片") + '" descr="' + esc(it.alt || "") + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
      '<p:blipFill><a:blip r:embed="' + rid + '">' + alpha + "</a:blip>" + crop + "<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>" + xfrm(it.x, it.y, it.w, it.h) + geometry(it) + "</p:spPr></p:pic>";
  };
  Writer.prototype.table = function (it) {
    var id = this.id(), self = this;
    var grid = it.cols.map(function (c) { return '<a:gridCol w="' + emu(c) + '"/>'; }).join("");
    var rows = it.rows.map(function (r) {
      var cells = r.cells.map(function (c) {
        if (c.hMerge || c.vMerge) return "<a:tc " + (c.hMerge ? 'hMerge="1"' : 'vMerge="1"') + '><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="zh-CN"/></a:p></a:txBody><a:tcPr/></a:tc>';
        var runs = c.runs.length ? c.runs : [{ text: " ", size: c.size, family: c.family, weight: 400 }];
        var para = '<a:p><a:pPr algn="' + c.align + '"/>' + self.runs(runs) + "</a:p>";
        var spanAttr = (c.span > 1 ? ' gridSpan="' + c.span + '"' : "") + (c.down > 1 ? ' rowSpan="' + c.down + '"' : "");
        var none = function (t) { return "<a:" + t + ' w="0"><a:noFill/></a:' + t + ">"; };
        var bottom = c.border && c.border.color ? '<a:lnB w="' + emu(c.border.w) + '" cap="flat" cmpd="sng" algn="ctr">' + self.solid(c.border.color) + "</a:lnB>" : none("lnB");
        return "<a:tc" + spanAttr + "><a:txBody><a:bodyPr/><a:lstStyle/>" + para + '</a:txBody><a:tcPr marL="' + emu(c.padL) + '" marR="' + emu(c.padR) + '" marT="0" marB="0" anchor="' + c.valign + '">' + none("lnL") + none("lnR") + none("lnT") + bottom + (c.fill ? self.solid(c.fill) : "<a:noFill/>") + "</a:tcPr></a:tc>";
      }).join("");
      return '<a:tr h="' + emu(r.h) + '">' + cells + "</a:tr>";
    }).join("");
    this.note(id, it);
    return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="' + esc(it.name) + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>' + xfrm(it.x, it.y, it.w, it.h, 0, "p:xfrm") +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1"/><a:tblGrid>' + grid + "</a:tblGrid>" + rows + "</a:tbl></a:graphicData></a:graphic></p:graphicFrame>";
  };
  Writer.prototype.chart = function (it) {
    var id = this.id(), rid = this.charts(it, this);
    this.note(id, it);
    return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="' + esc(it.name) + '" descr="' + esc(it.alt || "") + '"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>' + xfrm(it.x, it.y, it.w, it.h, 0, "p:xfrm") +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="' + rid + '"/></a:graphicData></a:graphic></p:graphicFrame>';
  };
  function extent(items) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    (function scan(list) {
      list.forEach(function (i) {
        if (i.kind === "group") return scan(i.items);
        if (i.kind === "text") placeText(Object.assign(i, { wrap: i.wrap, _p: i._p }));
        x0 = Math.min(x0, i.x); y0 = Math.min(y0, i.y); x1 = Math.max(x1, i.x + i.w); y1 = Math.max(y1, i.y + (i.h || 0));
      });
    })(items);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  Writer.prototype.group = function (it) {
    if (!it.items.length) return "";
    var id = this.id(), snapshot = JSON.parse(JSON.stringify(it.items)), b = extent(snapshot), self = this;
    this.note(id, it);
    var kids = it.items.map(function (k) { return self.item(k); }).join("");
    var o = '<a:off x="' + emu(b.x) + '" y="' + emu(b.y) + '"/><a:ext cx="' + Math.max(1, emu(b.w)) + '" cy="' + Math.max(1, emu(b.h)) + '"/>';
    return '<p:grpSp><p:nvGrpSpPr><p:cNvPr id="' + id + '" name="' + esc(it.name || "组") + '"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>' + o + '<a:chOff x="' + emu(b.x) + '" y="' + emu(b.y) + '"/><a:chExt cx="' + Math.max(1, emu(b.w)) + '" cy="' + Math.max(1, emu(b.h)) + '"/></a:xfrm></p:grpSpPr>' + kids + "</p:grpSp>";
  };
  Writer.prototype.item = function (it) { return this[it.kind](it); };
  /* remember which shape carries a click step, for the timing tree */
  Writer.prototype.note = function (id, it) { if (it.step) this.stepTargets.push({ id: id, step: it.step }); };

  /* click builds: fade in, grouped by step number */
  function timing(targets) {
    if (!targets.length) return "";
    var byStep = {}, n = 3;
    targets.forEach(function (t) { (byStep[t.step] = byStep[t.step] || []).push(t.id); });
    function cid() { return n++; }
    var clicks = Object.keys(byStep).map(Number).sort(function (a, b) { return a - b; }).map(function (s) {
      var outer = cid(), inner = cid();
      var effects = byStep[s].map(function (spid, i) {
        var e = cid(), a = cid(), b = cid();
        return '<p:par><p:cTn id="' + e + '" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="' + (i ? "withEffect" : "clickEffect") + '"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>' +
          '<p:set><p:cBhvr><p:cTn id="' + a + '" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="' + spid + '"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>' +
          '<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="' + b + '" dur="500"/><p:tgtEl><p:spTgt spid="' + spid + '"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>';
      }).join("");
      return '<p:par><p:cTn id="' + outer + '" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="' + inner + '" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>' + effects + "</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>";
    }).join("");
    return '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>' + clicks + '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>';
  }
  function transition(kind) {
    if (kind === "none") return "";
    if (kind === "morph") return '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>';
    if (kind === "push") return '<p:transition spd="med"><p:push dir="l"/></p:transition>';
    return '<p:transition spd="med"><p:fade/></p:transition>';
  }
  window.PptxXml = { Writer: Writer, esc: esc, emu: emu, fontsFor: fontsFor, timing: timing, transition: transition, calibrate: function (a, b) { BASE.a = a; BASE.b = b; } };
})();
