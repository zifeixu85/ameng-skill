/* loops.js — quiet motion that keeps running inside a page: a dot travels the process,
   the hot item breathes, data flows through a sankey. Starts after the entrance, stops
   on leaving the page. Everything here is runtime only: never saved, never exported. */
(function () {
  "use strict";
  var live = [], added = [], timer = 0;
  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FOREVER = { iterations: Infinity };

  function run(el, frames, opt) { var a = el.animate(frames, Object.assign({}, FOREVER, opt)); live.push(a); return a; }
  function dot(host, css) {
    var d = document.createElement("i");
    d.className = "loop-dot"; d.setAttribute("data-rt", ""); d.setAttribute("data-no-export", "");
    if (css) d.style.cssText = css;
    host.appendChild(d); added.push(d);
    return d;
  }
  /* a soft ring that leaves the element, then fades */
  function pulse(el, period, delay) {
    var c = getComputedStyle(el).backgroundColor;
    run(el, [
      { boxShadow: "0 0 0 0 color-mix(in oklab," + c + " 55%,transparent)", offset: 0 },
      { boxShadow: "0 0 0 26px color-mix(in oklab," + c + " 0%,transparent)", offset: .45 },
      { boxShadow: "0 0 0 0 color-mix(in oklab," + c + " 0%,transparent)", offset: 1 }
    ], { duration: period, delay: delay || 0, easing: "ease-out" });
  }
  /* a node swells for a moment as the travelling dot reaches it */
  function beat(el, period, delay, base) {
    var b = base || "";
    run(el, [
      { transform: b + " scale(1)", offset: 0 }, { transform: b + " scale(1.07)", offset: .06 },
      { transform: b + " scale(1)", offset: .16 }, { transform: b + " scale(1)", offset: 1 }
    ], { duration: period, delay: delay, easing: "ease-in-out" });
  }
  function flowWires(host) {
    Array.prototype.forEach.call(host.querySelectorAll(":scope > .dg__wires path"), function (p) {
      var len = p.getTotalLength(); if (len < 40) return;
      p.style.strokeDasharray = "10 12";
      run(p, [{ strokeDashoffset: 0 }, { strokeDashoffset: -44 }], { duration: 1100, easing: "linear" });
      added.push({ remove: function () { p.style.strokeDasharray = ""; } });
    });
  }
  function ring(host) {
    var nodes = host.querySelectorAll(":scope > .ring__node"), n = nodes.length; if (!n) return;
    var core = host.querySelector(":scope > .ring__core"), W = host.offsetWidth, H = host.offsetHeight, sz = nodes[0].offsetWidth, R = Math.min(W, H) / 2 - sz / 2 - 4;
    if (core) {  /* hub: signals leave the core along each spoke */
      var inner = core.offsetWidth / 2, period = 2800;
      Array.prototype.forEach.call(nodes, function (nd, i) {
        var a = -Math.PI / 2 + i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        var d = dot(host, "left:" + W / 2 + "px;top:" + H / 2 + "px");
        run(d, [
          { transform: "translate(" + c * inner + "px," + s * inner + "px)", opacity: 0, offset: 0 },
          { opacity: 1, offset: .1 },
          { transform: "translate(" + c * (R - sz / 2) + "px," + s * (R - sz / 2) + "px)", opacity: 1, offset: .5 },
          { transform: "translate(" + c * (R - sz / 2) + "px," + s * (R - sz / 2) + "px)", opacity: 0, offset: .56 },
          { opacity: 0, offset: 1 }
        ], { duration: period, delay: i * period / n, easing: "ease-in-out" });
        beat(nd, period, i * period / n + period * .46, "translate(-50%,-50%)");
      });
      pulse(core, 2800);
      return;
    }
    var round = n * 2000;
    var orbit = document.createElement("i");
    orbit.className = "loop-orbit"; orbit.setAttribute("data-rt", ""); orbit.setAttribute("data-no-export", "");
    orbit.style.cssText = "left:" + W / 2 + "px;top:" + H / 2 + "px";
    host.appendChild(orbit); added.push(orbit);
    dot(orbit, "left:" + R + "px;top:0");
    run(orbit, [{ transform: "rotate(-90deg)" }, { transform: "rotate(270deg)" }], { duration: round, easing: "linear" });
    Array.prototype.forEach.call(nodes, function (nd, i) { beat(nd, round, i * round / n - round * .03 + round, "translate(-50%,-50%)"); });
  }
  /* a dot rides a straight spine and wakes each stop in turn */
  function rail(host, stops, y, x0, x1, each) {
    var span = x1 - x0, period = Math.max(4200, stops.length * 1300);
    var d = dot(host, "left:0;top:" + y + "px");
    run(d, [
      { transform: "translateX(" + x0 + "px)", opacity: 0, offset: 0 }, { opacity: 1, offset: .04 },
      { transform: "translateX(" + x1 + "px)", opacity: 1, offset: .8 }, { transform: "translateX(" + x1 + "px)", opacity: 0, offset: .86 },
      { opacity: 0, offset: 1 }
    ], { duration: period, easing: "linear" });
    Array.prototype.forEach.call(stops, function (s, i) {
      var at = (each(s) - x0) / (span || 1) * .8 * period;
      beat(s, period, at);
    });
  }
  function steps(host) {
    var r = host.querySelector(":scope > .steps__rail"), dots = host.querySelectorAll(".step__dot"); if (!r || !dots.length) return;
    var hb = host.getBoundingClientRect(), k = hb.width / (host.offsetWidth || 1) || 1;
    function cx(el) { var b = el.getBoundingClientRect(); return (b.left + b.width / 2 - hb.left) / k; }
    rail(host, dots, r.offsetTop + 1, cx(dots[0]), cx(dots[dots.length - 1]), cx);
  }
  function timeline(host) {
    var dots = host.querySelectorAll(".tl__dot"); if (!dots.length) return;
    var hb = host.getBoundingClientRect(), k = hb.width / (host.offsetWidth || 1) || 1;
    function cx(el) { var b = el.getBoundingClientRect(); return (b.left + b.width / 2 - hb.left) / k; }
    var first = host.querySelector(".tl");
    rail(host, dots, first.offsetTop, cx(dots[0]), host.offsetWidth - 8, cx);
  }
  function chart(fig) {
    var NS = "http://www.w3.org/2000/svg";
    Charts.loops(fig).forEach(function (l) {
      if (l.kind === "halo") {
        var h = document.createElementNS(NS, "circle");
        h.setAttribute("cx", l.el.getAttribute("cx")); h.setAttribute("cy", l.el.getAttribute("cy")); h.setAttribute("r", l.el.getAttribute("r"));
        h.style.cssText = "fill:none;stroke:" + l.color + ";stroke-width:3;transform-box:fill-box;transform-origin:center";
        l.el.parentNode.insertBefore(h, l.el); added.push(h);
        run(h, [{ transform: "scale(1)", opacity: .9 }, { transform: "scale(3.2)", opacity: 0 }], { duration: 2400, easing: "ease-out" });
      } else if (l.kind === "flow" && l.el.getTotalLength) {
        /* a lighter stream inside the band, moving toward the outcome */
        var f = l.el.cloneNode(false);
        f.style.stroke = "var(--bg)"; f.style.strokeOpacity = l.hot ? ".55" : ".32"; f.style.strokeWidth = "3px"; f.style.strokeDasharray = "34 62"; f.style.strokeLinecap = "round";
        l.el.parentNode.insertBefore(f, l.el.nextSibling); added.push(f);
        run(f, [{ strokeDashoffset: 0 }, { strokeDashoffset: -96 }], { duration: 1500, easing: "linear" });
      }
    });
  }
  function begin(slide) {
    if (slide.getAttribute("data-loop") === "off" || document.querySelector(".deck").getAttribute("data-loop") === "off") return;
    var q = function (s) { return Array.prototype.slice.call(slide.querySelectorAll(s)); };
    q(".ring").forEach(function (h) { ring(h); flowWires(h); });
    q("svg .flow").forEach(function (p) {
      if (p.closest("[data-rt]")) return;
      var was = p.style.strokeDasharray;
      p.style.strokeDasharray = "10 12";
      run(p, [{ strokeDashoffset: 0 }, { strokeDashoffset: -44 }], { duration: 1100, easing: "linear" });
      added.push({ remove: function () { p.style.strokeDasharray = was; } });
    });
    q(".steps").forEach(steps);
    q(".timeline").forEach(timeline);
    q(".chart").forEach(chart);
    q(".mx.is-hot,.tier.is-hot,.layer.is-hot,.kpi--hot,.ring__node.is-hot").forEach(function (el) { pulse(el, 3200); });
  }
  window.Loops = {
    start: function (slide, after) {
      if (reduced || (window.Deck && Deck.mode.static) || document.querySelector(".deck").classList.contains("is-editing")) return;
      clearTimeout(timer);
      timer = setTimeout(function () { begin(slide); }, after || 0);
    },
    stop: function () {
      clearTimeout(timer);
      live.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } });
      added.forEach(function (n) { if (n.remove) n.remove(); });
      live = []; added = [];
    }
  };
})();
