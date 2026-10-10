// Photographs the pretzel mark from the dev-only /logo-render page and writes
// the site's logo and icons. Run against `next dev -p 3002`:
//   node scripts/render-logo.mjs
// KIND=secret writes only the homepage's stray pink pretzel, pretzel-secret.png.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const kind = process.env.KIND;
const url = `${process.env.LOGO_RENDER_URL || 'http://localhost:3002'}/logo-render${kind ? `?kind=${kind}` : ''}`;
const out = file => resolve('public', file);

// A PNG-in-ICO holding the 16 and 32 pixel icons.
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(image => image.png)]);
}

async function photograph(page) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Keep the dev-mode badge out of the photo, and the page's paper colour.
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; } html, body { background: transparent !important; }' });
  await page.waitForTimeout(2500);
  const raw = await page.locator('#logo canvas').screenshot({ omitBackground: true });
  await writeFile(resolve('tmp', 'logo-raw.png'), raw);
  return sharp(raw).trim({ threshold: 1 }).extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
    const mark = await photograph(page);
    const square = size => sharp(mark).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    // The nav shows it at 44px; 192 keeps it sharp at 4x without the image optimiser.
    if (kind) { await writeFile(out(`pretzel-${kind}.png`), await square(192)); return; }
    await writeFile(out('pretzel.png'), await square(192));
    const [p16, p32] = [await square(16), await square(32)];
    await writeFile(out('favicon-16.png'), p16);
    await writeFile(out('favicon-32.png'), p32);
    await writeFile(resolve('app', 'favicon.ico'), ico([{ size: 16, png: p16 }, { size: 32, png: p32 }]));
    // iOS fills transparency with black, so the home-screen icon sits on white.
    const inner = await sharp(mark).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    await sharp({ create: { width: 180, height: 180, channels: 4, background: '#ffffff' } })
      .composite([{ input: inner, gravity: 'center' }]).png().toFile(out('apple-touch-icon.png'));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
