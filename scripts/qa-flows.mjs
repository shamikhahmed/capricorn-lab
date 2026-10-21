/**
 * QA flows — drives the real UI on desktop, iPad and iPhone.
 *
 *   PW_CORE=… node scripts/qa-flows.mjs [baseURL] [outDir] [--engine=chromium|webkit]
 *
 * Desktop: open a Cap window; Appearance → pick a theme; Spotlight; Privacy
 * Monitor; Control Center.
 * Touch: widget → app sheet → Done; Themes sheet; Library; Privacy sheet.
 * Lock screen screenshot per theme on desktop + phone.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const pw = await import(process.env.PW_CORE ? pathToFileURL(join(process.env.PW_CORE, 'index.mjs')).href : 'playwright-core');
const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const BASE = pos[0] || 'http://localhost:4321';
const OUT = pos[1] || 'qa-flows';
const engine = (args.find((a) => a.startsWith('--engine=')) || '--engine=chromium').split('=')[1];
mkdirSync(OUT, { recursive: true });

const results = [];
let failed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`ok   ${name}`);
  } catch (e) {
    failed += 1;
    results.push({ name, ok: false, error: String(e.message || e) });
    console.log(`FAIL ${name} — ${String(e.message || e).split('\n')[0]}`);
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await pw[engine].launch();
const errorsOf = (page) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // hub errors only — embedded Caps report into their own repos
  page.on('console', (m) => {
    const from = m.location()?.url || '';
    if (m.type() === 'error' && from.startsWith(BASE) && !/404|VERSION\.json/.test(m.text())) errs.push(m.text());
  });
  return errs;
};

/* ── Desktop ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  await page.goto(`${BASE}/?nolock=1&theme=capricorn-light`);
  await page.waitForTimeout(1200);

  await step('desktop: dock opens VaultCap window', async () => {
    await page.click('.dock-item[data-slug="vaultcap"]');
    await page.waitForSelector('[data-win-id="vaultcap"] .app-panel', { timeout: 4000 });
  });
  await page.waitForTimeout(900);
  await step('desktop: window drag via pointer', async () => {
    const tb = await page.$('[data-win-id="vaultcap"] .win-titlebar');
    const box = await tb.boundingBox();
    await page.mouse.move(box.x + 200, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, box.y + 60, { steps: 6 });
    await page.mouse.up();
    const box2 = await tb.boundingBox();
    expect(Math.abs(box2.x - box.x - 120) < 4, `drag moved ${box2.x - box.x}`);
  });
  await step('desktop: Appearance window + pick Synthwave', async () => {
    await page.click('.menubar-theme');
    await page.waitForSelector('.appear .skin-card', { timeout: 4000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(OUT, `${engine}-desktop-appearance.png`) });
    await page.click('.appear [data-skin-pick="synthwave"]');
    await page.waitForFunction(() => document.documentElement.dataset.skin === 'synthwave', null, { timeout: 4000 });
    expect(await page.evaluate(() => localStorage.getItem('cap-skin')) === 'synthwave', 'skin not persisted');
  });
  await step('desktop: Spotlight → Theme: Terminal', async () => {
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
    await page.waitForSelector('#palette:not([hidden])', { timeout: 2000 });
    await page.keyboard.type('terminal');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.documentElement.dataset.skin === 'terminal', null, { timeout: 4000 });
  });
  await step('desktop: Privacy Monitor shows 0 third-party', async () => {
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'privacy' } })));
    await page.waitForSelector('[data-pm="third"]', { timeout: 3000 });
    await page.waitForTimeout(600);
    const third = await page.textContent('[data-pm="third"]');
    const first = Number(await page.textContent('[data-pm="first"]'));
    expect(third === '0', `third-party = ${third}`);
    expect(first > 5, `first-party only ${first}`);
    await page.screenshot({ path: join(OUT, `${engine}-desktop-privacy.png`) });
  });
  await step('desktop: Control Center theme row', async () => {
    await page.click('#ccToggle');
    await page.waitForSelector('#ccSkins .cc-skin', { timeout: 2000 });
    expect((await page.$$('#ccSkins .cc-skin')).length === 10, 'expected 10 swatches');
    await page.click('#ccSkins [data-skin-pick="mughal"]');
    await page.waitForFunction(() => document.documentElement.dataset.skin === 'mughal', null, { timeout: 4000 });
    await page.keyboard.press('Escape');
  });
  await step('desktop: no runtime errors', async () => expect(!errs.length, errs.join(' | ')));
  await ctx.close();
}

/* ── Touch surfaces ── */
for (const [name, spec] of Object.entries({
  iphone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})) {
  const ctx = await browser.newContext(spec);
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  await page.goto(`${BASE}/?nolock=1&theme=aurora`);
  await page.waitForTimeout(1200);

  await step(`${name}: widget tap opens app sheet`, async () => {
    await page.tap('.ios-widget--app[data-app-sheet="pulsecap"]');
    await page.waitForSelector('#iosSheet:not([hidden]) .ios-app', { timeout: 3000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(OUT, `${engine}-${name}-appsheet.png`) });
  });
  await step(`${name}: app sheet Done`, async () => {
    await page.tap('#iosSheet [data-close]');
    await page.waitForSelector('#iosSheet', { state: 'hidden', timeout: 3000 });
  });
  await step(`${name}: Themes sheet + pick Truck Art`, async () => {
    await page.tap('#iosThemeToggle');
    await page.waitForSelector('#iosSheet .skin-card', { timeout: 3000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(OUT, `${engine}-${name}-themes.png`) });
    await page.tap('#iosSheet [data-skin-pick="truckart"]');
    await page.waitForFunction(() => document.documentElement.dataset.skin === 'truckart', null, { timeout: 4000 });
    await page.tap('#iosSheet [data-close]');
    await page.waitForSelector('#iosSheet', { state: 'hidden', timeout: 3000 });
  });
  await step(`${name}: Apps page → Library + Privacy`, async () => {
    await page.evaluate(() => { const p = document.getElementById('iosPages'); p.scrollLeft = p.clientWidth; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${engine}-${name}-apps.png`) });
    await page.tap('#iosAppGrid [data-ios-sys="apps"]');
    await page.waitForSelector('#iosSheet .ios-sheet__row', { timeout: 3000 });
    expect((await page.$$('#iosSheet .ios-sheet__row')).length >= 15, 'library short');
    await page.tap('#iosSheet [data-close]');
    await page.waitForSelector('#iosSheet', { state: 'hidden', timeout: 3000 });
    await page.tap('#iosAppGrid [data-ios-sys="privacy"]');
    await page.waitForSelector('#iosSheet [data-pm="third"]', { timeout: 3000 });
    await page.waitForTimeout(500);
    expect((await page.textContent('#iosSheet [data-pm="third"]')) === '0', 'third-party non-zero');
  });
  await step(`${name}: no runtime errors`, async () => expect(!errs.length, errs.join(' | ')));
  await ctx.close();
}

/* ── Lock screens per theme ── */
for (const [name, spec] of Object.entries({
  mac: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})) {
  const ctx = await browser.newContext(spec);
  for (const theme of ['capricorn-light', 'aurora', 'synthwave', 'terminal', 'truckart', 'mughal', 'paper', 'pixel', 'brutal']) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?lock=1&three=0&theme=${theme}`);
    await page.waitForTimeout(1300);
    await step(`lock ${name} ${theme}`, async () => {
      expect(await page.isVisible('#lockScreen'), 'lock hidden');
      await page.screenshot({ path: join(OUT, `${engine}-lock-${name}-${theme}.png`) });
    });
    await page.close();
  }
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, 'flows.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed}/${results.length} flow steps passed`);
process.exit(failed ? 1 : 0);
