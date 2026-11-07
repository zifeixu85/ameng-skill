// cdp.mjs — zero-dependency headless Chrome driver (Node ≥ 22: built-in WebSocket).
// Used by every headless step: PNG, vector PDF, native PPTX, layout checks.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];

export function findChrome() {
  const hit = [process.env.CHROME_PATH, ...CANDIDATES].find((p) => p && existsSync(p));
  if (!hit) throw new Error("没有找到 Chrome。请安装 Google Chrome，或设置 CHROME_PATH。");
  return hit;
}

function freePort() {
  return new Promise((res, rej) => {
    const s = createServer();
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function withTimeout(promise, ms, message) {
  let timer;
  const limit = new Promise((_, no) => { timer = setTimeout(() => no(new Error(message)), ms); });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

export async function launch({ width = 1920, height = 1080, scale = 1 } = {}) {
  if (typeof WebSocket === "undefined") throw new Error("需要 Node 22 或更高版本（内置 WebSocket）。");
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), "ameng-ppt-"));
  const proc = spawn(findChrome(), [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--hide-scrollbars", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--enable-unsafe-swiftshader",
    `--window-size=${width},${height}`, "about:blank",
  ], { stdio: "ignore" });

  let target;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(100);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch { /* still starting */ }
  }
  if (!target) { proc.kill(); throw new Error("Chrome 没有启动成功。"); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("无法连接 Chrome。")); });
  let seq = 0;
  const waiting = new Map();
  const logs = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) {
      const { res, rej } = waiting.get(m.id); waiting.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method === "Runtime.exceptionThrown") {
      logs.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    } else if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) {
      logs.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq; waiting.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });

  const page = {
    send, logs,
    async goto(url) {
      await send("Page.navigate", { url });
      for (let i = 0; i < 300; i++) {
        const r = await send("Runtime.evaluate", { expression: "document.documentElement.getAttribute('data-deck-ready')", returnByValue: true });
        if (r.result.value === "1") return;
        await sleep(100);
      }
      throw new Error("页面 30 秒内没有就绪：" + url);
    },
    async eval(expression) {
      const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async png(path, writer) {
      // A few image encodings can stall Chrome's headless decoder; fail loudly instead of hanging
      const r = await withTimeout(send("Page.captureScreenshot", { format: "png" }), 25000, "截图超时：这一页的某张图片 Chrome 解不开，建议重新导出为普通 JPG 或 PNG。");
      writer(path, Buffer.from(r.data, "base64"));
    },
    async pdf(opts = {}) {
      const r = await withTimeout(send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true, ...opts }), 120000, "生成 PDF 超时。");
      return Buffer.from(r.data, "base64");
    },
    sleep,
    async close() { try { ws.close(); } catch { /* gone */ } proc.kill(); await sleep(150); rmSync(profile, { recursive: true, force: true }); },
  };
  return page;
}
