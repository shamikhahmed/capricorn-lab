import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assets = join(dist, 'assets');

mkdirSync(assets, { recursive: true });

for (const dir of ['icons', 'screenshots', 'marks', 'fonts']) {
  const src = join('assets', dir);
  if (existsSync(src)) cpSync(src, join(assets, dir), { recursive: true });
}

if (existsSync('assets/logo.svg')) {
  cpSync('assets/logo.svg', join(assets, 'logo.svg'));
}

if (existsSync('assets/og.png')) {
  cpSync('assets/og.png', join(assets, 'og.png'));
}

console.log('Static assets copied to dist/assets/');
