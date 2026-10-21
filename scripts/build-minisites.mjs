/**
 * Capricorn mini-sites — one page per Cap at shamikhahmed.github.io/apps/<slug>/.
 *
 *   node scripts/build-minisites.mjs            (also run by npm run deploy:hub)
 *
 * Inputs (all local, sibling repos under Cap-Apps/):
 *   - js/products.js                     catalog: name, accent, pitch, features, highlights
 *   - <Repo>/VERSION.json                version (refreshed at runtime from the live app too)
 *   - <Repo>/CHANGELOG.md                latest release version + date
 *   - <Repo>/docs/screenshots/gallery/   v3 gallery manifest + WebP shots (light/dark × iphone/ipad/mac)
 *   - copy below                         §4.1 descriptions, §4.2 disclaimers, privacy facts, FAQs
 *
 * Output: apps/<slug>/index.html + shots/ + og.png, apps/index.html, apps/assets/{minisite.css,
 * minisite.js,icons/}, legacy <slug>.html redirects, sitemap entries.
 *
 * Every page: designed light AND dark from the app's own colours (contrast-checked here),
 * device-framed scrollable gallery (iPhone · iPad · Mac, Light · Dark, lightbox), "every screen"
 * tour, measured privacy, install guide, FAQ, latest release. No third-party requests, no frameworks.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  loadStoryBundles,
  buildStoriesForApp,
  renderWhoUses,
  renderStoriesIndex,
} from './minisite/stories-build.mjs';

const LAB = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(LAB, 'content');
const FLEET = join(LAB, '..');
const HUB = join(FLEET, 'shamikhahmed.github.io');
const OUT = join(HUB, 'apps');
const BASE = 'https://shamikhahmed.github.io';

const REPO = {
  vaultcap: 'VaultCap', pulsecap: 'PulseCap', steadycap: 'SteadyCap',
  ledgercap: 'LedgerCap', deeponycap: 'DeePonyCap', scentcap: 'ScentCap', soulcap: 'SoulCap',
  travelcap: 'TravelCap', masterycap: 'MasteryCap', ideacap: 'IdeaCap',
  carcap: 'CarCap', cookcap: 'CookCap', deefoodie: 'DeeFoodieApp',
};

/* ── Approved copy (DECISIONS.md §4.1 / §4.2) ─────────────────────────── */

const DESC = {
  carcap: 'Service, fuel and documents for your cars.',
  cookcap: 'Your family cookbook, kept like a real book.',
  deefoodie: 'A private journal of where you eat in Karachi.',
  deeponycap: 'Track your collection, shelves and wishlist.',
  ideacap: 'Capture ideas by voice or text. They stay on your device.',
  ledgercap: 'Track your PSX stocks and mutual funds in one place.',
  masterycap: 'Learn trading and software step by step, in English or Roman Urdu.',
  pulsecap: 'Plan, log and track your training. Works offline.',
  scentcap: 'Your fragrance collection, and what to wear today.',
  soulcap: 'Quiet tools to steady yourself. Not therapy.',
  steadycap: 'Routines, medicines and support for recovery.',
  travelcap: 'Trips, tickets and travel documents in one place.',
  vaultcap: 'Everything you own, encrypted on your device.',
};

const DISCLAIMER = {
  soulcap: "SoulCap offers self-help tools. It isn't therapy, medical advice, a diagnosis or a crisis service.",
  steadycap: "SteadyCap helps you keep track of routines and cravings. It isn't medical advice. Follow your doctor's or pharmacist's instructions for any medicine.",
  pulsecap: 'PulseCap gives general training guidance, not medical advice. Stop and get medical help if you feel pain, dizziness or chest discomfort.',
  ledgercap: 'LedgerCap is for tracking and education. Prices may be delayed or indicative. Nothing here is investment advice.',
  masterycap: 'MasteryCap is educational. Nothing here is financial advice. Certificates are self-issued and not accredited.',
  vaultcap: "Your vault is encrypted on this device with your PIN. If you forget it, your data can't be recovered — keep an export somewhere safe.",
  cookcap: 'Nutrition values are estimates.',
  travelcap: 'Always check official sources for visas, entry rules and flight times.',
  scentcap: "Brand names belong to their owners. ScentCap isn't affiliated with any fragrance house.",
  deeponycap: "DeePonyCap is an independent collection tracker and isn't affiliated with or endorsed by any toy company.",
};

