/**
 * Validates content/stories/*.json against schema.json and featureIds in products.js.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORIES = join(LAB, 'content', 'stories');
const NEEDS = new Set(['family', 'health', 'money', 'travel', 'learning', 'fun']);

let failed = 0;
const fail = (m) => { console.error(`FAIL ${m}`); failed += 1; };
const ok = (m) => console.log(`ok   ${m}`);

function req(obj, keys, ctx) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === '') fail(`${ctx} missing ${k}`);
  }
}

const { APPS } = await import(pathToFileURL(join(LAB, 'js', 'products.js')).href);
const appsBySlug = Object.fromEntries(APPS.map((a) => [a.slug, a]));

if (!existsSync(join(STORIES, 'schema.json'))) {
  fail('schema.json missing');
} else {
  ok('schema.json present');
}

const bundles = readdirSync(STORIES).filter((f) => f.endsWith('.json') && f !== 'schema.json' && !f.startsWith('_'));
if (!bundles.length) fail('no story bundles in content/stories');
else ok(`${bundles.length} story bundle(s)`);

for (const file of bundles) {
  const ctx = file;
  let bundle;
  try {
    bundle = JSON.parse(readFileSync(join(STORIES, file), 'utf8'));
  } catch (e) {
    fail(`${ctx} invalid JSON: ${e.message}`);
    continue;
  }
  req(bundle, ['slug', 'fictional', 'disclaimer', 'personas'], ctx);
  if (bundle.fictional !== true) fail(`${ctx} fictional must be true`);
  const DISCLAIMER = 'Illustrative story. People and data are fictional.';
  if (String(bundle.disclaimer || '').trim() !== DISCLAIMER) {
    fail(`${ctx} disclaimer must be exactly: ${DISCLAIMER}`);
  }
  const app = appsBySlug[bundle.slug];
  if (!app) fail(`${ctx} unknown slug ${bundle.slug}`);
  if (!Array.isArray(bundle.personas) || !bundle.personas.length) fail(`${ctx} personas empty`);

  const featureIds = new Set(app?.featureIds || []);
  for (const p of bundle.personas) {
    const pc = `${ctx} ${p.id || '?'}`;
    req(p, ['id', 'name', 'age', 'city', 'goal', 'headline', 'summary', 'day', 'before', 'after', 'video', 'features_used', 'quote', 'fictional', 'needs'], pc);
    if (p.fictional !== true) fail(`${pc} fictional must be true`);
    for (const n of p.needs || []) {
      if (!NEEDS.has(n)) fail(`${pc} invalid need ${n}`);
    }
    for (const fid of p.features_used || []) {
      if (!featureIds.has(fid)) fail(`${pc} features_used "${fid}" not in products.featureIds for ${bundle.slug}`);
    }
    for (const step of p.day || []) {
      req(step, ['time', 'title', 'text', 'shot', 'alt'], `${pc} day step`);
    }
    req(p.video, ['mp4', 'webm', 'vtt', 'poster', 'transcript'], `${pc} video`);
  }
  ok(`${ctx} valid (${bundle.personas.length} personas)`);
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nvalidate-stories: all checks passed');
