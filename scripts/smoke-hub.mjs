/**
 * Smoke gate (npm test) — fast, no browser.
 *  - catalog: every Cap present with a version; DeeFoodie stays private beta
 *  - themes: registry ↔ wallpaper painters ↔ CSS token blocks ↔ inline boot map
 *  - privacy: no third-party URLs loaded by the hub (fonts, CDNs, analytics)
 *  - honesty: retired claims never come back
 * Browser QA lives in scripts/qa-matrix.mjs + scripts/qa-flows.mjs.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(LAB, p), 'utf8');
let failed = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const fail = (msg) => { console.error(`FAIL ${msg}`); failed += 1; };
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

/* catalog */
const products = read('js/products.js');
const SLUGS = ['vaultcap', 'pulsecap', 'steadycap', 'ledgercap', 'deeponycap', 'scentcap', 'soulcap', 'travelcap', 'masterycap', 'ideacap', 'carcap', 'cookcap', 'deefoodie'];
for (const slug of SLUGS) {
  const m = products.match(new RegExp(`slug: '${slug}'[\\s\\S]*?ver: '([^']+)'`));
  check(m && /^\d+\.\d+/.test(m[1]), `catalog ${slug} ${m?.[1] || 'missing'}`);
}
check(/slug: 'deefoodie'[\s\S]*?privateBeta: true/.test(products), 'DeeFoodie is private beta');

/* themes */
const theme = read('js/theme.js');
const ids = [...theme.matchAll(/id: '([a-z-]+)',\n\s+name:/g)].map((m) => m[1]);
check(ids.length === 10, `theme registry has 10 skins (${ids.join(', ')})`);
const wallpaper = read('js/wallpaper.js');
const painterBlock = wallpaper.slice(wallpaper.indexOf('const PAINTERS = {'), wallpaper.indexOf('};', wallpaper.indexOf('const PAINTERS = {')));
const themesCss = read('css/themes.css');
const tokensCss = read('css/tokens.css');
const index = read('index.html');
const boot = index.slice(index.indexOf('var MODES'), index.indexOf('var ALIAS'));
for (const id of ids) {
  const key = id.includes('-') ? `'${id}'` : id;
  check(painterBlock.includes(key), `painter for ${id}`);
  check(themesCss.includes(`[data-skin="${id}"]`) || tokensCss.includes(`[data-skin="${id}"]`), `CSS tokens for ${id}`);
  check(boot.includes(id.includes('-') ? `'${id}'` : `${id}:`), `inline boot map knows ${id}`);
}

/* privacy — nothing the hub loads may point off-origin */
const allowed = /^https:\/\/(shamikhahmed\.github\.io|github\.com|www\.chromestatus\.com)/;
const sources = ['index.html', ...readdirSync(join(LAB, 'js')).map((f) => `js/${f}`), ...readdirSync(join(LAB, 'css')).map((f) => `css/${f}`)];
const loaders = /(?:src|href)=["'](https?:[^"']+)|url\(\s*["']?(https?:[^"')]+)|import\s*\(\s*["'](https?:[^"']+)|fetch\(\s*["'`](https?:[^"'`]+)/g;
let offenders = [];
for (const f of sources) {
  const txt = read(f);
  for (const m of txt.matchAll(loaders)) {
    const url = m[1] || m[2] || m[3] || m[4];
    // plain <a href> links to the user's own pages / GitHub are navigation, not loads
    if (!allowed.test(url)) offenders.push(`${f}: ${url}`);
  }
}
offenders = offenders.filter((o) => !/<a /.test(o));
check(!offenders.length, `no third-party loads${offenders.length ? ` — ${offenders.join(' | ')}` : ''}`);
check(!/fonts\.googleapis|fonts\.gstatic/.test(sources.map(read).join('\n')), 'no Google Fonts (G-9)');

/* honesty — retired claims */
const all = sources.map(read).join('\n');
check(!/Living Mind|LMM/.test(all), 'no "Living Mind" / LMM overclaim (SoulCap)');
check(!/0 bytes sent|Zero servers contacted/.test(all), 'no unmeasured "0 bytes sent" claims (Privacy Monitor measures instead)');

check(existsSync(join(LAB, 'scripts/deploy-hub.mjs')), 'deploy-hub.mjs present');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nsmoke-hub: all checks passed');
