/* Entry script. Loads the runtime in order; editor and exporter load on demand. */
(function () {
  "use strict";
  var base = document.currentScript.src.replace(/[^/]*$/, "");
  window.KIT_BASE = base;
  ["js/decor.js", "js/motion.js", "js/charts/core.js", "js/charts/cartesian.js", "js/charts/radial.js",
   "js/charts/flow.js", "js/diagrams.js", "js/fx.js", "js/loops.js", "js/deck.js", "js/overlays.js", "js/dock.js", "js/presenter.js"].forEach(function (f) {
    var s = document.createElement("script");
    s.src = base + f; s.async = false;
    document.head.appendChild(s);
  });
})();
