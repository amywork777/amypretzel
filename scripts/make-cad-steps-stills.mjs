// Capture the first paint of the CAD stepper demos: the finished part, from the
// demo's own starting view, drawn by the demo itself (so the canvas replaces
// the still without a jump). Run after `make-cad-steps.py`, against the site
// running locally (`next build && next start -p 3134`):
//
//   node scripts/make-cad-steps-stills.mjs [http://localhost:3134]
//
// Writes public/demos/<slug>/still.webp. Restart the server to serve them.

import { chromium } from "playwright";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3134";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
// Reduced motion keeps it on the finished part; 1280 wide gives the reading
// column's 764px stage, captured at twice that.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
for (const slug of ["cad-steps"]) {
  await page.goto(`${base}/software/${slug}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".cad-stepper-label, .cad-stepper-ring { display: none !important; } .cad-stepper-stage img { visibility: hidden; }" });
  const stage = page.locator(".cad-stepper-stage");
  await stage.scrollIntoViewIfNeeded();
  await page.waitForSelector(".cad-stepper-stage canvas[data-ready]", { timeout: 30000 });
  await page.waitForTimeout(800); // the canvas fades in over .3s
  const png = await stage.screenshot();
  const out = path.join(root, "public/demos", slug, "still.webp");
  await sharp(png).resize(1120, 630).webp({ quality: 84 }).toFile(out);
  console.log(`wrote ${path.relative(root, out)}`);
}
await browser.close();
process.exit(0);
