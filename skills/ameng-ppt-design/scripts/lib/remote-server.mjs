// remote-server.mjs — two listeners, on purpose.
//   deck port   (127.0.0.1 only): the deck itself, with the bridge script added on the way out, plus the panel.
//   remote port (all interfaces): phone page, previews and notes, every path behind the token.
// A tunnel forwards to the remote port, so nothing public can ever reach deck files or the panel.
import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { MIME, serveFile } from "./deckfs.mjs";
import { accept } from "./ws.mjs";
import { TIMER_ZERO, autoStart, elapsed, resolve, toggle } from "./remote-core.mjs";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..", "remote");
const MAX_PHONES = 4, STALL_MS = 1500, PHONE_SILENT_MS = 12000, MIN_GAP_MS = 80, STALE_MS = 2500;
const PHONE_FILES = new Set(["phone.js", "phone.css", "keep-awake.mp4"]);
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self' ws: wss:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const HEADERS = { "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": CSP };

function sameToken(given, token) {
  const a = Buffer.from(String(given)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
function json(res, code, body, extra = {}) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra });
  res.end(JSON.stringify(body));
}
function missing(res) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...HEADERS }); res.end("not found"); }
const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

/** store: { meta(), imagePath(n), addresses(), extra(), onDeckOpen() } */
export function createRemote({ file, root, token, deckPort, remotePort, store }) {
  const decks = new Set(), phones = new Set();
  const deckPath = "/" + relative(root, file).split("\\").join("/");
  let pos = { i: 0, step: 0 }, shown = { i: 0, step: 0 };
  let seq = 0, acked = 0, stalled = false, stallTimer = null, timer = TIMER_ZERO;
  let located = false;   /* false until a deck has said where the talk is, e.g. right after a restart */

  const timerView = () => ({ running: timer.running, elapsed: elapsed(timer, Date.now()) });
  const stateMsg = () => JSON.stringify({ t: "state", i: shown.i, step: shown.step, decks: decks.size, phones: phones.size, stalled, timer: timerView(), v: store.meta().v });
  const toPhones = (text) => phones.forEach((p) => p.send(text));
  const pushState = () => toPhones(stateMsg());

  function goDecks(to, via, from) {
    seq += 1; pos = to;
    const text = JSON.stringify({ t: "go", seq, from, i: to.i, step: to.step, via });
    decks.forEach((d) => d.send(text));
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      if (acked >= seq) return;
      stalled = true; pos = shown; acked = seq; pushState();
    }, STALL_MS);
  }
  function fromDeck(client, m) {
    if (!Number.isInteger(m?.i) || !Number.isInteger(m?.step)) return;
    if (m.t === "hello") {
      store.onDeckOpen();
      client.send(JSON.stringify({ t: "sync", seq }));
      /* a second window joins the talk where it is; the first window decides where the talk is */
      if (located && decks.size > 1) return client.send(JSON.stringify({ t: "go", seq, from: null, i: pos.i, step: pos.step, via: "go" }));
    }
    if (m.t !== "hello" && m.ack < seq) return;   /* a report from before the latest command */
    acked = Math.max(acked, seq);
    pos = shown = { i: m.i, step: m.step };
    located = true;
    stalled = false;
    if (shown.i > 0) timer = autoStart(timer, Date.now());
    pushState();
  }
  function fromPhone(client, m) {
    client.seen = Date.now();
    /* phone and Mac clocks differ; the smallest gap seen is that difference plus the best network time */
    if (Number.isFinite(m?.at)) client.skew = Math.min(client.skew, client.seen - m.at);
    if (m?.t === "ping") return client.send(JSON.stringify({ t: "pong", n: m.n, timer: timerView() }));
    if (m?.t === "timer") {
      timer = m.a === "reset" ? TIMER_ZERO : m.a === "toggle" ? toggle(timer, Date.now()) : timer;
      return pushState();
    }
    if (m?.t !== "cmd") return;
    const reply = (ok, why) => client.send(JSON.stringify({ t: "ack", id: m.id, ok, why }));
    if (!decks.size) return reply(false, "放映页没打开");
    if (client.seen - client.lastCmd < MIN_GAP_MS) return reply(false, "按得太快");
    /* held up in a stalled network: the phone has already told the speaker this press failed */
    if (client.seen - m.at - client.skew > STALE_MS) return reply(false, "这一下到得太晚，已忽略");
    client.lastCmd = client.seen;
    const to = resolve(m, pos, store.meta().slides);
    if (!to) return reply(true, "edge");
    goDecks(to, m.cmd, pos);
    reply(true);
  }

  /* ---- deck port ---------------------------------------------------------- */
  const local = (host) => host === `127.0.0.1:${deckPort}` || host === `localhost:${deckPort}`;
  const status = () => ({ ok: true, file, decks: decks.size, phones: phones.size, position: shown, deckUrl: `http://127.0.0.1:${deckPort}${encodeURI(deckPath)}`, addresses: store.addresses(), ...store.extra() });
  const deckServer = createServer(async (req, res) => {
    try {
      if (!local(req.headers.host)) return json(res, 403, { error: "只接受本机地址" });
      /* a page framed by another site would pass the socket's Origin check */
      if (["iframe", "frame", "embed", "object"].includes(req.headers["sec-fetch-dest"]) && req.headers["sec-fetch-site"] !== "same-origin") return json(res, 403, { error: "不能被别的网站嵌入" });
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      const u = new URL(req.url, `http://127.0.0.1:${deckPort}`);
      if (u.pathname === "/__remote/ping") return json(res, 200, { ok: true, file });
      if (u.pathname === "/__remote/status") return json(res, 200, status());
      if (u.pathname === "/__remote/bridge.js") return serveFile(WEB, "/bridge.js", res);
      if (u.pathname === "/__remote/panel") return serveFile(WEB, "/panel.html", res);
      if (u.pathname === "/") { res.writeHead(302, { Location: encodeURI(deckPath) + u.search }); return res.end(); }
      if (decodeURIComponent(u.pathname) === deckPath) {
        const text = await readFile(file, "utf8"), at = text.toLowerCase().lastIndexOf("</body>");
        const tag = '<script src="/__remote/bridge.js"></script>';
        res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" });
        return res.end(at < 0 ? text + tag : text.slice(0, at) + tag + text.slice(at));
      }
      return serveFile(root, u.pathname, res);
    } catch (e) { return json(res, 500, { error: String(e.message || e) }); }
  });
  deckServer.on("upgrade", (req, socket) => {
    const origin = req.headers.origin || "";
    const fromHere = origin === `http://127.0.0.1:${deckPort}` || origin === `http://localhost:${deckPort}`;
    const crossSite = !["same-origin", undefined].includes(req.headers["sec-fetch-site"]);
    if (req.url !== "/__remote/ws" || !local(req.headers.host) || !fromHere || crossSite) return socket.destroy();
    const client = accept(req, socket, {
      onMessage: (text) => fromDeck(client, parse(text)),
      onClose: () => { decks.delete(client); pushState(); },
    });
    if (client) decks.add(client);
  });

  /* ---- remote port -------------------------------------------------------- */
  async function sendFile(res, path, cache) {
    try {
      const body = await readFile(path);
      res.writeHead(200, { "Content-Type": MIME[extname(path)] || "application/octet-stream", "Cache-Control": cache, ...HEADERS });
      res.end(body);
    } catch { missing(res); }
  }
  const remoteServer = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://remote.invalid");
      const [, key, ...rest] = u.pathname.split("/");
      if (!sameToken(key, token) || !["GET", "HEAD"].includes(req.method)) return missing(res);
      if (!rest.length) { res.writeHead(302, { Location: `/${token}/`, ...HEADERS }); return res.end(); }
      const name = rest.join("/");
      if (name === "") return sendFile(res, join(WEB, "phone.html"), "no-store");
      if (name === "meta") {
        const addresses = store.addresses().map(({ kind, label, url }) => ({ kind, label, url }));
        return json(res, 200, { ...store.meta(), addresses }, HEADERS);
      }
      if (PHONE_FILES.has(name)) return sendFile(res, join(WEB, name), "no-store");
      const slide = name.match(/^s\/(\d{1,4})(?:-(\d{1,3}))?\.webp$/);
      if (slide) return sendFile(res, store.imagePath(Number(slide[1]), slide[2] === undefined ? undefined : Number(slide[2])), "private, max-age=86400");
      return missing(res);
    } catch { return missing(res); }
  });
  remoteServer.on("upgrade", (req, socket) => {
    const [path] = req.url.split("?");
    const [, key, tail] = path.split("/");
    let sameSite = false;
    try { sameSite = new URL(req.headers.origin).host === req.headers.host; } catch { /* no origin */ }
    if (!sameToken(key, token) || tail !== "ws" || !sameSite || phones.size >= MAX_PHONES) return socket.destroy();
    const client = accept(req, socket, {
      onMessage: (text) => fromPhone(client, parse(text)),
      onClose: () => { phones.delete(client); pushState(); },
    });
    if (!client) return;
    client.seen = Date.now(); client.lastCmd = 0; client.skew = Infinity;
    phones.add(client);
    pushState();
  });
  const sweep = setInterval(() => {
    const now = Date.now();
    phones.forEach((p) => { if (now - p.seen > PHONE_SILENT_MS) p.close(); });
  }, 3000);
  sweep.unref();
  [deckServer, remoteServer].forEach((s) => s.on("clientError", (_, socket) => socket.destroy()));

  return {
    deckPath: encodeURI(deckPath),
    pushState,
    metaChanged: () => toPhones(JSON.stringify({ t: "meta", v: store.meta().v })),
    listen: () => Promise.all([[deckServer, deckPort, "127.0.0.1"], [remoteServer, remotePort, "0.0.0.0"]].map(([s, p, h]) => new Promise((ok, no) => {
      s.once("error", no); s.listen(p, h, () => { s.off("error", no); ok(); });
    }))),
  };
}
