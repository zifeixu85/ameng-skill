#!/usr/bin/env node
// export.mjs — headless export. Serves the deck over a private local port so images
// and fonts read cleanly, then runs the same exporter the 导出 button uses.
//   node scripts/export.mjs <deck.html> --pptx [--pdf] [--png] [--theme noir] [--fonts safe|design] [--shapes] [--out dir]
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join, basename, relative } from "node:path";
import { launch } from "./lib/cdp.mjs";
import { locate, serveFile } from "./lib/deckfs.mjs";

const args = process.argv.slice(2);
const flag = (k) => args.includes("--" + k);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(["theme", "fonts", "out", "name"]);
const file = args.find((a, i) => !a.startsWith("--") && !(args[i - 1]?.startsWith("--") && valued.has(args[i - 1].slice(2))));
if (!file) { console.error("usage: export.mjs <deck.html> --pptx [--pdf] [--png] [--theme x] [--fonts safe|design] [--out dir]"); process.exit(2); }

const { file: abs, root } = await locate(file);
const server = createServer((req, res) => serveFile(root, new URL(req.url, "http://x").pathname, res));
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/${relative(root, abs).split("\\").join("/")}`;

const name = opt("name", basename(dirname(abs)) === "templates" ? basename(abs, ".html") : basename(dirname(abs)));
const out = resolve(opt("out", dirname(abs)));
await mkdir(out, { recursive: true });
const page = await launch();
try {
  await page.goto(url + "?static");
  if (opt("theme")) await page.eval(`Deck.setTheme(${JSON.stringify(opt("theme"))})`);
  if (flag("pptx")) {
    await page.eval(`new Promise((res, rej) => { const s = document.createElement("script"); s.src = KIT_BASE + "js/export/load.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }).then(() => Exporter.ready)`);
    if (flag("shapes")) await page.eval("window.PptxOpts = { shapesOnly: true }");
    const b64 = await page.eval(`PptxPackage.base64({ fonts: ${JSON.stringify(opt("fonts", "safe"))} })`);
    const target = join(out, name + ".pptx");
    await writeFile(target, Buffer.from(b64, "base64"));
    console.log("PPTX →", target);
  }
  if (flag("pdf")) {
    await page.eval("document.documentElement.classList.add('is-printing')");
    const target = join(out, name + ".pdf");
    await writeFile(target, await page.pdf());
    console.log("PDF  →", target);
  }
  if (flag("png")) {
    const dir = join(out, "png");
    await mkdir(dir, { recursive: true });
    const n = await page.eval("Deck.slides.length");
    for (let i = 0; i < n; i++) {
      await page.eval(`Deck.go(${i},{instant:true,force:true,step:99});1`);
      await page.sleep(90);
      await page.png(join(dir, `slide-${String(i + 1).padStart(2, "0")}.png`), writeFileSync);
    }
    console.log("PNG  →", dir);
  }
  if (page.logs.length) console.error([...new Set(page.logs)].slice(0, 10).join("\n"));
} finally {
  await page.close();
  server.close();
}
