/**
 * Deploy Capricorn OS (capricorn-lab) → shamikhahmed.github.io root.
 * Preserves legacy product HTML + products-data.js + Cap PWA folders.
 * Canonical per DECISIONS D-13.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAB = join(__dirname, '..');
const HUB = join(LAB, '..', 'shamikhahmed.github.io');

function sh(cmd, cwd = LAB) {
  console.log('>', cmd);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

sh('npm run build');

const dist = join(LAB, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/index.html missing');

const hubAssets = join(HUB, 'assets');
mkdirSync(hubAssets, { recursive: true });

for (const f of readdirSync(hubAssets)) {
  if (/^index-.*\.(js|css)$/.test(f) || /^lock-sphere-.*\.js$/.test(f) || /^logo-.*\.svg$/.test(f)) {
    rmSync(join(hubAssets, f), { force: true });
    console.log('removed stale', f);
  }
}

cpSync(join(dist, 'index.html'), join(HUB, 'index.html'));
const distAssets = join(dist, 'assets');
for (const f of readdirSync(distAssets)) {
  cpSync(join(distAssets, f), join(hubAssets, f), { recursive: true });
}

for (const dir of ['marks', 'icons', 'screenshots', 'fonts']) {
  const src = join(LAB, 'assets', dir);
  if (existsSync(src)) cpSync(src, join(hubAssets, dir), { recursive: true });
}
if (existsSync(join(LAB, 'assets/logo.svg'))) {
  cpSync(join(LAB, 'assets/logo.svg'), join(hubAssets, 'logo.svg'));
}
if (existsSync(join(LAB, 'assets/og.png'))) {
  cpSync(join(LAB, 'assets/og.png'), join(hubAssets, 'og.png'));
}

console.log('Deploy copy complete →', HUB);
