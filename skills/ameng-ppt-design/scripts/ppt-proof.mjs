#!/usr/bin/env node
// ppt-proof.mjs — opens an exported PPTX in real PowerPoint (macOS) and renders every
// page, so "it looks right in PowerPoint" is checked, not assumed. A corrupt file fails here.
//   node scripts/ppt-proof.mjs <file.pptx> [--out dir]
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
if (!file) { console.error("用法: node scripts/ppt-proof.mjs <文件.pptx> [--out 目录]"); process.exit(2); }
const i = args.indexOf("--out");
const out = resolve(i >= 0 ? args[i + 1] : join(dirname(file), basename(file, ".pptx") + "-ppt"));
mkdirSync(out, { recursive: true });

/* PowerPoint is sandboxed: working inside its own container avoids a file-access prompt */
const box = join(homedir(), "Library/Containers/com.microsoft.Powerpoint/Data/tmp");
mkdirSync(box, { recursive: true });
const work = mkdtempSync(join(box, "deck-"));
const script = join(mkdtempSync(join(tmpdir(), "ppt-")), "export.applescript");
writeFileSync(script, `on run argv
  with timeout of 300 seconds
    tell application "Microsoft PowerPoint"
      open (POSIX file (item 1 of argv))
      set pres to active presentation
      save pres in (POSIX file (item 2 of argv)) as save as PDF
      close pres saving no
    end tell
  end timeout
end run
`);
try {
  const src = join(work, "deck.pptx"), pdf = join(work, "deck.pdf");
  copyFileSync(file, src);
  execFileSync("osascript", [script, src, pdf], { stdio: ["ignore", "ignore", "pipe"] });
  copyFileSync(pdf, join(out, "powerpoint.pdf"));
  execFileSync("pdftoppm", ["-r", "72", "-png", pdf, join(out, "p")]);
  console.log(`PowerPoint 打开正常，${readdirSync(out).filter((f) => f.endsWith(".png")).length} 页 → ${out}`);
} catch (e) {
  console.error("PowerPoint 没能打开或导出这个文件：" + String(e.stderr || e.message).trim());
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
