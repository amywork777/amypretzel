// Verify deferred phone WebGL, direct book opening, and table navigation.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const artifacts = process.env.BOOK_QA_DIR || join(tmpdir(), 'amypretzel-mobile-qa');
await mkdir(artifacts, { recursive: true });
import assert from 'node:assert/strict';
(async () => {
    const b = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const errors = [];
    const passed = [];
    try {
        for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
            const p = await b.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
            p.on('pageerror', e => errors.push(e.message));
            p.on('console', e => { if (e.type() === 'error')
                errors.push(e.text()); });
            const requested = [];
            p.on('request', r => requested.push(r.url()));
            await p.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/`, { waitUntil: 'networkidle' });
            assert.equal(await p.locator('canvas').count(), 0);
            assert.equal(requested.some(u => u.includes('.woff')), false);
            assert.equal(requested.some(u => u.includes('coffee-cup.glb')), false);
            assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.doesNotMatch(await p.locator('body').innerText(), /[\u2190-\u21ff\u2794]/);
            assert.equal(await p.locator('.software-row p').first().evaluate(e => getComputedStyle(e).fontSize), '14px');
            await p.screenshot({ path: join(artifacts, `home-${width}.png`) });
            await p.locator('#software').scrollIntoViewIfNeeded();
            await p.screenshot({ path: join(artifacts, `software-${width}.png`) });
            await p.getByRole('link', { name: 'Book', exact: true }).tap();
            await p.locator('.book-overlay[data-view="table"][data-ready="true"]').waitFor();
            assert.equal(await p.locator('.mobile-book-reader, .book-back-to-reading').count(), 0);
            await p.waitForTimeout(1800);
            const dimensions = await p.locator('canvas').evaluate(c => ({ width: c.width, height: c.height }));
            assert.deepEqual(dimensions, { width, height });
            await p.screenshot({ path: join(artifacts, `table-${width}.png`) });
            await p.getByRole('button', { name: 'Next page', exact: true }).tap();
            await p.waitForTimeout(1500);
            assert.equal(await p.locator('.storybook-pagination span').innerText(), '01 — 02');
            await p.getByRole('button', { name: 'Previous page', exact: true }).tap();
            await p.waitForTimeout(1500);
            if (width === 390) {
                await p.touchscreen.tap(336, 316);
                await p.waitForTimeout(1500);
                assert.match(await p.locator('.table-status').textContent(), /^Coffee spilled/);
                await p.touchscreen.tap(158, 229);
                await p.waitForTimeout(1500);
                assert.match(await p.locator('.table-status').textContent(), /1 of 4/);
                await p.getByRole('button', { name: 'Next page', exact: true }).tap();
                await p.waitForTimeout(1500);
                await p.screenshot({ path: join(artifacts, 'table-open.png') });
                passed.push('direct coffee/flower touch; page turn');
            }
            await p.getByRole('button', { name: 'Enter site', exact: true }).tap();
            assert.equal(await p.locator('.book-overlay').count(), 0);
            passed.push(`${width}px: no font requests, no overflow, larger text, direct lower-resolution table, page navigation`);
            await p.close();
        }
        const d = await b.newPage({ viewport: { width: 1440, height: 1000 } });
        d.on('pageerror', e => errors.push(e.message));
        await d.addInitScript(() => localStorage.setItem('amypretzel:book-seen', '1'));
        await d.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/`, { waitUntil: 'networkidle' });
        await d.locator('.book-overlay[data-view="table"][data-ready="true"]').waitFor();
        await d.waitForTimeout(1500);
        await d.screenshot({ path: join(artifacts, 'desktop-table.png') });
        assert.doesNotMatch(await d.locator('body').innerText(), /[\u2190-\u21ff\u2794]/);
        await d.getByRole('button', { name: 'Next page', exact: true }).click();
        await d.waitForTimeout(1500);
        assert.equal(await d.locator('.storybook-pagination span').innerText(), '01 — 02');
        passed.push('desktop opens with book even for returning visitors; word pagination');
        await d.keyboard.press('Escape');
        await d.reload({ waitUntil: 'networkidle' });
        await d.locator('.book-overlay').waitFor();
        await d.keyboard.press('Escape');
        await d.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/#software`, { waitUntil: 'networkidle' });
        assert.equal(await d.locator('.book-overlay').count(), 0);
        passed.push('desktop reload opens book; section deep links stay on site');
        for (const route of ['/software', '/portfolio']) {
            await d.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}${route}`, { waitUntil: 'networkidle' });
            assert.doesNotMatch(await d.locator('body').innerText(), /[\u2190-\u21ff\u2794]/);
        }
        passed.push('no arrow glyphs on indexes');
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ passed, errors }));
    }
    finally {
        await b.close();
    }
})();
