// Prints resume/resume.html to public/amy-zhou-resume.pdf, the file behind
// the homepage's Resume pill. Run after editing the resume:
//   node scripts/render-resume.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Uses installed Chrome; set CHANNEL='' to use Playwright's own Chromium.
const browser = await chromium.launch({ channel: process.env.CHANNEL ?? 'chrome' });
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve('resume', 'resume.html')).href);
await page.pdf({ path: resolve('public', 'amy-zhou-resume.pdf'), format: 'Letter', preferCSSPageSize: true, printBackground: true, tagged: true });
await browser.close();
console.log('wrote public/amy-zhou-resume.pdf');
