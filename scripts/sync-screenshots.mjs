/**
 * Refresh Capricorn OS app-window screenshots from each Cap's v3 gallery.
 *
 *   node scripts/sync-screenshots.mjs
 *
 * For every Cap with a gallery: first iPhone shot in light and dark →
 * assets/screenshots/<slug>.png and <slug>-dark.png (780 px wide, the size the
 * device frame renders at 2×). Windows and iOS sheets pick the one that matches
 * the active theme's base mode.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');
const FLEET = join(LAB, '..');
const REPO = {
  vaultcap: 'VaultCap', pulsecap: 'PulseCap', prismcap: 'PrismCap', steadycap: 'SteadyCap',
  ledgercap: 'LedgerCap', deeponycap: 'DeePonyCap', scentcap: 'ScentCap', soulcap: 'SoulCap',
  travelcap: 'TravelCap', auracap: 'AuraCap', masterycap: 'MasteryCap', ideacap: 'IdeaCap',
  carcap: 'CarCap', cookcap: 'CookCap',
};

const { APPS } = await import(pathToFileURL(join(LAB, 'js', 'products.js')).href);
let n = 0;
for (const app of APPS) {
  const repo = REPO[app.slug];
  if (!repo) continue;
  const dir = join(FLEET, repo, 'docs', 'screenshots', 'gallery');
  let man;
  try { man = JSON.parse(readFileSync(join(dir, 'gallery-manifest.json'), 'utf8')); } catch { continue; }
  for (const [theme, suffix] of [['light', ''], ['dark', '-dark']]) {
    const shot = man.shots?.find((s) => s.theme === theme && s.device === 'iphone' && existsSync(join(dir, s.file)));
    if (!shot) continue;
    const out = join(LAB, 'assets', 'screenshots', `${app.slug}${suffix}.png`);
    // dwebp → PNG, then sips to 780 px wide (macOS); both ship with the dev toolchain here
    const tmp = `${out}.tmp.png`;
    if (spawnSync('dwebp', ['-quiet', join(dir, shot.file), '-o', tmp]).status !== 0) continue;
    spawnSync('sips', ['--resampleWidth', '780', tmp, '--out', out], { stdio: 'ignore' });
    spawnSync('rm', ['-f', tmp]);
    n += 1;
  }
  console.log(`✓ ${app.slug}`);
}
console.log(`${n} screenshots refreshed`);
