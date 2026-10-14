/**
 * QA matrix — every theme × device, real engines (Chromium + WebKit).
 *
 *   node scripts/qa-matrix.mjs [baseURL] [outDir] [--engine=webkit|chromium|both] [--themes=a,b] [--devices=a,b]
 *
 * Default baseURL http://localhost:4321 (npm run dev). Writes screenshots +
 * report.json to outDir and exits 1 on any console error, page error,
 * horizontal overflow, or clipped widget CTA.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// PW_CORE=/path/to/node_modules/playwright-core lets you match whichever
// browser builds are installed locally (~/Library/Caches/ms-playwright).
const { chromium, webkit } = await import(process.env.PW_CORE ? pathToFileURL(join(process.env.PW_CORE, 'index.mjs')).href : 'playwright-core');

const args = process.argv.slice(2);
const flag = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const pos = args.filter((a) => !a.startsWith('--'));
const BASE = pos[0] || 'http://localhost:4321';
const OUT = pos[1] || 'qa-out';
const ENGINES = flag('engine', 'both');

const THEMES = ['capricorn-light', 'capricorn-dark', 'aurora', 'synthwave', 'terminal', 'truckart', 'mughal', 'paper', 'pixel', 'brutal'];
const DEVICES = {
  'iphone': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, expect: 'mobile' },
  'iphone-se': { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, expect: 'mobile' },
  'ipad-portrait': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, expect: 'tablet' },
  'ipad-landscape': { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, expect: 'tablet' },
  'macbook': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, expect: 'desktop' },
  'macbook-short': { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, expect: 'desktop' },
  'desktop-xl': { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, expect: 'desktop' },
};

const pickThemes = flag('themes', '') ? flag('themes').split(',') : THEMES;
const pickDevices = flag('devices', '') ? flag('devices').split(',') : Object.keys(DEVICES);

// Known-benign noise: apps without VERSION.json yet (live catalog falls back).
const IGNORE = [/VERSION\.json/, /Failed to load resource: the server responded with a status of 404/];

mkdirSync(OUT, { recursive: true });
const report = [];
let failures = 0;

async function runEngine(name, launcher) {
  const browser = await launcher.launch();
  for (const dev of pickDevices) {
    const spec = DEVICES[dev];
    const ctx = await browser.newContext({ ...spec, expect: undefined, ...(name === 'webkit' ? {} : {}) });
    for (const theme of pickThemes) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => {
        if (!/VERSION\.json/.test(r.url())) errors.push(`requestfailed: ${r.url()}`);
      });
      await page.goto(`${BASE}/?nolock=1&theme=${theme}`, { waitUntil: 'load' });
      await page.waitForTimeout(1600);

      const check = await page.evaluate(() => {
        const view = document.documentElement.dataset.view;
        const skin = document.documentElement.dataset.skin;
        const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
        const clipped = [...document.querySelectorAll('.mw__cta')].filter((c) => {
          const mw = c.closest('.mw');
          if (!mw || mw.offsetParent === null) return false;
          const r = c.getBoundingClientRect();
          const b = mw.getBoundingClientRect();
          return r.bottom > b.bottom + 1 || r.right > b.right + 1;
        }).map((c) => c.textContent.trim());
        const dockIcons = [...document.querySelectorAll('.ios-dock__icon:not(.ios-dock__icon--lib), .dock-icon')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width < 24 || Math.abs(r.width - r.height) > 2).length;
        const wall = document.querySelector(view === 'desktop' ? '#wallpaper' : '#iosWallpaper');
        let wallPainted = false;
        if (wall) {
          const c = wall.getContext('2d');
          const d = c.getImageData((wall.width / 2) | 0, (wall.height * 0.3) | 0, 1, 1).data;
          wallPainted = d[3] > 0;
        }
        return { view, skin, overflowX, clipped, badDockIcons: dockIcons, wallPainted };
      });

      const file = `${name}-${dev}-${theme}.png`;
      await page.screenshot({ path: join(OUT, file) });
      const problems = [];
      if (check.view !== spec.expect) problems.push(`view ${check.view} ≠ ${spec.expect}`);
      if (check.skin !== theme) problems.push(`skin ${check.skin} ≠ ${theme}`);
      if (check.overflowX) problems.push('horizontal overflow');
      if (check.clipped.length) problems.push(`clipped CTA: ${check.clipped.join(', ')}`);
      if (check.badDockIcons) problems.push(`${check.badDockIcons} squashed dock icon(s)`);
      if (!check.wallPainted) problems.push('wallpaper not painted');
      problems.push(...errors);
      if (problems.length) failures += 1;
      report.push({ engine: name, device: dev, theme, file, ...check, problems });
      console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name.padEnd(8)} ${dev.padEnd(15)} ${theme.padEnd(16)} ${problems.join(' | ')}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
}

if (ENGINES === 'both' || ENGINES === 'chromium') await runEngine('chromium', chromium);
if (ENGINES === 'both' || ENGINES === 'webkit') await runEngine('webkit', webkit);

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.length - failures}/${report.length} passed → ${OUT}`);
process.exit(failures ? 1 : 0);