/** Privacy, from each app's own privacy page (what may leave the device, and when). */
const PRIVACY = {
  vaultcap: { stays: 'Accounts, cards, documents, family profiles and backups — encrypted with AES-256-GCM before they are saved.', network: [['Nothing by default', 'Optional Smart Import parsing goes to a Capricorn Cloudflare Worker only if you turn it on in Settings → Import.']] },
  pulsecap: { stays: 'Workouts, plans, PRs, body measurements, progress photos and nutrition.', network: [['Nothing for your data', 'Optional voice logging uses your browser’s speech service, which may process audio — type instead if you prefer.']] },
  steadycap: { stays: 'Routines, medicines, check-ins, journal and recovery timelines.', network: [['Nothing', 'No sync server, no analytics — SOS works offline.']] },
  ledgercap: { stays: 'Holdings, transactions, watchlists, notes and settings.', network: [['Capricorn price Worker', 'Ticker queries for indicative PSX, fund, FX and news data when you open market screens. Your portfolio is never sent.']] },
  deeponycap: { stays: 'Your catalog, series, shelf photos, wishlist and backups.', network: [['Nothing', 'Photos stay in this browser’s storage on your device.']] },
  scentcap: { stays: 'Bottles, wear log, notes, layering combos and photos you add.', network: [['Open-Meteo', 'A city or your location — only after you enter a city or tap “Use my location” — for weather-aware picks.'], ['Optional catalog search', 'Search words, only when you look up a bottle.']] },
  soulcap: { stays: 'Check-ins, journal, people map, techniques and favourites.', network: [['Nothing', 'The app makes no third-party requests. Help numbers ship inside the app.']] },
  travelcap: { stays: 'Trips, tickets, documents, budgets, packing lists and memories.', network: [['Nominatim (OpenStreetMap)', 'Place and hotel searches you type.'], ['OpenStreetMap tiles', 'Map images for your stamps map.'], ['Open-Meteo', 'Weather for packing hints.'], ['AviationStack (optional)', 'Flight lookups — only with your own key.']] },
  masterycap: { stays: 'Progress, quiz answers, records and certificates.', network: [['Nothing', 'No third-party learning APIs.']] },
  ideacap: { stays: 'Notes, recordings, tags, summaries, folders and reminders.', network: [['Nothing by default', 'Voice is transcribed on the device when your phone supports it. On the web you type.']] },
  carcap: { stays: 'Vehicles, service log, fuel entries and documents.', network: [['Nothing', 'CarCap makes no network calls for your data.']] },
  cookcap: { stays: 'Your cookbook, favourites, notes, shopping list, meal plan and profiles.', network: [['Nothing', 'Recipes and pictures ship with the app.']] },
  deefoodie: { stays: 'Visits, photos, ratings and collections on your devices.', network: [['Private beta sync', 'Between invited devices only. Details in the beta privacy notice you receive with your invite.']] },
};

/** App-specific FAQ (shared ones are added for every app). */
const FAQ = {
  vaultcap: [['What if I forget my PIN?', DISCLAIMER.vaultcap], ['Can my family use it?', 'Yes — family vault profiles keep each person’s records separate and encrypted.']],
  pulsecap: [['Is Smart Coach an AI?', 'No. Smart Coach is rules applied to your own training history, on your phone.'], ['Do I need a wearable?', 'No. Recovery readiness comes from your logs and check-ins.'], ['Is this medical advice?', DISCLAIMER.pulsecap]],
  steadycap: [['Is this medical advice?', DISCLAIMER.steadycap], ['Does it count streaks?', 'No. SteadyCap tracks progress without streak pressure.'], ['Where is SOS?', 'The centre tab, from every screen — it works offline.']],
  ledgercap: [['Are prices live?', 'Prices are indicative and may be delayed. ' + DISCLAIMER.ledgercap], ['Does it support Urdu?', 'Yes — English, اردو and Roman Urdu, in Settings → General.']],
  deeponycap: [['Is it affiliated with a toy brand?', DISCLAIMER.deeponycap], ['Can I export my collection?', 'Yes — a full backup or a CSV, from Settings.']],
  scentcap: [['Is ScentCap affiliated with perfume brands?', DISCLAIMER.scentcap], ['How does it pick today’s scent?', 'Rules that use your wardrobe, what you wore recently and — if you allow it — the weather.']],
  soulcap: [['Is SoulCap therapy?', DISCLAIMER.soulcap], ['What if I need help now?', 'Open Help from any screen for region-aware crisis numbers. If you are in danger, call your local emergency number.']],
  travelcap: [['Can I book flights in TravelCap?', 'No. TravelCap organises trips you have booked. ' + DISCLAIMER.travelcap], ['Can I lock my documents?', 'Yes — an optional app lock protects your travel documents.']],
  masterycap: [['Are the certificates accredited?', DISCLAIMER.masterycap], ['Which languages?', 'English and Roman Urdu, switchable in every lesson.']],
  ideacap: [['Is my voice sent to the cloud?', 'Not by IdeaCap. Native apps transcribe on the device; on the web you type your idea.'], ['Can I organise ideas?', 'Yes — folders, tags and soft reminders.']],
  carcap: [['Will it remind me about service?', 'Reminders work while CarCap is installed on your Home Screen. Your phone may delay them.'], ['Can I track more than one car?', 'Yes — add as many vehicles as you like.']],
  cookcap: [['Are nutrition values exact?', DISCLAIMER.cookcap], ['Can I add our own recipes?', 'Yes — import or add family recipes, and they stay in your book on this device.']],
  deefoodie: [['How do I join?', 'DeeFoodie is a private beta for invited devices. There is no public install.']],
};

