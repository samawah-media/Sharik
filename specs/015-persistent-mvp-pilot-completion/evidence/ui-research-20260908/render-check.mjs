// Standalone prototype checks only. Does not start or test the application.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('@playwright/test');
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [1440, 390, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://**/*', route => route.abort());
    await page.route('https://**/*', route => route.abort());
    await page.goto(pathToFileURL(path.join(dir, 'prototype.html')).href);
    for (const screen of ['admin', 'work', 'client']) {
      await page.locator(`[data-screen="${screen}"]`).click();
      await page.locator(`#${screen}`).waitFor({ state: 'visible' });
      const metrics = await page.evaluate(() => ({
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        minButtonHeight: Math.min(...[...document.querySelectorAll('button')]
          .filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect().height)),
      }));
      if (metrics.documentWidth > width || metrics.minButtonHeight < 44 || errors.length) {
        throw new Error(JSON.stringify({ width, screen, metrics, errors }));
      }
      if (width !== 375) await page.screenshot({ path: path.join(dir, `${screen}-${width}.png`), fullPage: true });
      results.push({ screen, ...metrics });
    }
    await page.locator('#client [data-demo]').last().click();
    if (!(await page.locator('[role="status"]').textContent()).includes('ما انحفظ')) throw new Error('Prototype action disclaimer missing');
    await page.locator('[data-screen="work"]').click();
    await page.locator('[data-tab="comments"]').click();
    if (!(await page.locator('#work-tab').textContent()).includes('داخل الفريق فقط')) throw new Error('Internal sample label missing');
    await page.close();
  }
  console.log(JSON.stringify({ status: 'PASS', scope: 'static prototype only', results }, null, 2));
} finally {
  await browser.close();
}
