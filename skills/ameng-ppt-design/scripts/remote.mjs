#!/usr/bin/env node
// remote.mjs — control a deck from a phone: page turns, notes, next-page preview, timer, jump.
//   node scripts/remote.mjs <deck-folder|index.html> [--no-open] [--no-public] [--new-token]
// Runs in the foreground; Ctrl-C stops the server and the tunnel. Deck files are not modified.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { homedir, networkInterfaces } from "node:os";
import { join } from "node:path";
import { hashOf, locate } from "./lib/deckfs.mjs";
import { imagePath, render } from "./lib/remote-render.mjs";
import { createRemote } from "./lib/remote-server.mjs";

/* cleanup habits like `pkill -f ameng-ppt-` must not stop a running talk */
process.title = "deck-remote";

const qrcode = createRequire(import.meta.url)("./lib/qrcode.cjs");
const args = process.argv.slice(2);
const flag = (k) => args.includes("--" + k);
const input = args.find((a) => !a.startsWith("--"));
if (!input) { console.error("用法: node scripts/remote.mjs <deck 文件夹或 index.html> [--no-open] [--no-public] [--new-token]"); process.exit(2); }

const { file, root } = await locate(input);
const home = process.env.DECK_REMOTE_HOME || join(homedir(), ".cache", "deck-remote");
const dir = join(home, hashOf(file));
mkdirSync(dir, { recursive: true, mode: 0o700 });

/* ---- token and ports stay the same between runs, so a phone keeps working after a restart ---- */
const statePath = join(dir, "state.json");
const readJson = (path) => {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
};
const saved = readJson(statePath) || {};
const free = (port, host) => new Promise((ok) => {
  const s = createServer();
  s.once("error", () => ok(false));
  s.listen(port, host, () => s.close(() => ok(true)));
});
async function alreadyRunning(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/__remote/ping`, { signal: AbortSignal.timeout(800) });
    return r.ok && (await r.json()).file === file;
  } catch { return false; }
}
if (saved.deckPort && await alreadyRunning(saved.deckPort)) {
  console.log(`这份 deck 的遥控已经在运行：http://127.0.0.1:${saved.deckPort}/__remote/panel`);
  if (flag("new-token")) console.log("口令没有换。先按 Ctrl-C 停掉正在运行的那个，再加 --new-token 启动。");
  process.exit(flag("new-token") ? 1 : 0);
}
async function pickPorts() {
  const base = 7300 + (parseInt(hashOf(file).slice(0, 6), 16) % 600) * 2;
  const tries = [saved.deckPort, ...Array.from({ length: 30 }, (_, k) => base + k * 2)].filter(Boolean);
  for (const p of tries) if (await free(p, "127.0.0.1") && await free(p + 1, "0.0.0.0")) return p;
  throw new Error("找不到可用端口");
}
const deckPort = await pickPorts(), remotePort = deckPort + 1;
/* the LAN address is plain http, so a token lives for one day at most */
const today = new Date().toLocaleDateString("sv");
const token = (!flag("new-token") && saved.day === today && saved.token) || randomBytes(24).toString("base64url");
writeFileSync(statePath + ".new", JSON.stringify({ token, day: today, deckPort, file }), { mode: 0o600 });
renameSync(statePath + ".new", statePath);

/* ---- addresses ---------------------------------------------------------- */
function lanAddresses() {
  const found = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    if (!/^(en|bridge|ap)\d/.test(name)) continue;   /* skips utun proxies, awdl, loopback */
    for (const a of list) {
      if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.") && !a.address.startsWith("198.18.")) found.push(a.address);
    }
  }
  return found;
}
function qrSvg(text) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 4; let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
function qrText(text) {
  const q = qrcode(0, "L"); q.addData(text); q.make();
  const n = q.getModuleCount(), dark = (r, c) => r >= 0 && c >= 0 && r < n && c < n && q.isDark(r, c);
  const rows = [];
  for (let r = -2; r < n + 2; r += 2) {
    let line = "";
    for (let c = -2; c < n + 2; c++) line += ["█", "▄", "▀", " "][(dark(r, c) ? 2 : 0) + (dark(r + 1, c) ? 1 : 0)];
    rows.push(line);
  }
  return rows.join("\n");
}

