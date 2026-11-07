#!/usr/bin/env node
// serve.mjs — private local server for one deck (127.0.0.1 only).
// Adds what a static server can't: edits written back to index.html, image uploads,
// PDF / single-file export from the 导出 menu. The port is derived from the deck path,
// so the same deck normally opens at the same address; if another deck holds it, the next free one is used.
//   node scripts/serve.mjs <deck-folder|index.html> [--no-open] [--foreground]
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exists, hashOf, locate, serveFile, MIME } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) { console.error("用法: node scripts/serve.mjs <deck 文件夹或 index.html> [--no-open]"); process.exit(2); }
const { file, root } = await locate(input);
const here = dirname(fileURLToPath(import.meta.url));
const wanted = args.indexOf("--port");
const home = 8200 + (parseInt(hashOf(file).slice(0, 6), 16) % 700);
const pathOf = (p) => `http://127.0.0.1:${p}/${relative(root, file).split("\\").join("/")}`;

/** "mine" = this deck is already served there, "free" = nothing there, "busy" = another deck or program. */
async function portState(p) {
  try {
    const r = await fetch(`http://127.0.0.1:${p}/__deck/ping`, { signal: AbortSignal.timeout(800) });
    return r.ok && (await r.json()).file === file ? "mine" : "busy";
  } catch (e) {
    return e.cause?.code === "ECONNREFUSED" ? "free" : "busy";
  }
}

if (!args.includes("--foreground")) {
  let port = 0;
  for (let i = 0; i < 40 && !port; i++) {
    const p = home + i, state = await portState(p);
    if (state === "mine") port = p;
    else if (state === "free") {
      spawn(process.execPath, [fileURLToPath(import.meta.url), file, "--foreground", "--port", String(p)], { detached: true, stdio: "ignore" }).unref();
      for (let k = 0; k < 40 && (await portState(p)) !== "mine"; k++) await new Promise((r) => setTimeout(r, 100));
      if ((await portState(p)) === "mine") port = p;
    }
  }
  if (!port) { console.error("找不到可用端口"); process.exit(1); }
  console.log("URL: " + pathOf(port));
  if (!args.includes("--no-open")) spawn("open", [pathOf(port)], { stdio: "ignore" }).on("error", () => {});
  process.exit(0);
}
const port = Number(args[wanted + 1]);

const STAGE = /(<div class="stage"[^>]*>)[\s\S]*(<\/div>\s*<\/main>)/;
const versions = join(dirname(file), ".versions");
let lastBackup = 0;

async function backup(text) {
  if (Date.now() - lastBackup < 300000) return;
  lastBackup = Date.now();
  await mkdir(versions, { recursive: true });
  await writeFile(join(versions, new Date().toISOString().replace(/[:.]/g, "-") + ".html"), text);
  const all = (await readdir(versions)).sort();
  await Promise.all(all.slice(0, -30).map((f) => rm(join(versions, f))));
}
function json(res, code, body) { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); }
function body(req, limit = 60e6) {
  return new Promise((ok, no) => {
    const parts = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > limit) { no(new Error("内容太大")); req.destroy(); } else parts.push(c); });
    req.on("end", () => ok(Buffer.concat(parts)));
    req.on("error", no);
  });
}
/* a page on another site must not be able to write to this deck */
function sameOrigin(req) {
  const o = req.headers.origin;
  return !o || o === `http://127.0.0.1:${port}` || o === `http://localhost:${port}`;
}
/* a rebound hostname pointing at 127.0.0.1 must not reach the deck either */
function trustedHost(req) { return req.headers.host === `127.0.0.1:${port}` || req.headers.host === `localhost:${port}`; }
const IMAGE = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const server = createServer(async (req, res) => {
  try {
    if (!trustedHost(req)) return json(res, 403, { error: "只接受本机地址" });
    const u = new URL(req.url, `http://127.0.0.1:${port}`);
    if (u.pathname.startsWith("/__deck/") && !sameOrigin(req)) return json(res, 403, { error: "只接受本机页面的请求" });
    if (u.pathname === "/__deck/ping") return json(res, 200, { ok: true, file, hash: hashOf(await readFile(file, "utf8")) });
    if (u.pathname === "/__deck/save" && req.method === "POST") {
      const { base, stage, theme, style, accent } = JSON.parse((await body(req)).toString("utf8"));
      if (typeof stage !== "string" || !stage.includes('class="slide')) return json(res, 400, { error: "没有收到页面内容，已拒绝保存" });
      const text = await readFile(file, "utf8");
      if (base && base !== hashOf(text)) return json(res, 409, { error: "文件已被别处修改" });
      if (!STAGE.test(text)) return json(res, 422, { error: "index.html 结构不对，找不到 stage" });
      await backup(text);
      let next = text.replace(STAGE, (_, a, b) => `${a}\n\n${stage}\n\n${b}`);
      if (theme) next = next.replace(/(<main class="deck"[^>]*\bdata-theme=")[^"]*/, `$1${theme.replace(/[^\w-]/g, "")}`);
      next = next.replace(/(<main class="deck"[^>]*?)\s+data-style="[^"]*"/, "$1");
      if (/^[\w-]+$/.test(style || "")) next = next.replace(/<main class="deck"/, `<main class="deck" data-style="${style}"`);
      const clean = /^#[0-9a-f]{6}$/i.test(accent || "") ? accent : "";
      next = next.replace(/(<main class="deck"[^>]*?)\s+data-accent="[^"]*"/, "$1");
      if (clean) next = next.replace(/<main class="deck"/, `<main class="deck" data-accent="${clean}"`);
      /* write beside the file, then swap: a crash can never leave half a deck */
      const tmp = file + ".saving";
      await writeFile(tmp, next);
      await rename(tmp, file);
      return json(res, 200, { ok: true, hash: hashOf(next) });
    }
    if (u.pathname === "/__deck/upload" && req.method === "POST") {
      const name = basename(u.searchParams.get("name") || "image.png").replace(/[^\w.\u4e00-\u9fa5-]/g, "_");
      if (!IMAGE.has(extname(name).toLowerCase())) return json(res, 415, { error: "只能上传 PNG、JPG、WebP、GIF 图片" });
      const dir = join(dirname(file), "images");
      await mkdir(dir, { recursive: true });
      /* never replace an image another slide may use */
      const stem = name.slice(0, -extname(name).length), ext = extname(name);
      let unique = name;
      for (let i = 2; await exists(join(dir, unique)); i++) unique = `${stem}-${i}${ext}`;
      await writeFile(join(dir, unique), await body(req));
      return json(res, 200, { src: "images/" + unique });
    }
    if (u.pathname === "/__deck/export") {
      const format = u.searchParams.get("format");
      if (!["pdf", "html"].includes(format)) return json(res, 400, { error: "不支持的格式" });
      const tool = format === "html" ? "bundle.mjs" : "export.mjs";
      const a = format === "html" ? [join(here, tool), file] : [join(here, tool), file, "--pdf"];
      const code = await new Promise((ok) => spawn(process.execPath, a, { stdio: "ignore" }).on("exit", ok));
      if (code) return json(res, 500, { error: "导出失败" });
      const name = basename(dirname(file)) + (format === "html" ? ".single.html" : ".pdf");
      const out = await readFile(join(dirname(file), name));
      res.writeHead(200, { "Content-Type": MIME["." + format] || "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}` });
      return res.end(out);
    }
    return serveFile(root, u.pathname, res);
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
});
server.on("clientError", (_, socket) => socket.destroy());
server.listen(port, "127.0.0.1");
