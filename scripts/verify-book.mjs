// Checks the book against a production server (default http://localhost:3001):
// when it opens, page turning on desktop and phones, what screen readers hear,
// the coffee and pretzel buttons, Exit the book, and Read as text.
// Screenshots go to the system temporary directory (BOOK_QA_DIR overrides it).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const base = process.env.BOOK_PREVIEW_URL || 'http://localhost:3001';
const artifacts = process.env.BOOK_QA_DIR || join(tmpdir(), 'amypretzel-book-qa');
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
const errors = [];
const passed = [];

async function page(options) {
  const p = await (await browser.newContext(options)).newPage();
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  return p;
}
const ready = p => p.locator('.book-overlay[data-ready="true"]').waitFor({ timeout: 60000 });
const counter = p => p.locator('.storybook-pagination .ui-meta').innerText();
const heard = p => p.locator('.storybook > p.sr-only[aria-live]').innerText();
const next = p => p.getByRole('button', { name: /^(Open the book|Next page)$/ }).click();

try {
  // Desktop: the first visit opens the book; later visits and deep links don't.
  const d = await page({ viewport: { width: 1440, height: 900 } });
  await d.goto(`${base}/`, { waitUntil: 'load' });
  await ready(d);
  await d.waitForTimeout(1500);
  await d.screenshot({ path: join(artifacts, 'desktop-cover.png') });
  await next(d);
  await d.waitForTimeout(1800);
  assert.equal(await counter(d), 'Pages 1 and 2');
  assert.match(await heard(d), /^a kid who made things\./);
  await d.screenshot({ path: join(artifacts, 'desktop-spread.png') });
  await next(d); await next(d);
  await d.getByRole('button', { name: 'Previous page' }).click();
  await d.getByRole('button', { name: 'Previous page' }).click();
  await d.waitForTimeout(1500);
  assert.equal(await counter(d), 'Pages 1 and 2');
  passed.push('desktop opens on the first visit; pages turn and announce');

  await d.getByRole('button', { name: 'Spill coffee' }).click();
  await d.getByRole('button', { name: 'Take a pretzel' }).click();
  await d.waitForTimeout(1500);
  assert.match(await d.locator('.book-toys [role="status"]').innerText(), /Coffee spilled\. 1 of \d+ pretzels taken\./);
  await d.getByRole('button', { name: 'Reset the table' }).click();
  await d.waitForTimeout(300);
  assert.equal(await d.getByRole('button', { name: 'Reset the table' }).count(), 0);
  await d.locator('.book-reading summary').click();
  assert.ok(await d.locator('.book-reading-panel').isVisible());
  await d.screenshot({ path: join(artifacts, 'desktop-read-as-text.png') });
  await d.locator('.book-reading summary').click();
  await d.getByRole('button', { name: 'Exit the book' }).click();
  assert.equal(await d.locator('.book-overlay').count(), 0);
  passed.push('coffee and pretzel buttons work and reset; Exit the book leaves');

  await d.goto(`${base}/`, { waitUntil: 'load' });
  await d.waitForTimeout(2000);
  assert.equal(await d.locator('.book-overlay').count(), 0);
  await d.goto(`${base}/#book`, { waitUntil: 'load' });
  await ready(d);
  passed.push('return visits stay on the site; /#book still opens the book');

  // Phones: the site first, then one page at a time.
  const m = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await m.goto(`${base}/`, { waitUntil: 'load' });
  await m.waitForTimeout(1500);
  assert.equal(await m.locator('canvas').count(), 0);
  await m.getByRole('link', { name: 'Book', exact: true }).tap();
  await ready(m);
  await m.getByRole('button', { name: 'Open the book' }).tap();
  await m.waitForTimeout(1800);
  assert.equal(await counter(m), 'Page 1');
  await m.getByRole('button', { name: 'Next page' }).tap();
  await m.waitForTimeout(1500);
  assert.equal(await counter(m), 'Page 2');
  assert.match(await heard(m), /^design and engineering\./);
  await m.screenshot({ path: join(artifacts, 'phone-page.png') });
  await m.locator('.book-reading summary').tap();
  assert.ok(await m.locator('.book-reading-panel').isVisible());
  passed.push('phones load WebGL only on request and read one page at a time');

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed, artifacts }, null, 2));
} finally {
  await browser.close();
}
