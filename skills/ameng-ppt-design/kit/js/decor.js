/* decor.js — each theme's signature layer. Real DOM/SVG (never pseudo-elements)
   so the exporter can turn it into native PowerPoint shapes. Everything injected
   here carries data-rt and is stripped when the deck is saved. */
(function () {
  "use strict";
  var AUTO_TONE = {
    noir:  { },
    paper: { section: "dark", closing: "accent" },
    swiss: { section: "accent", closing: "dark" },
    spec:  { section: "dark", closing: "dark", cover: "dark" },
    block: { cover: "accent", section: "accent", closing: "dark", quote: "dark" },
    board: { cover: "dark", section: "dark", closing: "dark" }
  };

  function fx(kind) { return '<canvas class="fx" data-fx="' + kind + '" data-rt></canvas>'; }
  function ticks(cx, cy, r, n, len, cls) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, c = Math.cos(a), d = Math.sin(a), l = i % 5 === 0 ? len * 1.9 : len;
      s += '<line x1="' + (cx + c * r).toFixed(1) + '" y1="' + (cy + d * r).toFixed(1) + '" x2="' + (cx + c * (r + l)).toFixed(1) + '" y2="' + (cy + d * (r + l)).toFixed(1) + '"' + (cls ? ' class="' + cls + '"' : "") + "/>";
    }
    return s;
  }
  function dial(x, y, size) {
    var c = size / 2;
    return '<svg class="dial" data-spin viewBox="0 0 ' + size + " " + size + '" style="position:absolute;left:' + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + 'px" fill="none" stroke="var(--ink)" stroke-width="2">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + (c - 40) + '"/><circle cx="' + c + '" cy="' + c + '" r="' + (c * .62) + '" stroke-dasharray="4 14"/>' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + (c * .36) + '" stroke="var(--accent)" stroke-width="6"/>' +
      ticks(c, c, c - 40, 60, 16) +
      '<line x1="' + c + '" y1="18" x2="' + c + '" y2="' + (size - 18) + '" stroke-dasharray="2 10"/><line x1="18" y1="' + c + '" x2="' + (size - 18) + '" y2="' + c + '" stroke-dasharray="2 10"/>' +
      '<circle cx="' + (c + c * .62 * .707) + '" cy="' + (c - c * .62 * .707) + '" r="14" fill="var(--accent)" stroke="none"/></svg>';
  }
  function cross(x, y) { return '<svg style="position:absolute;left:' + (x - 14) + "px;top:" + (y - 14) + 'px;width:28px;height:28px" fill="none" stroke="var(--ink)" stroke-width="2"><path d="M14 0v28M0 14h28"/></svg>'; }

  /* Block theme: a Bauhaus cast of shapes, recomposed per page; data-morph keys
     let them glide between pages. */
  function blockShapes(i, L) {
    /* shapes stay clear of the text column: everything sits on the right or a corner */
    var P = {
      cover: [["circle", 1250, -260, 900, "#ee5634"], ["quarter", 1680, 840, 240, "var(--accent-2)"]],
      section: [["circle", 1320, -320, 840, "#ee5634"], ["quarter", 1600, 760, 320, "#ee5634"]],
      statement: [["quarter", 1680, -20, 260, "var(--ink)"], ["circle", 1620, 780, 460, "var(--fill)"]],
      closing: [["circle", 1430, -300, 760, "var(--fill)"], ["quarter", 1680, 840, 240, "var(--accent-2)"]],
      number: [["circle", 1400, -420, 800, "var(--bg-2)"], ["quarter", 1680, 840, 240, "var(--ink)"]],
      quote: [["circle", 1520, -300, 640, "var(--fill)"], ["quarter", 1680, 840, 240, "var(--panel)"]]
    };
    return (P[L] || P.section).map(function (s, k) {
      var style = "position:absolute;left:" + s[1] + "px;top:" + s[2] + "px;width:" + s[3] + "px;height:" + s[3] + "px;background:" + s[4] + ";";
      style += s[0] === "circle" ? "border-radius:50%;" : "border-radius:100% 0 0 0;";
      return '<div data-morph="shape-' + k + '" style="' + style + '"></div>';
    }).join("");
  }

  var DECOR = {
    noir: function (s, L) {
      if (L === "cover" || L === "closing") return fx("aurora");
      if (L === "section") return fx("aurora");
      if (L === "statement" || L === "number") return '<div style="position:absolute;right:-620px;bottom:-760px;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in oklab,var(--accent) 30%,transparent),transparent)"></div>';
      return "";
    },
    paper: function (s, L, ctx) {
      var h = "";
      if (L === "cover") h += fx("ink");
      if (ctx.seal && (L === "cover" || L === "closing")) h += '<div class="seal">' + ctx.seal + "</div>";
      return h;
    },
    swiss: function (s, L) {
      if (L === "cover") return '<div style="position:absolute;right:-120px;top:-300px;width:820px;height:820px;border-radius:50%;background:var(--accent)"></div>';
      if (L === "statement") return '<div style="position:absolute;left:var(--mx);top:148px;width:96px;height:96px;background:var(--accent)"></div>';
      if (L === "closing") return '<div style="position:absolute;right:-440px;bottom:-460px;width:1100px;height:1100px;border-radius:50%;background:var(--accent)"></div>';
      return "";
    },
    spec: function (s, L) {
      if (L === "cover" || L === "closing") return dial(1200, 170, 840);
      if (L === "section") return dial(1260, 180, 720);
      return cross(56, 56) + cross(1864, 56) + cross(56, 1024) + cross(1864, 1024);
    },
    block: function (s, L, ctx) {
      if (["cover", "section", "statement", "closing", "number", "quote"].indexOf(L) >= 0) return blockShapes(ctx.index, L);
      return "";
    },
    board: function (s, L) {
      if (L === "cover" || L === "section" || L === "closing") return '<div style="position:absolute;left:var(--mx);right:var(--mx);bottom:92px;height:2px;background:var(--accent)"></div>';
      return "";
    }
  };

  /* A custom style (styles/<id>.js) may replace the page tones and the decoration */
  function custom(deck) {
    var id = deck.getAttribute("data-style");
    return (id && window.DeckStyles && window.DeckStyles[id]) || {};
  }
  function applyTone(theme, slide, layout, index, sectionCount, inverted, spec) {
    if (slide.hasAttribute("data-tone") && !slide.hasAttribute("data-tone-auto")) return;
    slide.removeAttribute("data-tone"); slide.removeAttribute("data-tone-auto");
    var t = spec.tones ? spec.tones[layout] : (AUTO_TONE[theme] || {})[layout];
    if (!t && inverted) t = theme === "noir" ? "light" : "dark";
    if (t) { slide.setAttribute("data-tone", t); slide.setAttribute("data-tone-auto", ""); }
  }

  window.Decor = {
    apply: function (deck, slides) {
      var theme = deck.getAttribute("data-theme") || "paper", seal = deck.getAttribute("data-seal"), sectionCount = 0, spec = custom(deck);
      slides.forEach(function (s, i) {
        var old = s.querySelector(":scope > .deco[data-rt]");
        if (old) old.remove();
        var L = s.getAttribute("data-layout") || "";
        applyTone(theme, s, L, i, sectionCount, deck.hasAttribute("data-invert"), spec);
        if (L === "section") sectionCount++;
        var html = (spec.decor || DECOR[theme] || function () { return ""; })(s, L, { index: i, seal: seal });
        if (html) {
          var d = document.createElement("div");
          d.className = "deco"; d.setAttribute("data-rt", ""); d.innerHTML = html;
          s.insertBefore(d, s.firstChild);
        }
      });
    }
  };
})();
