// remote-render.mjs — small preview images and notes for the phone, read from the real runtime.
// Cached per deck content, so a second start is instant.
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "./cdp.mjs";
import { hashOf } from "./deckfs.mjs";

const READ = `Deck.slides.map((s) => {
  const n = s.querySelector(":scope > .notes"), t = s.querySelector(".title");
  return { title: t ? t.textContent.replace(/\\s+/g, " ").trim() : "", section: s.getAttribute("data-section") || "",
    notes: n ? n.textContent.trim() : "", steps: Motion.stepCount(s), hidden: s.hasAttribute("data-hidden") };
})`;

async function readMeta(dir) {
  try { return JSON.parse(await readFile(join(dir, "meta.json"), "utf8")); } catch { return null; }
}

/* n is the page number; step is how far its builds have gone, omitted for the finished page */
export const imagePath = (dir, v, n, step) => join(dir, v, step === undefined ? `slide-${n}.webp` : `slide-${n}-${step}.webp`);
const FORMAT = 2;

/** Returns { v, slides }. Renders only when the deck file changed since the last run. */
export async function render(file, dir, log = () => {}) {
  const v = hashOf(await readFile(file, "utf8"));
  const cached = await readMeta(dir);
  if (cached?.v === v && cached.format === FORMAT) return cached;
  await mkdir(join(dir, v), { recursive: true });
  const page = await launch({ width: 960, height: 540 });
  try {
    await page.goto(pathToFileURL(file).href + "?static");
    const slides = await page.eval(READ);
    const capture = async (path) => {
      const shot = await page.send("Page.captureScreenshot", { format: "webp", quality: 70 });
      await writeFile(path, Buffer.from(shot.data, "base64"));
    };
    for (let i = 0; i < slides.length; i++) {
      await page.eval(`Deck.go(${i},{instant:true,force:true,step:99})`);
      await page.sleep(120);
      await capture(imagePath(dir, v, i + 1));
      /* each build state, so the phone shows exactly what the audience sees */
      for (let k = 0; k < slides[i].steps; k++) {
        await page.eval(`Motion.static=false;Motion.syncSteps(Deck.slides[${i}],${k});Motion.static=true;1`);
        await page.sleep(60);
        await capture(imagePath(dir, v, i + 1, k));
      }
      if ((i + 1) % 10 === 0) log(`预览 ${i + 1}/${slides.length}`);
    }
    const meta = { v, format: FORMAT, slides };
    await writeFile(join(dir, "meta.json"), JSON.stringify(meta));
    for (const f of await readdir(dir, { withFileTypes: true })) {
      if (f.isDirectory() && f.name !== v) await rm(join(dir, f.name), { recursive: true, force: true });
    }
    return meta;
  } finally { await page.close(); }
}
