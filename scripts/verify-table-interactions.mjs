// Run against a production server. Pointer coordinates target visible props at fixed viewports.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const artifacts = process.env.BOOK_QA_DIR || join(tmpdir(), 'amypretzel-table-qa');
await mkdir(artifacts, { recursive: true });
import assert from 'node:assert/strict';
(async () => {
    const b = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const errors = [];
    const passed = [];
    try {
        async function setup(options) {
            const p = await b.newPage(options);
            p.on('pageerror', e => errors.push(e.message));
            p.on('console', e => { if (e.type() === 'error')
                errors.push(e.text()); });
            await p.addInitScript(() => {
                window.__draws = 0;
                for (const m of ['drawElements', 'drawArrays']) {
                    const fn = WebGL2RenderingContext.prototype[m];
                    WebGL2RenderingContext.prototype[m] = function (...args) { window.__draws++; return fn.apply(this, args); };
                }
            });
            await p.goto(`${process.env.BOOK_PREVIEW_URL || 'http://localhost:3001'}/#book`, { waitUntil: 'networkidle' });
            await p.locator('.book-overlay').waitFor();
            if (await p.locator('.mobile-book-explore').count()) await p.locator('.mobile-book-explore').click();
            await p.locator('.book-overlay[data-view="table"][data-ready="true"]').waitFor();
            await p.waitForTimeout(2000);
            return p;
        }
        const count = async (p) => p.locator('.flower-actions button[aria-pressed="true"]').count();
        const idle = async (p) => {
            await p.waitForTimeout(3000);
            const a = await p.evaluate(() => window.__draws);
            await p.waitForTimeout(600);
            assert.equal(await p.evaluate(() => window.__draws), a);
        };
        const p = await setup({ viewport: { width: 1440, height: 1000 } });
        await idle(p);
        await p.mouse.click(1240, 510);
        await p.waitForTimeout(1500);
        assert.equal(await p.locator('.table-status').textContent(), 'Coffee spilled · 0 of 4 flowers out');
        assert.equal(await p.locator('.table-actions-panel > button').first().textContent(), 'Stand cup up');
        passed.push('direct cup tap spills coffee');
        for (const [i, x, y] of [[2, 219, 175], [1, 252, 105], [0, 193, 112], [3, 205, 55]]) {
            const before = await count(p);
            await p.mouse.move(x, y);
            await p.mouse.down();
            await p.mouse.move(x, y - 65, { steps: 8 });
            await p.mouse.up();
            await p.waitForTimeout(1600);
            assert.equal(await count(p), before + 1, `flower ${i} independently removed`);
            assert.equal(await p.locator('.flower-actions button').nth(i).getAttribute('aria-pressed'), 'true');
        }
        passed.push('all four flowers pulled separately');
        assert.equal(await p.locator('.storybook-pagination span').innerText(), 'A little book of making');
        await idle(p);
        passed.push('zero idle draws after interactions');
        await p.screenshot({ path: join(artifacts, 'direct-all-out.png') });
        await p.mouse.click(60, 525);
        await p.waitForTimeout(1500);
        assert.equal(await count(p), 3);
        passed.push('tap flower on table returns it');
        await p.getByRole('button', { name: 'Next page', exact: true }).click();
        await p.waitForTimeout(1600);
        assert.equal(await p.locator('.storybook-pagination span').innerText(), '01 — 02');
        await p.screenshot({ path: join(artifacts, 'open-and-spilled.png') });
        passed.push('page turning alongside props');
        await p.locator('.table-actions summary').click();
        await p.getByRole('button', { name: 'Stand cup up', exact: true }).focus();
        await p.keyboard.press('Enter');
        await p.waitForTimeout(1500);
        assert.match(await p.locator('.table-status').innerText(), /^Coffee spilled/);
        await p.getByRole('button', { name: 'Reset table', exact: true }).click();
        await p.waitForTimeout(1800);
        assert.equal(await p.locator('.table-status').innerText(), 'Coffee full · 0 of 4 flowers out');
        await p.locator('.table-actions summary').click();
        passed.push('keyboard cup control and full reset');
        // Cancel a partial flower pull, then prove another gesture and orbit remain usable.
        await p.mouse.move(219, 175);
        await p.mouse.down();
        await p.mouse.move(219, 155, { steps: 3 });
        await p.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, isPrimary: true })));
        await p.mouse.up();
        await p.waitForTimeout(1200);
        assert.equal(await count(p), 0);
        await p.mouse.move(1240, 510);
        await p.mouse.down();
        await p.mouse.move(1240, 410, { steps: 12 });
        await p.mouse.up();
        await p.waitForTimeout(1500);
        assert.match(await p.locator('.table-status').textContent(), /^Coffee spilled/);
        passed.push('cancel cleanup and direct cup drag');
        await p.mouse.move(60, 750);
        await p.mouse.down();
        await p.mouse.move(200, 800, { steps: 12 });
        await p.mouse.up();
        await p.waitForTimeout(1500);
        await p.screenshot({ path: join(artifacts, 'orbit.png') });
        await idle(p);
        passed.push('orbit still settles');
        await p.keyboard.press('Escape');
        await p.getByRole('button', { name: 'read the book', exact: true }).click();
        await p.locator('.book-overlay[data-ready="true"]').waitFor();
        await p.waitForTimeout(1000);
        assert.equal(await count(p), 0);
        assert.match(await p.locator('.table-status').textContent(), /^Coffee full/);
        passed.push('clean reopen');
        const m = await setup({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        await m.touchscreen.tap(336, 316);
        await m.waitForTimeout(1500);
        assert.match(await m.locator('.table-status').textContent(), /^Coffee spilled/);
        for (const [x, y] of [[158, 229], [173, 203], [147, 206], [154, 188]]) {
            const before = await count(m);
            await m.touchscreen.tap(x, y);
            await m.waitForTimeout(1400);
            assert.equal(await count(m), before + 1);
        }
        await idle(m);
        assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await m.screenshot({ path: join(artifacts, 'mobile-direct.png') });
        passed.push('mobile touch on cup and four individual flowers');
        await m.locator('.table-actions summary').click();
        await m.screenshot({ path: join(artifacts, 'mobile-menu.png') });
        await m.getByRole('button', { name: 'Reset table', exact: true }).tap();
        await m.waitForTimeout(1500);
        assert.equal(await m.locator('.table-status').textContent(), 'Coffee full · 0 of 4 flowers out');
        passed.push('mobile reset');
        const r = await setup({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
        await r.locator('.table-actions summary').click();
        await r.getByRole('button', { name: 'Tip coffee', exact: true }).click();
        await r.getByRole('button', { name: 'Pick peach flower', exact: true }).click();
        await r.waitForTimeout(200);
        assert.equal(await r.locator('.table-status').textContent(), 'Coffee spilled · 1 of 4 flowers out');
        await idle(r);
        passed.push('reduced motion and idle rendering');
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ passed, errors }));
    }
    finally {
        await b.close();
    }
})();
