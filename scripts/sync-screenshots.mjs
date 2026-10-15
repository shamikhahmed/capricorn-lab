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
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');
const FLEET = join(LAB, '..');
const IPHONE_R = 2.164; // 393 × 852 viewport
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
    const src = join(dir, shot.file);
    // Full-page captures (taller than an iPhone viewport) keep their first screen only.
    const px = (spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src], { encoding: 'utf8' }).stdout || '').match(/\d+/g)?.slice(-2).map(Number);
    const crop = px && px[1] / px[0] > IPHONE_R * 1.03 ? ['-crop', '0', '0', String(px[0]), String(Math.round(px[0] * IPHONE_R))] : [];
    // cwebp (crop + 780 px wide) → dwebp → PNG; both ship with the dev toolchain here
    const tmp = `${out}.tmp.webp`;
    const ok = spawnSync('cwebp', ['-quiet', '-q', '92', ...crop, '-resize', '780', '0', src, '-o', tmp]).status === 0
      && spawnSync('dwebp', ['-quiet', tmp, '-o', out]).status === 0;
    rmSync(tmp, { force: true });
    if (!ok) continue;
    n += 1;
  }
  console.log(`✓ ${app.slug}`);
}
console.log(`${n} screenshots refreshed`);
