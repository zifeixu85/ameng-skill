/* ============================================================================
   ameng-ppt-design · fx/contour.js
   Magazine flowing contour lines (topographic-style curves) that slowly
   undulate. Drawn with --accent at low alpha + --ink-3. Restrained — sits
   BEHIND hero text and must NOT reduce legibility.
   Registers window.PptFX["contour"]. Honors reduced-motion (static contours).
   Pure Canvas 2D. Zero-dep. Load before fx-runtime.js.
   ============================================================================ */
(function () {
  "use strict";
  window.PptFX = window.PptFX || {};

  window.PptFX["contour"] = function (canvas, o) {
    var ctx = o.ctx, w = o.w, h = o.h;
    var lines = Math.round(9 * Math.max(0.4, Math.min(1, o.density)));
    lines = Math.max(4, Math.min(14, lines));        // hard cap
    var seg = Math.max(10, Math.min(48, Math.round(w / 26)));  // points per line
    var speed = 0.00016 * Math.max(0.2, Math.min(1, o.speed));
    var raf = 0, running = true;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      for (var i = 0; i < lines; i++) {
        var baseY = (h / (lines + 1)) * (i + 1);
        var phase = i * 0.7;
        // amplitude grows toward the middle band, calmer near edges
        var depth = 1 - Math.abs((i / (lines - 1)) - 0.5) * 1.2;
        var amp = (h * 0.05) * (0.4 + 0.6 * Math.max(0, depth));
        // accent only on a couple of "feature" lines, the rest neutral ink
        var feat = (i % 4 === 1);
        ctx.strokeStyle = feat ? o.accent : o.ink3;
        ctx.globalAlpha = feat ? 0.14 : 0.085;
        ctx.beginPath();
        for (var s = 0; s <= seg; s++) {
          var x = (w / seg) * s;
          var tt = o.reduced ? 0 : t * speed;
          var y = baseY
            + Math.sin(x * 0.006 + phase + tt) * amp
            + Math.sin(x * 0.013 + phase * 1.7 - tt * 1.4) * amp * 0.4;
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
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
