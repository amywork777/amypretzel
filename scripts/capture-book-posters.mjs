// Run against a production server after changing the scene, then rebuild.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  const destination = resolve('public/book');
  await mkdir(destination, { recursive: true });
  try {
    for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
      // 2x: the poster fills the screen before WebGL is ready, and a 1x image
      // stretched over a Retina display looked blurry.
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: 'light' });
      await page.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/#book`, { waitUntil: 'networkidle' });
      await page.locator('.book-overlay').waitFor();
      await page.locator('.book-overlay[data-view="table"][data-ready="true"]').waitFor();
      await page.waitForTimeout(2500);
      await page.addStyleTag({ content: '.book-overlay-enter,.storybook-bar,.book-toys,.book-poster {visibility:hidden!important}' });
      await sharp(await page.screenshot()).webp({ quality: 80 }).toFile(resolve(destination, `scene-${name}.webp`));
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
