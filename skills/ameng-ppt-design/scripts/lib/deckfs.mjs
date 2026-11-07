// deckfs.mjs — locating a deck on disk and serving it.
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";

export const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".gif": "image/gif", ".woff2": "font/woff2", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function exists(p) { try { await stat(p); return true; } catch { return false; } }

/** Accepts a deck folder or an html file. Returns { file, root }: root is the folder that holds kit/. */
export async function locate(input) {
  let file = resolve(input);
  if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  if (!(await exists(file))) throw new Error("找不到 " + file);
  let root = dirname(file);
  for (const up of [root, dirname(root), dirname(dirname(root))]) {
    if (await exists(join(up, "kit", "kit.js"))) { root = up; break; }
  }
  return { file, root };
}

export function safeJoin(root, urlPath) {
  const p = resolve(join(root, decodeURIComponent(urlPath)));
  if (p !== root && !p.startsWith(root + sep)) throw new Error("路径越界");
  return p;
}

export async function serveFile(root, urlPath, res) {
  try {
    const p = safeJoin(root, urlPath.endsWith("/") ? urlPath + "index.html" : urlPath);
    const body = await readFile(p);
    res.writeHead(200, { "Content-Type": MIME[extname(p).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("没有这个文件");
  }
}

export const hashOf = (text) => createHash("sha1").update(text).digest("hex").slice(0, 16);
