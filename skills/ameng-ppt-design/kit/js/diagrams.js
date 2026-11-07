/* diagrams.js — places radial nodes and draws connectors. Nodes stay plain DOM so
   each one exports to a native PowerPoint shape; wires live in one SVG per diagram. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function wires(host) {
    var old = host.querySelector(":scope > .dg__wires"); if (old) old.remove();
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "dg__wires"); svg.setAttribute("data-rt", "");
    host.insertBefore(svg, host.firstChild);
    return svg;
  }
  function path(svg, d, cls) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); if (cls) p.setAttribute("class", cls);
    svg.appendChild(p); return p;
  }
  function ring(host) {
    var nodes = Array.prototype.slice.call(host.querySelectorAll(":scope > .ring__node")), n = nodes.length;
    if (!n) return;
    var W = host.offsetWidth, H = host.offsetHeight, cx = W / 2, cy = H / 2, sz = nodes[0].offsetWidth, R = Math.min(W, H) / 2 - sz / 2 - 4;
    var hub = !!host.querySelector(":scope > .ring__core"), svg = wires(host), start = -Math.PI / 2;
    nodes.forEach(function (el, i) {
      var a = start + i / n * Math.PI * 2;
      el.style.left = (cx + R * Math.cos(a)).toFixed(1) + "px";
      el.style.top = (cy + R * Math.sin(a)).toFixed(1) + "px";
      if (hub) {
        var core = host.querySelector(":scope > .ring__core").offsetWidth / 2;
        path(svg, "M" + (cx + core * Math.cos(a)) + " " + (cy + core * Math.sin(a)) + "L" + (cx + (R - sz / 2) * Math.cos(a)) + " " + (cy + (R - sz / 2) * Math.sin(a)));
      }
    });
    if (!hub) {
      var pad = Math.asin(Math.min(.9, (sz / 2 + 14) / R)) * 1.0;
      for (var i = 0; i < n; i++) {
        var a0 = start + i / n * Math.PI * 2 + pad, a1 = start + (i + 1) / n * Math.PI * 2 - pad;
        var x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        path(svg, "M" + x0.toFixed(1) + " " + y0.toFixed(1) + "A" + R + " " + R + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1));
        var t = a1 + Math.PI / 2, s = 18;
        path(svg, "M" + (x1 - s * Math.cos(t - .5)).toFixed(1) + " " + (y1 - s * Math.sin(t - .5)).toFixed(1) + "L" + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + (x1 - s * Math.cos(t + .5)).toFixed(1) + " " + (y1 - s * Math.sin(t + .5)).toFixed(1));
      }
    }
  }
  function steps(host) {
    var dot = host.querySelector(".step__dot"); if (!dot) return;
    var old = host.querySelector(":scope > .steps__rail"); if (old) old.remove();
    var r = document.createElement("div");
    r.className = "steps__rail"; r.setAttribute("data-rt", "");
    host.style.setProperty("--n", host.querySelectorAll(":scope > .step").length);
    var d = dot.offsetTop + dot.offsetHeight / 2 + (dot.parentElement.offsetTop || 0);
    r.style.top = d + "px";
    host.insertBefore(r, host.firstChild);
  }
  function count(sel, root) {
    Array.prototype.forEach.call(root.querySelectorAll(sel), function (el) {
      var kids = Array.prototype.filter.call(el.children, function (c) { return !c.hasAttribute("data-rt"); });
      el.style.setProperty("--n", kids.length);
    });
  }
  /* Big type must survive real content: shrink until it fits its room, never overflow */
  var BIG_TITLE = /^(cover|closing|section|statement|quote)$/;
  function fitTitle(slide) {
    var t = slide.querySelector(":scope > .title"), L = slide.getAttribute("data-layout") || "";
    if (!t || !BIG_TITLE.test(L)) return;
    t.style.fontSize = "";
    var cs = getComputedStyle(slide), room = 1080 - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), used = 0;
    Array.prototype.forEach.call(slide.children, function (k) {
      if (k === t || k.hasAttribute("data-rt") || k.matches(".notes,.meta,.deco,.fx")) return;
      if (getComputedStyle(k).position === "absolute") return;
      used += k.offsetHeight;
    });
    var size = parseFloat(getComputedStyle(t).fontSize), avail = room - used - parseFloat(getComputedStyle(t).marginBottom), guard = 0;
    function lines() { return Math.round(t.offsetHeight / (parseFloat(getComputedStyle(t).lineHeight) || size * 1.2)); }
    while (guard++ < 30 && size > 60 && (t.offsetHeight > avail || lines() > 3)) { size *= .95; t.style.fontSize = size.toFixed(1) + "px"; }
  }
  function fitLine(el) {
    el.style.fontSize = "";
    var size = parseFloat(getComputedStyle(el).fontSize), guard = 0;
    while (guard++ < 30 && size > 40 && el.scrollWidth > el.clientWidth + 1) { size *= .95; el.style.fontSize = size.toFixed(1) + "px"; }
  }
  window.Diagrams = {
    draw: function (root) {
      Array.prototype.forEach.call(root.querySelectorAll(":scope > .slide"), fitTitle);
      Array.prototype.forEach.call(root.querySelectorAll(".hero,.kpi__value,.tier .price,.step h3"), fitLine);
      count(".kpis,.points,.tiers,.timeline,.steps", root);
      Array.prototype.forEach.call(root.querySelectorAll(".layers"), function (el) {
        var n = el.children.length;
        Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty("--i", el.hasAttribute("data-pyramid") ? n - 1 - i : 0); });
      });
      Array.prototype.forEach.call(root.querySelectorAll(".tl"), function (t) {
        if (t.querySelector(":scope > .tl__dot")) return;
        var d = document.createElement("i");
        d.className = "tl__dot"; d.setAttribute("data-rt", "");
        t.insertBefore(d, t.firstChild);
      });
      Array.prototype.forEach.call(root.querySelectorAll(".ring"), ring);
      Array.prototype.forEach.call(root.querySelectorAll(".steps"), steps);
    }
  };
})();
