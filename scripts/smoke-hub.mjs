/**
 * Local smoke: build exists + catalog versions match expected Tier 1 set.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAB = join(__dirname, '..');
const products = readFileSync(join(LAB, 'js/products.js'), 'utf8');

const EXPECTED = {
  vaultcap: '5.2.1',
  pulsecap: '6.43.0',
  prismcap: '4.5.0',
  steadycap: '2.5.2',
  ledgercap: '3.57.0',
  deeponycap: '3.8.0',
  scentcap: '2.1.0',
  soulcap: '8.2.0',
  travelcap: '1.0.1',
  auracap: '5.4.0',
  masterycap: '51.9.0',
  ideacap: '2.0.0',
  carcap: '1.0.0',
  cookcap: '3.5.0',
  deefoodie: '1.0.0+3',
};

let failed = 0;
for (const [slug, ver] of Object.entries(EXPECTED)) {
  const re = new RegExp(`slug: '${slug}'[\\s\\S]*?ver: '([^']+)'`);
  const m = products.match(re);
  if (!m || m[1] !== ver) {
    console.error(`FAIL ${slug}: expected ${ver}, got ${m?.[1] || 'missing'}`);
    failed++;
  } else {
    console.log(`ok ${slug} ${ver}`);
  }
}

if (!products.includes("privateBeta: true")) {
  console.error('FAIL: DeeFoodie privateBeta missing');
  failed++;
}

if (products.includes('fonts.googleapis')) {
  console.error('FAIL: google fonts still referenced in products');
  failed++;
}

const index = readFileSync(join(LAB, 'index.html'), 'utf8');
if (index.includes('fonts.googleapis')) {
  console.error('FAIL: google fonts in index.html (G-9)');
  failed++;
} else {
  console.log('ok no google fonts');
}

if (!existsSync(join(LAB, 'scripts/deploy-hub.mjs'))) {
  console.error('FAIL: deploy-hub.mjs missing');
  failed++;
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nsmoke-hub: all checks passed');
