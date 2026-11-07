/* bridge.js — added to the deck page by remote.mjs. Follows commands from the server and
   reports where the deck is. Applying a command is idempotent: with two windows open, both
   land on the same page. If the server is gone this does nothing and the keyboard still works. */
(function () {
  "use strict";
  var ws = null, seq = 0, wait = 500;
  function send(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }
  function report(t) { send({ t: t, i: Deck.index, step: Deck.step, ack: seq }); }
  function apply(m) {
    seq = m.seq;
    var here = m.from && Deck.index === m.from.i && Deck.step === m.from.step;
    if (here && m.via === "next") Deck.next();
    else if (here && m.via === "prev") Deck.prev();
    else Deck.go(m.i, { step: m.step, force: m.i !== Deck.index });
  }
  function connect() {
    ws = new WebSocket("ws://" + location.host + "/__remote/ws");
    ws.onopen = function () { wait = 500; report("hello"); };
    ws.onmessage = function (e) { var m = JSON.parse(e.data); if (m.t === "sync") seq = m.seq; if (m.t === "go") apply(m); };
    ws.onclose = function () { setTimeout(connect, wait); wait = Math.min(wait * 2, 3000); };
  }
  function start() {
    if (document.documentElement.getAttribute("data-deck-ready") !== "1" || !window.Deck) return setTimeout(start, 80);
    if (Deck.mode.static) return;
    Deck.on(function (t) { if (t === "slide") report("state"); });
    connect();
  }
  start();
})();
