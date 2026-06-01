/* ============================================================================
   ameng-ppt-design · fx-runtime.js
   OPT-IN, OFFLINE, lightweight Canvas-2D background system.
   归藏-style hero motion — pure Canvas 2D. NO WebGL, NO network, headless-safe.
   Zero dependencies. Default OFF: only [data-fx] elements ever animate.
   Load AFTER runtime.js and after the fx modules it references.
   ----------------------------------------------------------------------------
   USAGE CONTRACT
   --------------
   1. Author drops a full-bleed layer inside a .slide, BEHIND the content:

        <section class="slide">
          <div class="slide-fx" data-fx="dot-field"
               style="position:absolute;inset:0;z-index:0"></div>
          <div class="center" style="position:relative;z-index:1">
             ...hero content sits ABOVE the fx...
          </div>
        </section>

      (.slide-fx { position:absolute; inset:0; pointer-events:none } is shipped
       at the end of components.css so the inline style above is optional.)

   2. Include the fx modules + this runtime, AFTER runtime.js:

        <script src="../assets/runtime.js"></script>
        <script src="../assets/fx/dot-field.js"></script>
        <script src="../assets/fx/contour.js"></script>
        <script src="../assets/fx-runtime.js"></script>

   3. Optional knobs on the element:
        data-fx-density="0.6"   (0..1, scales particle/line count)
        data-fx-speed="0.5"     (0..1, scales drift speed)

   BEHAVIOUR
   ---------
   - An fx only inits when its slide gains `.is-active`, and STOPS
     (cancelAnimationFrame + clear) when the slide loses `.is-active`.
   - Colors are read from getComputedStyle of the [data-fx] element
     (--accent, --ink-3, --line-strong) so per-section accents just work.
   - devicePixelRatio honored (capped at 2). Resize-aware.
   - prefers-reduced-motion: reduce -> ONE static frame, no rAF loop.

   MODULE API
   ----------
   Each fx registers:  window.PptFX[name] = function (canvas, opts) { ... }
   where opts = { w, h, dpr, ctx, accent, ink3, line, density, speed, reduced }
   and the function returns { stop() } (and draws frames itself).
   ============================================================================ */
(function () {
  "use strict";
  window.PptFX = window.PptFX || {};

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function num(el, attr, dflt) {
    var v = parseFloat(el.getAttribute(attr));
    return isNaN(v) ? dflt : v;
  }

  // one live instance per [data-fx] element
  function FX(el) {
    this.el = el;
    this.name = el.getAttribute("data-fx");
    this.canvas = null;
    this.inst = null;
    this.ro = null;
  }

  FX.prototype.colors = function () {
    var cs = getComputedStyle(this.el);
    return {
      accent: cs.getPropertyValue("--accent").trim() || "#5b6cff",
      ink3: cs.getPropertyValue("--ink-3").trim() || "#999",
      line: cs.getPropertyValue("--line-strong").trim() || "#ccc"
    };
  };

  FX.prototype.start = function () {
    if (this.inst) return;                       // already running
    var factory = window.PptFX[this.name];
    if (typeof factory !== "function") return;   // unknown fx — fail silent

    var el = this.el;
    var canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    el.appendChild(canvas);
    this.canvas = canvas;

    var self = this;
    var build = function () {
      if (self.inst) { self.inst.stop(); self.inst = null; }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = el.clientWidth || 1, h = el.clientHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var c = self.colors();
      self.inst = factory(canvas, {
        w: w, h: h, dpr: dpr, ctx: ctx,
        accent: c.accent, ink3: c.ink3, line: c.line,
        density: num(el, "data-fx-density", 1),
        speed: num(el, "data-fx-speed", 1),
        reduced: reduced
      });
    };
    build();

    // resize-aware (ResizeObserver where available, window resize fallback)
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(build);
      this.ro.observe(el);
    } else {
      this._onResize = build;
      window.addEventListener("resize", build);
    }
  };

  FX.prototype.stop = function () {
    if (this.ro) { this.ro.disconnect(); this.ro = null; }
    if (this._onResize) { window.removeEventListener("resize", this._onResize); this._onResize = null; }
    if (this.inst) { this.inst.stop(); this.inst = null; }
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
  };

  // registry: element -> FX instance
  var registry = new WeakMap();

  function fxIn(slide) {
    return Array.prototype.slice.call(slide.querySelectorAll("[data-fx]"));
  }

  function activate(slide) {
    fxIn(slide).forEach(function (el) {
      var fx = registry.get(el);
      if (!fx) { fx = new FX(el); registry.set(el, fx); }
      fx.start();
    });
  }
  function deactivate(slide) {
    fxIn(slide).forEach(function (el) {
      var fx = registry.get(el);
      if (fx) fx.stop();
    });
  }

  function init() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    if (!slides.length) return;

    // watch each slide's class list for .is-active gain/loss
    var mo = new MutationObserver(function (records) {
      records.forEach(function (r) {
        var s = r.target;
        if (s.classList.contains("is-active")) activate(s);
        else deactivate(s);
      });
    });
    slides.forEach(function (s) {
      mo.observe(s, { attributes: true, attributeFilter: ["class"] });
      if (s.classList.contains("is-active")) activate(s);  // kick the first slide
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
