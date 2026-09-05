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
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light' });
      await page.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/#book`, { waitUntil: 'networkidle' });
      await page.locator('.book-overlay').waitFor();
      await page.locator('.book-overlay[data-view="table"][data-ready="true"]').waitFor();
      await page.waitForTimeout(2500);
      await page.addStyleTag({ content: '.book-overlay-heading,.book-overlay-enter,.storybook-controls,.book-reading,.table-actions,.book-poster {visibility:hidden!important}' });
      await sharp(await page.screenshot()).webp({ quality: 76 }).toFile(resolve(destination, `scene-${name}.webp`));
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