/* ---- public route (optional, set up once in public.json) ------------------ */
const publicPath = join(home, "public.json");
const publicConf = !flag("no-public") && existsSync(publicPath) ? readJson(publicPath) : null;
if (!flag("no-public") && existsSync(publicPath) && !publicConf) console.error("public.json 读不出来，这次不开公网地址。");
let tunnelState = publicConf ? "连接中" : "", tunnel = null, stopping = false;
function startTunnel() {
  const config = join(dir, "cloudflared.yml");
  writeFileSync(config, [
    `tunnel: ${publicConf.tunnel}`, `credentials-file: ${publicConf.credentials}`, "protocol: http2", "no-autoupdate: true",
    "ingress:", `  - hostname: ${publicConf.hostname}`, `    service: http://127.0.0.1:${remotePort}`, "  - service: http_status:404", "",
  ].join("\n"), { mode: 0o600 });
  tunnel = spawn("cloudflared", ["tunnel", "--config", config, "run", publicConf.tunnel], { stdio: ["ignore", "ignore", "pipe"] });
  let log = "";
  tunnel.stderr.on("data", (c) => {
    log = (log + c).slice(-4000);
    if (/Registered tunnel connection/.test(log)) { tunnelState = "已连接"; log = ""; }
  });
  tunnel.on("error", () => { tunnelState = "cloudflared 启动失败"; });
  tunnel.on("exit", () => {
    if (stopping) return;
    tunnelState = "断开，5 秒后重试";
    setTimeout(startTunnel, 5000);
  });
}

/* ---- preview images, kept fresh when the deck file changes ---------------- */
console.log("准备预览图和备注…");
const RENDER_LIMIT_MS = 180000;
const rendered = (log) => Promise.race([
  render(file, dir, log),
  new Promise((_, no) => setTimeout(() => no(new Error("生成预览超时，Chrome 可能被关掉了")), RENDER_LIMIT_MS).unref()),
]);
let meta = await rendered((m) => console.log("  " + m)).catch((e) => { console.error(e.message + "，请重新运行。"); process.exit(1); });
let refreshing = false, remote = null;
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const next = await rendered();
    if (next.v !== meta.v) { meta = next; console.log("deck 内容变了，手机上的备注和预览已更新"); remote.metaChanged(); }
  } catch (e) { console.error("更新预览失败，手机继续用旧内容：" + e.message); }
  refreshing = false;
}

const addresses = () => {
  const list = lanAddresses().map((ip, k) => ({ kind: "lan", label: "局域网" + (k ? " " + (k + 1) : ""), url: `http://${ip}:${remotePort}/${token}/` }));
  if (publicConf) list.push({ kind: "public", label: "公网", url: `https://${publicConf.hostname}/${token}/` });
  return list.map((a) => ({ ...a, qr: qrSvg(a.url) }));
};
remote = createRemote({
  file, root, token, deckPort, remotePort,
  store: {
    meta: () => meta,
    imagePath: (n, step) => imagePath(dir, meta.v, n, step),
    addresses,
    extra: () => ({ tunnel: tunnelState }),
    onDeckOpen: refresh,
  },
});
await remote.listen();

const panel = `http://127.0.0.1:${deckPort}/__remote/panel`;
const deckUrl = `http://127.0.0.1:${deckPort}${remote.deckPath}`;
function announce() {
  const list = addresses();
  console.log(`\n电脑面板（含二维码）: ${panel}\n放映页: ${deckUrl}`);
  for (const a of list) console.log(`手机 ${a.label}: ${a.url}`);
  if (!list.length) console.log("现在没有联网地址，连上 Wi-Fi 或手机热点后会自动显示。");
  if (list[0]) console.log("\n" + qrText(list[0].url));
  console.log("\n按 Ctrl-C 停止。停止后电脑放映页的键盘翻页仍然能用。");
}
announce();

let lastLan = lanAddresses().join();
setInterval(() => {
  const now = lanAddresses().join();
  if (now === lastLan) return;
  lastLan = now;
  console.log("\n网络变了，地址已更新：");
  announce();
}, 3000);

/* keep the Mac awake while presenting */
const awake = process.platform === "darwin" ? spawn("caffeinate", ["-dims", "-w", String(process.pid)], { stdio: "ignore" }) : null;
awake?.on("error", () => console.error("caffeinate 没有启动，电脑可能会休眠"));
if (publicConf) startTunnel();

function stop() {
  stopping = true;
  tunnel?.kill();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("SIGHUP", stop);

if (!flag("no-open")) {
  const opener = existsSync("/Applications/Google Chrome.app") ? ["-a", "Google Chrome", panel] : [panel];
  spawn("open", opener, { stdio: "ignore" }).on("error", () => {});
}
