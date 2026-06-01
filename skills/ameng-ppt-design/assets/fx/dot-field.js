/* ============================================================================
   ameng-ppt-design · fx/dot-field.js
   Swiss point-grid: a calm dot lattice that slowly drifts / parallaxes.
   Very low contrast (--ink-3 at low alpha) — "information design" feel.
   Registers window.PptFX["dot-field"]. Honors reduced-motion (static grid).
   Pure Canvas 2D. Zero-dep. Load before fx-runtime.js.
   ============================================================================ */
(function () {
  "use strict";
  window.PptFX = window.PptFX || {};

  window.PptFX["dot-field"] = function (canvas, o) {
    var ctx = o.ctx, w = o.w, h = o.h;
    var step = 34;                                  // grid pitch (px)
    var density = Math.max(0.35, Math.min(1, o.density));
    var gap = step / density;                       // denser = tighter pitch
    var cols = Math.ceil(w / gap) + 2;
    var rows = Math.ceil(h / gap) + 2;
    var maxDots = 1400;                             // hard safety cap
    if (cols * rows > maxDots) {
      var k = Math.sqrt((cols * rows) / maxDots);
      gap *= k; cols = Math.ceil(w / gap) + 2; rows = Math.ceil(h / gap) + 2;
    }
    var amp = gap * 0.28;                            // drift amplitude
    var speed = 0.00022 * Math.max(0.2, Math.min(1, o.speed));
    var raf = 0, running = true;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
          var bx = c * gap - gap, by = r * gap - gap;
          // smooth parallax wobble — phase varies per row/col
          var ph = (c * 0.6 + r * 0.4);
          var dx = o.reduced ? 0 : Math.cos(t * speed + ph) * amp;
          var dy = o.reduced ? 0 : Math.sin(t * speed * 0.8 + ph * 1.3) * amp;
          // depth: dots fade subtly toward the edges for an atmospheric falloff
          var fall = 1 - Math.abs((c / cols) - 0.5) * 0.7;
          var a = 0.10 + 0.12 * fall;
          ctx.globalAlpha = a;
          ctx.fillStyle = o.ink3;
          ctx.beginPath();
          ctx.arc(bx + dx, by + dy, 1.1, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (running && !o.reduced) raf = requestAnimationFrame(draw);
    }

    if (o.reduced) draw(0);                          // ONE static frame
    else raf = requestAnimationFrame(draw);

    return {
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, w, h);
      }
    };
  };
})();