/* ── colour ──────────────────────────────────────────────────────────── */

const hex2rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));
const lum = (h) => { const [r, g, b] = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** Move `c` toward `toward` until it reaches `ratio` against `bg`. */
function reach(c, bg, ratio, toward) {
  let t = 0;
  let out = c;
  while (contrast(out, bg) < ratio && t < 1) { t += 0.04; out = mix(c, toward, t); }
  return out;
}

function palette(app) {
  const accent = app.accent;
  const darkBase = lum(app.bg) < 0.06 ? app.bg : mix(accent, '#07070a', 0.9);
  const dark = {
    bg: darkBase,
    surface: mix(darkBase, '#ffffff', 0.05),
    surface2: mix(darkBase, '#ffffff', 0.09),
    line: mix(darkBase, '#ffffff', 0.14),
    ink: '#f6f4ef',
    dim: mix('#f6f4ef', darkBase, 0.34),
  };
  dark.accent = reach(accent, dark.surface2, 4.6, '#ffffff'); // cards are the lightest dark surface
  const lightBase = mix('#fbfaf7', accent, 0.045);
  const light = {
    bg: lightBase,
    surface: '#ffffff',
    surface2: mix('#f4f2ed', accent, 0.06),
    line: mix('#e4e1da', accent, 0.08),
    ink: '#16161a',
    dim: '#55555d',
  };
  // accent text sits on bg, white cards and tinted surface2 — clear 4.5:1 on the weakest of them
  const weakest = [light.bg, light.surface, light.surface2].reduce((w, c) => (contrast(accent, c) < contrast(accent, w) ? c : w));
  light.accent = reach(accent, weakest, 4.6, '#000000');
  // Button fill: the brand colour itself, with whichever label colour reads best.
  for (const p of [dark, light]) {
    const fill = p === dark ? reach(accent, darkBase, 3, '#ffffff') : reach(accent, '#ffffff', 3, '#000000');
    p.fill = fill;
    p.onFill = contrast(fill, '#ffffff') >= 4.5 ? '#ffffff' : '#111114';
    if (contrast(fill, p.onFill) < 4.5) p.fill = p.onFill === '#ffffff' ? reach(fill, '#ffffff', 4.5, '#000000') : reach(fill, '#111114', 4.5, '#ffffff');
  }
  return { dark, light, glow: accent, glow2: app.accent2 || accent };
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const readText = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function latestRelease(md) {
  for (const block of md.split(/^##\s+/m).slice(1)) {
    const head = (block.split(/\r?\n/)[0] || '').trim();
    const v = head.match(/^\[?v?(\d+\.\d+(?:\.\d+)?(?:\+\d+)?)\]?/);
    const date = (head.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (v) return [{ v: v[1], date: date || '' }];
  }
  return [];
}

const DEVICE_W = { iphone: 600, ipad: 1000, mac: 1200 };
const DEVICE_R = { iphone: 2.164, ipad: 0.695, mac: 0.625 }; // viewport height ÷ width

/** Real pixel size (manifests can be stale). */
function pixelSize(file) {
  const out = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' }).stdout || '';
  const w = Number((out.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  const h = Number((out.match(/pixelHeight:\s*(\d+)/) || [])[1]);
  return w && h ? { w, h } : null;
}

/** cwebp args that keep the first viewport of a full-page capture (top crop to the device ratio). */
function viewportCrop(file, device, hint) {
  const r = DEVICE_R[device];
  if (!r || (hint?.w && hint?.h && hint.h / hint.w <= r * 1.03)) return [];
  const px = pixelSize(file);
  if (!px || px.h / px.w <= r * 1.03) return [];
  return ['-crop', '0', '0', String(px.w), String(Math.round(px.w * r))];
}

/** Copy + downsize gallery shots into apps/<slug>/shots/. Returns shot records for the page. */
function ingestGallery(repoPath, slug) {
  const dir = join(repoPath, 'docs', 'screenshots', 'gallery');
  const man = readJson(join(dir, 'gallery-manifest.json'));
  if (!man?.shots?.length) return Object.assign([], { schemes: [], schemeNote: '' });
  const dest = join(OUT, slug, 'shots');
  rmSync(dest, { recursive: true, force: true });
  const seen = new Set();
  const pixels = new Set(); // identical captures (e.g. a language toggle that didn't change the screen)
  const shots = [];
  for (const s of man.shots) {
    if (!['light', 'dark'].includes(s.theme) || !DEVICE_W[s.device]) continue;
    const src = join(dir, s.file);
    if (!existsSync(src)) continue;
    const digest = `${s.theme}/${s.device}/${createHash('md5').update(readFileSync(src)).digest('hex')}`;
    if (pixels.has(digest)) continue;
    pixels.add(digest);
    const id = slugify(s.id || `${s.group}-${s.screen}-${s.state || ''}`);
    const key = `${s.theme}/${s.device}/${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rel = `shots/${s.theme}/${s.device}/${id}.webp`;
    mkdirSync(dirname(join(OUT, slug, rel)), { recursive: true });
    const crop = viewportCrop(src, s.device, s);
    const r = spawnSync('cwebp', ['-quiet', ...crop, '-resize', String(DEVICE_W[s.device]), '0', '-q', '72', '-m', '6', src, '-o', join(OUT, slug, rel)]);
    if (r.status !== 0) cpSync(src, join(OUT, slug, rel));
    const ratio = crop.length ? Number(crop[4]) / Number(crop[3]) : s.w && s.h ? s.h / s.w : DEVICE_R[s.device];
    shots.push({
      id, group: s.group || 'Screens', screen: s.screen || id, caption: s.caption || '',
      theme: s.theme, device: s.device, src: rel, w: DEVICE_W[s.device], h: Math.round(DEVICE_W[s.device] * ratio),
    });
  }
  shots.schemes = [...new Set(shots.map((x) => x.theme))];
  shots.schemeNote = man.schemeNote || '';
  return shots;
}

/* ── page ────────────────────────────────────────────────────────────── */

function themeVars(p) {
  return `--bg:${p.bg};--surface:${p.surface};--surface2:${p.surface2};--line:${p.line};--ink:${p.ink};--dim:${p.dim};--accent:${p.accent};--fill:${p.fill};--on-fill:${p.onFill}`;
}

function head({ title, desc, canonical, og, pal, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="${pal.light.bg}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${pal.dark.bg}" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Capricorn Systems">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
${og ? `<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image" content="${og}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="/apps/assets/minisite.css">
<style>:root{${themeVars(pal.light)};--glow:${pal.glow};--glow2:${pal.glow2}}
html[data-theme="dark"]{${themeVars(pal.dark)};color-scheme:dark}
@media (prefers-color-scheme: dark){html:not([data-theme="light"]){${themeVars(pal.dark)};color-scheme:dark}}</style>
<script>try{var t=localStorage.getItem('cap-ms-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
${extra}
</head>`;
}

function topbar(app, links = true, storyNav = false) {
  const sectionNav = storyNav
    ? '<a href="#stories">Examples</a><a href="#screens">Screens</a><a href="#features">Features</a><a href="#privacy">Privacy</a><a href="#install">Install</a><a href="#faq">FAQ</a>'
    : '<a href="#screens">Screens</a><a href="#features">Features</a><a href="#privacy">Privacy</a><a href="#install">Install</a><a href="#faq">FAQ</a>';
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="/" aria-label="Capricorn OS home"><img src="/assets/logo.svg" alt="" width="22" height="22"><span>Capricorn</span></a>
  ${links ? `<nav class="top__nav" aria-label="Sections">${sectionNav}</nav>` : '<nav class="top__nav" aria-label="Site"><a href="/">Capricorn OS</a><a href="/stories/">Examples</a><a href="/support.html">Support</a></nav>'}
  <div class="seg seg--theme" role="group" aria-label="Colour scheme">
    <button type="button" data-scheme="auto" aria-pressed="true">Auto</button><button type="button" data-scheme="light" aria-pressed="false">Light</button><button type="button" data-scheme="dark" aria-pressed="false">Dark</button>
  </div>
  ${app && !app.privateBeta ? `<a class="btn btn--fill btn--sm top__cta" href="${esc(app.url)}">Open</a>` : ''}
</header>`;
}

function deviceFigure(shot, cls = '') {
  if (!shot) return '';
  return `<figure class="dev dev--${shot.device} ${cls}">
    ${shot.device === 'mac' ? '<span class="dev__bar" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}
    <img src="${esc(shot.src)}" alt="${esc(shot.screen)} screen" width="${shot.w}" height="${shot.h}" decoding="async" ${cls.includes('eager') ? 'fetchpriority="high"' : 'loading="lazy"'}>
  </figure>`;
}

function heroVisual(shots) {
  const pick = (theme, device) => shots.find((s) => s.theme === theme && s.device === device)
    || shots.find((s) => s.device === device); // single-scheme apps show their one look in both page schemes
  const out = [];
  for (const theme of ['light', 'dark']) {
    const phone = pick(theme, 'iphone');
    const mac = pick(theme, 'mac');
    out.push(`<div class="hero__visual" data-shot-theme="${theme}" aria-hidden="true">
      ${mac ? deviceFigure(mac, 'hero__mac eager') : ''}${phone ? deviceFigure(phone, 'hero__phone eager') : ''}
    </div>`);
  }
  return out.join('');
}

function renderApp(app, ctx) {
  const { version, shots, log, pal, others, storyBundle } = ctx;
  const desc = DESC[app.slug] || app.tagline;
  const priv = PRIVACY[app.slug];
  const repo = REPO[app.slug];
  const groups = [];
  const tourTheme = shots.schemes?.includes('light') ? 'light' : 'dark';
  for (const s of shots.filter((x) => x.theme === tourTheme && x.device === 'iphone')) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    if (!g.items.some((i) => i.screen === s.screen)) g.items.push(s);
  }
  const screenCount = groups.reduce((n, g) => n + g.items.length, 0);
  const faq = [
    ['Is it free?', app.privateBeta ? 'DeeFoodie is free for invited beta testers.' : 'Yes. Every feature, no ads, no subscriptions, no account.'],
    ['Where is my data?', `${priv.stays} It lives in this browser on this device — clearing site data erases it, so export a backup first.`],
    ...(FAQ[app.slug] || []),
    ...(app.privateBeta ? [] : [['Does it work offline?', app.slug === 'ledgercap' ? 'Your portfolio does. Market prices need a connection.' : app.slug === 'travelcap' ? 'Your trips and documents do. Search, maps and weather need a connection.' : 'Yes, after the first visit.']]),
  ];
  const data = JSON.stringify(shots).replace(/</g, '\\u003c');
  const hasStories = Boolean(storyBundle?.personas?.length);
  return `${head({ title: `${app.name} — ${desc}`, desc: `${desc} ${app.pitch}`, canonical: `${BASE}/apps/${app.slug}/`, og: `${BASE}/apps/${app.slug}/og.png`, pal,
    extra: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: app.name, description: desc, applicationCategory: app.category, operatingSystem: 'Web, iOS, iPadOS, macOS, Android (PWA)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, softwareVersion: version, url: app.url || `${BASE}/apps/${app.slug}/`, publisher: { '@type': 'Organization', name: 'Capricorn Systems' } })}</script>` })}
<body data-app="${esc(app.slug)}" data-repo="${esc(repo)}">
${topbar(app, true, hasStories)}
<main id="main">
  <section class="hero" aria-labelledby="h1">
    <div class="hero__text">
      <img class="hero__icon" src="/apps/assets/icons/${esc(app.slug)}.svg" alt="" width="88" height="88">
      <p class="eyebrow">${esc(app.category)}${app.privateBeta ? ' · Private beta' : ''}</p>
      <h1 id="h1">${esc(app.name)}</h1>
      <p class="hero__lead">${esc(desc)}</p>
      <p class="hero__pitch">${esc(app.pitch)}</p>
      <div class="hero__cta">
        ${app.privateBeta
          ? `<a class="btn btn--fill" href="/support.html#deefoodie">Ask about the beta</a>`
          : `<a class="btn btn--fill" href="${esc(app.url)}">Open ${esc(app.name)}</a><a class="btn btn--ghost" href="/apps/${esc(app.slug)}/#who-h">Example stories</a>`}
      </div>
      <p class="hero__meta"><span class="chip"><span class="dot" aria-hidden="true"></span><span data-live-version="${esc(version)}">v${esc(version)}</span></span><span>Free</span><span>No account</span><span>No ads or analytics</span></p>
    </div>
    ${heroVisual(shots)}
  </section>

  ${hasStories ? renderWhoUses(app, storyBundle, esc) : ''}

  <section class="band" aria-label="Highlights">
    ${(app.highlights || []).map((h) => `<span>${esc(h)}</span>`).join('')}
  </section>

  ${shots.length ? `<section class="section" id="screens" aria-labelledby="screens-h">
    <div class="section__head">
      <div><h2 id="screens-h">Every screen</h2><p>${screenCount} screens from ${esc(app.name)} ${esc(version)}, captured ${shots.schemes.length > 1 ? 'in light and dark ' : ''}on iPhone${shots.some((x) => x.device === 'ipad') ? ', iPad' : ''} and Mac.${shots.schemeNote ? ` ${esc(shots.schemeNote)}` : ''}</p></div>
      <div class="gallery__tools">
        <div class="seg" role="group" aria-label="Device" data-gal="device"><button type="button" data-v="iphone" aria-pressed="true">iPhone</button><button type="button" data-v="ipad" aria-pressed="false">iPad</button><button type="button" data-v="mac" aria-pressed="false">Mac</button></div>
        ${shots.schemes.length > 1 ? '<div class="seg" role="group" aria-label="Screenshot colours" data-gal="theme"><button type="button" data-v="light" aria-pressed="true">Light</button><button type="button" data-v="dark" aria-pressed="false">Dark</button></div>' : ''}
      </div>
    </div>
    <div class="groups" role="tablist" aria-label="Screen groups" id="galGroups"></div>
    <div class="rail-wrap">
      <button type="button" class="rail__btn rail__btn--prev" aria-label="Previous screens" data-rail="-1">‹</button>
      <ol class="rail" id="galRail" aria-label="${esc(app.name)} screens"></ol>
      <button type="button" class="rail__btn rail__btn--next" aria-label="Next screens" data-rail="1">›</button>
    </div>
    <noscript><p>Turn on JavaScript to browse the screens, or open <a href="${esc(app.url)}">${esc(app.name)}</a>.</p></noscript>
  </section>` : ''}

  <section class="section" id="features" aria-labelledby="features-h">
    <div class="section__head"><div><h2 id="features-h">What it does</h2><p>${esc(app.hook)}</p></div></div>
    <ul class="features">${(app.features || []).map((f, i) => {
      const fid = (app.featureIds || [])[i] || slugify(f);
      return `<li id="feat-${esc(fid)}"><span class="features__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${esc(f)}</span></li>`;
    }).join('')}</ul>
    ${groups.length ? `<div class="tour">${groups.map((g) => `<div class="tour__group"><h3>${esc(g.name)}</h3><ul>${g.items.map((s) => `<li><strong>${esc(s.screen)}</strong>${s.caption ? `<span>${esc(s.caption)}</span>` : ''}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}
  </section>

  <section class="section" id="privacy" aria-labelledby="privacy-h">
    <div class="section__head"><div><h2 id="privacy-h">Privacy, plainly</h2><p>Taken from ${esc(app.name)}’s own privacy page.</p></div></div>
    <div class="privacy">
      <div class="card"><h3>Stays on your device</h3><p>${esc(priv.stays)}</p></div>
      <div class="card"><h3>May leave your device</h3><dl>${priv.network.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
      <div class="card"><h3>Never</h3><ul class="never"><li>Analytics or trackers</li><li>Ads</li><li>An account to use it</li><li>Selling or sharing your data</li></ul></div>
    </div>
    ${app.url ? `<p class="fine"><a href="${esc(app.url)}privacy.html">Read the full privacy page</a></p>` : ''}
  </section>

  ${app.privateBeta ? '' : `<section class="section" id="install" aria-labelledby="install-h">
    <div class="section__head"><div><h2 id="install-h">Put it on your Home Screen</h2><p>${esc(app.name)} is a web app — installing takes a few seconds and it opens full-screen, offline.</p></div></div>
    <ol class="install">
      <li class="card"><h3>iPhone &amp; iPad</h3><p>Open ${esc(app.name)} in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p></li>
      <li class="card"><h3>Mac</h3><p>In Safari choose <b>File → Add to Dock</b>. In Chrome or Edge, click the install icon in the address bar.</p></li>
      <li class="card"><h3>Android</h3><p>In Chrome, open the <b>⋮</b> menu and tap <b>Install app</b>.</p></li>
    </ol>
  </section>`}

  <section class="section" id="faq" aria-labelledby="faq-h">
    <div class="section__head"><div><h2 id="faq-h">Questions</h2></div></div>
    <div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </section>

  <section class="section" id="new" aria-labelledby="new-h">
    <div class="release card">
      <div><h2 id="new-h">Latest release</h2><p><span class="chip"><span data-live-version="${esc(version)}">v${esc(version)}</span></span>${log[0]?.date ? ` <time datetime="${esc(log[0].date)}">${esc(new Date(log[0].date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</time>` : ''}</p></div>
      ${app.privateBeta ? '' : `<a class="btn btn--ghost btn--sm" href="https://github.com/shamikhahmed/${esc(repo)}/blob/main/CHANGELOG.md">Release history</a>`}
    </div>
  </section>

  ${DISCLAIMER[app.slug] ? `<p class="disclaimer">${esc(DISCLAIMER[app.slug])}</p>` : ''}
</main>
<footer class="foot">
  <p class="foot__label">More Caps</p>
  <ul class="foot__caps">${others.map((o) => `<li><a href="/apps/${esc(o.slug)}/"><img src="/apps/assets/icons/${esc(o.slug)}.svg" alt="" width="40" height="40" loading="lazy"><span>${esc(o.name)}</span></a></li>`).join('')}</ul>
  <nav class="foot__links" aria-label="Footer"><a href="/apps/">All Caps</a><a href="/stories/">Examples</a><a href="/">Capricorn OS</a><a href="/support.html">Support</a><a href="/privacy.html">Privacy</a><a href="https://github.com/shamikhahmed">GitHub</a></nav>
  <p class="foot__fine">© ${new Date().getFullYear()} Capricorn Systems, Karachi.</p>
</footer>
<dialog class="lightbox" id="lightbox" aria-label="Screenshot">
  <button type="button" class="lightbox__close" data-lb="close" aria-label="Close">✕</button>
  <button type="button" class="lightbox__nav lightbox__nav--prev" data-lb="-1" aria-label="Previous">‹</button>
  <figure><img id="lbImg" alt=""><figcaption id="lbCap"></figcaption></figure>
  <button type="button" class="lightbox__nav lightbox__nav--next" data-lb="1" aria-label="Next">›</button>
</dialog>
${shots.length ? `<script type="application/json" id="shots" data-schemes="${esc(shots.schemes.join(','))}">${data}</script>` : ''}
<script src="/apps/assets/minisite.js" defer></script>
</body>
</html>
`;
}

function renderIndex(apps, versions) {
  const pal = palette({ accent: '#c9a227', accent2: '#8a6a1a', bg: '#121110' });
  const cards = apps.map((a) => `<li><a class="capcard" href="/apps/${esc(a.slug)}/" style="--c:${esc(a.accent)}">
    <img src="/apps/assets/icons/${esc(a.slug)}.svg" alt="" width="64" height="64" loading="lazy">
    <span class="capcard__name">${esc(a.name)}${a.privateBeta ? ' <em>Private beta</em>' : ''}</span>
    <span class="capcard__desc">${esc(DESC[a.slug] || a.tagline)}</span>
    <span class="capcard__meta">${esc(a.category)} · v${esc(versions[a.slug] || a.ver)}</span>
  </a></li>`).join('');
  return `${head({ title: 'Cap apps — Capricorn Systems', desc: 'Thirteen Cap apps by Capricorn Systems. Each one looks different; none has ads or analytics, and each says plainly what stays on your device.', canonical: `${BASE}/apps/`, og: `${BASE}/assets/og.png`, pal })}
<body>
${topbar(null, false)}
<main id="main">
  <section class="hero hero--index" aria-labelledby="h1">
    <div class="hero__text">
      <p class="eyebrow">Capricorn Systems</p>
      <h1 id="h1">Thirteen Caps. One rule.</h1>
      <p class="hero__lead">Every Cap looks and feels different. None of them has ads or analytics, and each page says plainly what stays on your device — and what, if anything, leaves it.</p>
      <div class="hero__cta"><a class="btn btn--fill" href="/">Open Capricorn OS</a><a class="btn btn--ghost" href="/support.html">Support</a></div>
    </div>
  </section>
  <section class="section" aria-label="All Caps"><ul class="capgrid">${cards}</ul></section>
</main>
<footer class="foot"><nav class="foot__links" aria-label="Footer"><a href="/">Capricorn OS</a><a href="/stories/">Examples</a><a href="/support.html">Support</a><a href="/privacy.html">Privacy</a><a href="https://github.com/shamikhahmed">GitHub</a></nav><p class="foot__fine">© ${new Date().getFullYear()} Capricorn Systems, Karachi.</p></footer>
<script src="/apps/assets/minisite.js" defer></script>
</body>
</html>
`;
}

const redirect = (slug, name) => {
  const to = `${BASE}/apps/${slug}/`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${to}"><title>${esc(name)} — Capricorn Systems</title><link rel="canonical" href="${to}">
<script>location.replace(${JSON.stringify(to)})</script></head>
<body><p><a href="${to}">Continue to ${esc(name)}</a></p></body></html>
`;
};

/* ── main ────────────────────────────────────────────────────────────── */

const { APPS } = await import(pathToFileURL(join(LAB, 'js', 'products.js')).href);
const storyBundles = Object.fromEntries(loadStoryBundles(CONTENT).map((b) => [b.slug, b]));
const storyCtxBase = { contentDir: CONTENT, BASE, esc, head, topbar, deviceFigure, palette };
mkdirSync(join(OUT, 'assets', 'icons'), { recursive: true });
cpSync(join(LAB, 'scripts', 'minisite', 'minisite.css'), join(OUT, 'assets', 'minisite.css'));
cpSync(join(LAB, 'scripts', 'minisite', 'minisite.js'), join(OUT, 'assets', 'minisite.js'));
for (const a of APPS) cpSync(join(LAB, 'assets', 'icons', `${a.slug}.svg`), join(OUT, 'assets', 'icons', `${a.slug}.svg`));
rmSync(join(OUT, 'assets', 'gallery'), { recursive: true, force: true });

const versions = {};
const ogJobs = [];
for (const app of APPS) {
  const repoPath = join(FLEET, REPO[app.slug]);
  const version = readJson(join(repoPath, 'VERSION.json'))?.version || app.ver;
  versions[app.slug] = version;
  const dir = join(OUT, app.slug);
  rmSync(join(dir, 'assets'), { recursive: true, force: true }); // previous generator's layout
  mkdirSync(dir, { recursive: true });
  const shots = ingestGallery(repoPath, app.slug);
  const pal = palette(app);
  const others = APPS.filter((o) => o.slug !== app.slug);
  const storyBundle = storyBundles[app.slug] || null;
  writeFileSync(join(dir, 'index.html'), renderApp(app, { version, shots, log: latestRelease(readText(join(repoPath, 'CHANGELOG.md'))), pal, others, storyBundle }));
  if (storyBundle) {
    const { storyUrls } = buildStoriesForApp(app, storyBundle, { ...storyCtxBase, outDir: dir, pal });
    app._storyUrls = storyUrls;
  }
  writeFileSync(join(HUB, `${app.slug}.html`), redirect(app.slug, app.name));
  ogJobs.push({ app, pal, shot: shots.find((s) => s.theme === 'dark' && s.device === 'iphone') || shots[0], out: join(dir, 'og.png') });
  const kb = (spawnSync('du', ['-sk', join(dir)]).stdout.toString().split('\t')[0]) || '?';
  console.log(`✓ apps/${app.slug}/  v${version}  ${shots.length} shots  ${kb} KB`);
}
writeFileSync(join(OUT, 'index.html'), renderIndex(APPS, versions));
const allStoryEntries = [];
for (const app of APPS) {
  const bundle = storyBundles[app.slug];
  if (!bundle) continue;
  for (const persona of bundle.personas) allStoryEntries.push({ app, persona, bundle });
}
if (allStoryEntries.length) {
  const storiesOut = join(HUB, 'stories');
  mkdirSync(storiesOut, { recursive: true });
  writeFileSync(
    join(storiesOut, 'index.html'),
    renderStoriesIndex(allStoryEntries, APPS, versions, {
      ...storyCtxBase,
      pal: palette({ accent: '#c9a227', accent2: '#8a6a1a', bg: '#121110' }),
    }),
  );
  console.log(`✓ stories/index.html (${allStoryEntries.length} stories)`);
}
writeFileSync(join(OUT, 'og-jobs.json'), JSON.stringify(ogJobs.map((j) => ({ slug: j.app.slug, name: j.app.name, desc: DESC[j.app.slug] || j.app.tagline, bg: j.pal.dark.bg, accent: j.pal.dark.accent, glow: j.pal.glow, shot: j.shot ? join(OUT, j.app.slug, j.shot.src) : null, icon: join(OUT, 'assets', 'icons', `${j.app.slug}.svg`), out: j.out }))));

// sitemap: ensure /apps/ pages; prune legacy redirects + noindex URLs (V5-3)
const smPath = join(HUB, 'sitemap.xml');
let sm = readText(smPath);
if (sm) {
  const redirectLocs = new Set(APPS.map((a) => `${BASE}/${a.slug}.html`));
  const noindexLocs = new Set();
  for (const [slug, repo] of Object.entries(REPO)) {
    const repoPath = join(FLEET, repo);
    const candidates = [
      join(repoPath, 'out', 'index.html'),
      join(repoPath, 'dist', 'index.html'),
      join(HUB, repo, 'index.html'),
    ];
    const html = candidates.map(readText).find(Boolean) || '';
    const srcRobots = readText(join(repoPath, 'src', 'app', 'layout.tsx'));
    const noindex =
      /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
      /content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html) ||
      /robots:\s*\{\s*index:\s*false/.test(srcRobots);
    if (noindex) {
      noindexLocs.add(`${BASE}/${repo}/`);
      noindexLocs.add(`${BASE}/${repo}`);
    }
  }
  const drop = new Set([...redirectLocs, ...noindexLocs]);
  sm = sm.replace(/[ \t]*<url>\s*<loc>([^<]*)<\/loc>[\s\S]*?<\/url>\s*/g, (block, loc) => (drop.has(loc) ? '' : block));
  const urls = [`${BASE}/apps/`, `${BASE}/stories/`, ...APPS.map((a) => `${BASE}/apps/${a.slug}/`), ...APPS.flatMap((a) => a._storyUrls || [])];
  for (const u of urls) {
    if (drop.has(u)) continue;
    if (!sm.includes(`<loc>${u}</loc>`)) sm = sm.replace('</urlset>', `  <url><loc>${u}</loc><priority>0.8</priority></url>\n</urlset>`);
  }
  writeFileSync(smPath, sm);
}

// OG cards (1200×630) — optional, needs a local playwright-core build
const pwCore = process.env.PW_CORE || join(FLEET, 'MasteryCap', 'node_modules', 'playwright-core');
if (existsSync(join(pwCore, 'index.mjs'))) {
  spawnSync(process.execPath, [join(LAB, 'scripts', 'minisite', 'og.mjs'), join(OUT, 'og-jobs.json'), pwCore], { stdio: 'inherit' });
} else {
  console.warn('og: playwright-core not found — og.png not regenerated');
}
rmSync(join(OUT, 'og-jobs.json'), { force: true });
console.log(`✓ apps/index.html (${APPS.length} Caps) → ${OUT}`);
