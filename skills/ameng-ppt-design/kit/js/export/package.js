/* export/package.js — assembles the .pptx: theme (fonts + colors), slide master with
   real placeholders, slides, notes, charts, media. */
(function () {
  "use strict";
  var X = window.PptxXml, IR = window.PptxIR, esc = X.esc;
  var P = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  var HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
  var W = 12192000, H = 6858000;

  function rels(list) { return HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + list.map(function (r) { return '<Relationship Id="' + r[0] + '" Type="' + (/^http/.test(r[1]) ? r[1] : REL + r[1]) + '" Target="' + r[2] + '"/>'; }).join("") + "</Relationships>"; }

  function palette(stage) {
    var cs = getComputedStyle(stage);
    function hx(t) { var c = IR.color(cs.getPropertyValue(t).trim()); return c ? c.hex : "888888"; }
    return { dk1: hx("--ink"), lt1: hx("--bg"), dk2: hx("--ink-2"), lt2: hx("--bg-2"), a1: hx("--c1"), a2: hx("--c2"), a3: hx("--c3"), a4: hx("--c4"), a5: hx("--c5"), a6: hx("--c6"), hl: hx("--accent") };
  }
  function themeXml(name, p, major, minor) {
    function c(tag, v) { return "<a:" + tag + '><a:srgbClr val="' + v + '"/></a:' + tag + ">"; }
    var fmt = '<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="28575"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>';
    return HEAD + "<a:theme " + 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="' + esc(name) + '"><a:themeElements><a:clrScheme name="' + esc(name) + '">' + c("dk1", p.dk1) + c("lt1", p.lt1) + c("dk2", p.dk2) + c("lt2", p.lt2) + c("accent1", p.a1) + c("accent2", p.a2) + c("accent3", p.a3) + c("accent4", p.a4) + c("accent5", p.a5) + c("accent6", p.a6) + c("hlink", p.hl) + c("folHlink", p.a2) +
      '</a:clrScheme><a:fontScheme name="' + esc(name) + '"><a:majorFont><a:latin typeface="' + esc(major[0]) + '"/><a:ea typeface="' + esc(major[1]) + '"/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="' + esc(minor[0]) + '"/><a:ea typeface="' + esc(minor[1]) + '"/><a:cs typeface=""/></a:minorFont></a:fontScheme>' + fmt + "</a:themeElements></a:theme>";
  }
  function masterXml() {
    var title = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="标题"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="711200" y="939800"/><a:ext cx="10769600" cy="812800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN"/><a:t>单击编辑标题</a:t></a:r></a:p></p:txBody></p:sp>';
    var body = '<p:sp><p:nvSpPr><p:cNvPr id="3" name="正文"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="711200" y="1905000"/><a:ext cx="10769600" cy="4114800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="zh-CN"/><a:t>单击编辑正文</a:t></a:r></a:p></p:txBody></p:sp>';
    return HEAD + "<p:sldMaster " + P + '><p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' + title + body + '</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/><p:sldLayoutId id="2147483650" r:id="rId2"/></p:sldLayoutIdLst>' +
      '<p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="3600" b="1"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/><a:ea typeface="+mj-ea"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr marL="0" indent="0" algn="l"><a:buNone/><a:defRPr sz="1700"><a:solidFill><a:schemeClr val="tx2"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1700"><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/></a:defRPr></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>';
  }
  function layoutXml(name, withTitle) {
    var t = withTitle ? '<p:sp><p:nvSpPr><p:cNvPr id="2" name="标题"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN"/><a:t>单击编辑标题</a:t></a:r></a:p></p:txBody></p:sp>' : "";
    return HEAD + "<p:sldLayout " + P + ' type="' + (withTitle ? "titleOnly" : "blank") + '" preserve="1"><p:cSld name="' + esc(name) + '"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' + t + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
  }
  function notesMasterXml() {
    return HEAD + "<p:notesMaster " + P + '><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="幻灯片图像"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="备注"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN"/><a:t>备注</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:notesMaster>';
  }
  function notesXml(text) {
    var paras = text.split(/\n+/).map(function (t) { return '<a:p><a:r><a:rPr lang="zh-CN"/><a:t>' + esc(t) + "</a:t></a:r></a:p>"; }).join("");
    return HEAD + "<p:notes " + P + '><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="幻灯片图像"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="备注"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>' + paras + '</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';
  }

  function dataUrlBytes(url) {
    var m = url.match(/^data:([^;,]*)((?:;[^,]*)?),([\s\S]*)$/);
    if (!m) throw new Error("图片数据无法识别");
    var raw = /;base64/i.test(m[2]) ? atob(m[3]) : unescape(encodeURIComponent(decodeURIComponent(m[3]))), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return { mime: m[1] || "application/octet-stream", bytes: out };
  }
  function fetchBytes(src) {
    if (/^data:/.test(src)) return Promise.resolve(dataUrlBytes(src));
    return fetch(src).then(function (r) { return r.blob(); }).then(function (b) { return b.arrayBuffer().then(function (buf) { return { mime: b.type, bytes: new Uint8Array(buf) }; }); });
  }
  /* WebP, SVG and friends are not safe inside a PPTX: redraw them as PNG first */
  function toPng(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement("canvas");
        c.width = im.naturalWidth || 1600; c.height = im.naturalHeight || 900;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        try { res(dataUrlBytes(c.toDataURL("image/png"))); } catch (e) { rej(e); }
      };
      im.onerror = function () { rej(new Error("图片打不开：" + src.slice(0, 80))); };
      im.src = src;
    });
  }
  function embeddable(src) {
    return fetchBytes(src).then(function (f) { return /png|jpe?g|gif/i.test(f.mime) ? f : toPng(src); });
  }
  function collectImages(items, out) {
    items.forEach(function (i) { if (i.kind === "group") collectImages(i.items, out); else if (i.kind === "image") out.add(i.src); });
  }

  /* Deck-wide export. Slides must be laid out and animations finished by the caller. */
  function build(opts) {
    opts = opts || {};
    var stage = Deck.stage, slides = Deck.slides, mode = opts.fonts || "safe", name = (Deck.el.getAttribute("data-title") || document.title || "演示").trim();
    var csS = getComputedStyle(stage), pal = palette(stage);
    var major = X.fontsFor(csS.getPropertyValue("--f-display"), mode), minor = X.fontsFor(csS.getPropertyValue("--f-text"), mode);
    var scheme = {}; scheme[pal.dk1] = "tx1"; scheme[pal.lt1] = "bg1"; scheme[pal.dk2] = "tx2"; scheme[pal.lt2] = "bg2";
    [pal.a6, pal.a5, pal.a4, pal.a3, pal.a2, pal.a1].forEach(function (c, i) { scheme[c] = "accent" + (6 - i); });

    var irs = slides.map(function (s) { return PptxIR.slide(s, stage); });
    var srcs = new Set(); irs.forEach(function (ir) { collectImages(ir.items, srcs); });
    var zip = new JSZip(), mediaMap = {}, n = 0, chartParts = [];

    return Promise.all(Array.from(srcs).map(function (src) {
      return embeddable(src).then(function (f) {
        var ext = /png/.test(f.mime) ? "png" : /gif/.test(f.mime) ? "gif" : "jpg", file = "image" + (++n) + "." + ext;
        zip.file("ppt/media/" + file, f.bytes); mediaMap[src] = file;
      });
    })).then(function () {
      var slideTypes = [], presSlides = [], work = [];
      irs.forEach(function (ir, i) {
        var num = i + 1, sRels = [["rId1", "slideLayout", "../slideLayouts/slideLayout" + (hasTitle(ir.items) ? 1 : 2) + ".xml"]], rid = 2, local = {};
        var w = new X.Writer({
          fonts: mode, scheme: scheme, major: major, minor: minor,
          media: function (src) { if (!local[src]) { local[src] = "rId" + (rid++); sRels.push([local[src], "image", "../media/" + mediaMap[src]]); } return local[src]; },
          charts: function (it) {
            var c = chartParts.length + 1, r = "rId" + (rid++);
            chartParts.push(it); sRels.push([r, "chart", "../charts/chart" + c + ".xml"]);
            return r;
          }
        });
        var body = ir.items.map(function (it) { return w.item(it); }).join("");
        var next = irs[i + 1], prev = irs[i - 1];
        var kind = ir.transition || "fade";
        if (prev && ir.morphs.length && ir.morphs.some(function (m) { return prev.morphs.indexOf(m) >= 0; })) kind = "morph";
        var bg = '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + ir.bg.hex + '"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>';
        var xml = HEAD + "<p:sld " + P + (ir.hidden ? ' show="0"' : "") + "><p:cSld>" + bg + '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' + body + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>' + X.transition(kind) + X.timing(w.stepTargets) + "</p:sld>";
        zip.file("ppt/slides/slide" + num + ".xml", xml);
        if (ir.notes) {
          sRels.push(["rId" + (rid++), "notesSlide", "../notesSlides/notesSlide" + num + ".xml"]);
          zip.file("ppt/notesSlides/notesSlide" + num + ".xml", notesXml(ir.notes));
          zip.file("ppt/notesSlides/_rels/notesSlide" + num + ".xml.rels", rels([["rId1", "notesMaster", "../notesMasters/notesMaster1.xml"], ["rId2", "slide", "../slides/slide" + num + ".xml"]]));
          slideTypes.push('<Override PartName="/ppt/notesSlides/notesSlide' + num + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>');
        }
        zip.file("ppt/slides/_rels/slide" + num + ".xml.rels", rels(sRels));
        slideTypes.push('<Override PartName="/ppt/slides/slide' + num + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');
        presSlides.push('<p:sldId id="' + (256 + i) + '" r:id="rId' + (10 + i) + '"/>');
      });

      chartParts.forEach(function (it, i) {
        var c = i + 1;
        zip.file("ppt/charts/chart" + c + ".xml", PptxCharts.xml(it, mode));
        zip.file("ppt/charts/_rels/chart" + c + ".xml.rels", rels([["rId1", "package", "../embeddings/Microsoft_Excel_Sheet" + c + ".xlsx"]]));
        slideTypes.push('<Override PartName="/ppt/charts/chart' + c + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>');
        work.push(PptxCharts.workbook(PptxCharts.rows(it.spec)).then(function (bytes) { zip.file("ppt/embeddings/Microsoft_Excel_Sheet" + c + ".xlsx", bytes); }));
      });

      zip.file("[Content_Types].xml", HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/slideLayouts/slideLayout2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' + slideTypes.join("") + "</Types>");
      zip.file("_rels/.rels", rels([["rId1", "officeDocument", "ppt/presentation.xml"], ["rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"], ["rId3", "extended-properties", "docProps/app.xml"]]));
      var now = new Date().toISOString().replace(/\.\d+Z/, "Z");
      zip.file("docProps/core.xml", HEAD + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + esc(name) + "</dc:title><dc:creator>" + esc(Deck.el.getAttribute("data-brand") || "ameng-ppt-design") + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + "</dcterms:modified></cp:coreProperties>");
      zip.file("docProps/app.xml", HEAD + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office PowerPoint</Application><Slides>' + slides.length + "</Slides></Properties>");
      zip.file("ppt/presentation.xml", HEAD + "<p:presentation " + P + ' saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst>' + presSlides.join("") + '</p:sldIdLst><p:sldSz cx="' + W + '" cy="' + H + '"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>');
      var pr = [["rId1", "slideMaster", "slideMasters/slideMaster1.xml"], ["rId2", "notesMaster", "notesMasters/notesMaster1.xml"], ["rId3", "presProps", "presProps.xml"], ["rId4", "viewProps", "viewProps.xml"], ["rId5", "theme", "theme/theme1.xml"], ["rId6", "tableStyles", "tableStyles.xml"]];
      slides.forEach(function (_, i) { pr.push(["rId" + (10 + i), "slide", "slides/slide" + (i + 1) + ".xml"]); });
      zip.file("ppt/_rels/presentation.xml.rels", rels(pr));
      zip.file("ppt/presProps.xml", HEAD + "<p:presentationPr " + P + "/>");
      zip.file("ppt/viewProps.xml", HEAD + "<p:viewPr " + P + "/>");
      zip.file("ppt/tableStyles.xml", HEAD + '<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>');
      zip.file("ppt/theme/theme1.xml", themeXml(name, pal, major, minor));
      zip.file("ppt/theme/theme2.xml", themeXml("备注", pal, major, minor));
      zip.file("ppt/slideMasters/slideMaster1.xml", masterXml());
      zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"], ["rId2", "slideLayout", "../slideLayouts/slideLayout2.xml"], ["rId3", "theme", "../theme/theme1.xml"]]));
      zip.file("ppt/slideLayouts/slideLayout1.xml", layoutXml("标题页", true));
      zip.file("ppt/slideLayouts/slideLayout2.xml", layoutXml("空白", false));
      ["1", "2"].forEach(function (k) { zip.file("ppt/slideLayouts/_rels/slideLayout" + k + ".xml.rels", rels([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]])); });
      zip.file("ppt/notesMasters/notesMaster1.xml", notesMasterXml());
      zip.file("ppt/notesMasters/_rels/notesMaster1.xml.rels", rels([["rId1", "theme", "../theme/theme2.xml"]]));
      return Promise.all(work);
    }).then(function () { return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }); });
  }
  function hasTitle(items) { return items.some(function (i) { return i.ph || (i.kind === "group" && hasTitle(i.items)); }); }

  /* Make every slide measurable at its final frame, run, then put things back */
  function withFinalLayout(fn) {
    var stage = Deck.stage, saved = { i: Deck.index, step: Deck.step };
    Motion.finishAll();
    stage.classList.add("is-measuring");
    Deck.slides.forEach(function (s) { Motion.syncSteps(s, 99); });
    return Promise.resolve().then(fn).finally(function () {
      stage.classList.remove("is-measuring");
      Deck.activate(saved.i, saved.step);
    });
  }
  window.PptxPackage = {
    build: function (opts) { return withFinalLayout(function () { return build(opts); }); },
    base64: function (opts) {
      return this.build(opts).then(function (u8) {
        var s = "", step = 0x8000;
        for (var i = 0; i < u8.length; i += step) s += String.fromCharCode.apply(null, u8.subarray(i, i + step));
        return btoa(s);
      });
    }
  };
})();
