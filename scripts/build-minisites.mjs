/**
 * Capricorn mini-site generator (Perfection Loop v3 §10.2).
 * Inputs: products.js catalog + per-app VERSION/FEATURES/CHANGELOG/privacy/gallery/support FAQs.
 * Output: shamikhahmed.github.io/apps/<slug>/ (+ apps/index.html) and legacy <slug>.html → mini-site.
 *
 * Wave A: skeleton pages (hero + placeholder sections). Gallery polish / OG / sitemap = later waves.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
} from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAB = join(__dirname, '..');
const FLEET = join(LAB, '..');
const HUB = join(FLEET, 'shamikhahmed.github.io');
const APPS_OUT = join(HUB, 'apps');
const BASE = 'https://shamikhahmed.github.io';

const SLUG_TO_REPO = {
  vaultcap: 'VaultCap',
  pulsecap: 'PulseCap',
  prismcap: 'PrismCap',
  steadycap: 'SteadyCap',
  ledgercap: 'LedgerCap',
  deeponycap: 'DeePonyCap',
  scentcap: 'ScentCap',
  soulcap: 'SoulCap',
  travelcap: 'TravelCap',
  auracap: 'AuraCap',
  masterycap: 'MasteryCap',
  ideacap: 'IdeaCap',
  carcap: 'CarCap',
  cookcap: 'CookCap',
  deefoodie: 'DeeFoodieApp',
};

/** §4.1 one-liners (DECISIONS.md) — override products.js tagline if present */
const DESC_41 = {
  auracap: 'Organize your iPhone, iPad and Mac setup.',
  carcap: 'Service, fuel and documents for your cars.',
  cookcap: 'Your family cookbook, kept like a real book.',
  deefoodie: 'A private journal of where you eat in Karachi.',
  deeponycap: 'Track your collection, shelves and wishlist.',
  ideacap: 'Capture ideas by voice or text. They stay on your device.',
  ledgercap: 'Track your PSX stocks and mutual funds in one place.',
  masterycap: 'Learn trading and software step by step, in English or Roman Urdu.',
  prismcap: 'Party games for one phone, passed around the room.',
  pulsecap: 'Plan, log and track your training. Works offline.',
  scentcap: 'Your fragrance collection, and what to wear today.',
  soulcap: 'Quiet tools to steady yourself. Not therapy.',
  steadycap: 'Routines, medicines and support for recovery.',
  travelcap: 'Trips, tickets and travel documents in one place.',
  vaultcap: 'Everything you own, encrypted on your device.',
};

/** §4.2 disclaimers */
const DISCLAIMER_42 = {
  soulcap:
    'SoulCap offers self-help tools. It isn\'t therapy, medical advice, a diagnosis or a crisis service.',
  steadycap:
    'SteadyCap helps you keep track of routines and cravings. It isn\'t medical advice. Follow your doctor\'s or pharmacist\'s instructions for any medicine.',
  pulsecap:
    'PulseCap gives general training guidance, not medical advice. Stop and get medical help if you feel pain, dizziness or chest discomfort.',
  ledgercap:
    'LedgerCap is for tracking and education. Prices may be delayed or indicative. Nothing here is investment advice.',
  masterycap:
    'MasteryCap is educational. Nothing here is financial advice. Certificates are self-issued and not accredited.',
  vaultcap:
    'Your vault is encrypted on this device with your PIN. If you forget it, your data can\'t be recovered — keep an export somewhere safe.',
  cookcap: 'Nutrition values are estimates.',
  travelcap: 'Always check official sources for visas, entry rules and flight times.',
  scentcap: 'Brand names belong to their owners. ScentCap isn\'t affiliated with any fragrance house.',
  deeponycap:
    'DeePonyCap is an independent collection tracker and isn\'t affiliated with or endorsed by any toy company.',
  auracap:
    'Apple, iPhone, iPad and Mac are trademarks of Apple Inc. AuraCap isn\'t affiliated with Apple.',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function parseFeaturesS(md) {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const out = [];
  let inS = false;
  for (const line of lines) {
    if (/^##\s*S\b/i.test(line)) {
      inS = true;
      continue;
    }
    if (inS && /^##\s/.test(line)) break;
    if (inS) {
      const m = line.match(/^\s*[-*]\s+(.+)/);
      if (m) out.push(m[1].replace(/\*\*/g, '').trim());
    }
  }
  return out.slice(0, 8);
}

function parseChangelogLatest(md, n = 5) {
  if (!md) return [];
  const entries = [];
  const blocks = md.split(/^##\s+/m).slice(1);
  for (const block of blocks) {
    const first = block.split(/\r?\n/)[0] || '';
    const title = first.replace(/^\[/, '').replace(/\].*$/, (x) => x.replace(/[\[\]]/g, '')).trim();
    const versionMatch = first.match(/\[?([\d.]+(?:\+\d+)?)\]?/);
    const dateMatch = first.match(/(\d{4}-\d{2}-\d{2})/);
    const bullets = block
      .split(/\r?\n/)
      .slice(1)
      .filter((l) => /^\s*[-*]\s+/.test(l))
      .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
      .slice(0, 4);
    entries.push({
      heading: versionMatch ? versionMatch[1] : title.slice(0, 40),
      date: dateMatch ? dateMatch[1] : '',
      bullets,
    });
    if (entries.length >= n) break;
  }
  return entries;
}

function extractNetworkList(privacyHtml, privacyMd) {
  const src = privacyHtml || privacyMd || '';
  const destinations = new Set();
  const urlRe = /https?:\/\/[^\s"'<>)]+/gi;
  let m;
  while ((m = urlRe.exec(src))) {
    try {
      const host = new URL(m[0]).hostname;
      if (host && !/shamikhahmed\.github\.io$/i.test(host)) destinations.add(host);
    } catch {
      /* ignore */
    }
  }
  // Common known destinations from privacy copy (no URL)
  if (/cloudflare/i.test(src)) destinations.add('Cloudflare Worker (opt-in / prices)');
  if (/nominatim|openstreetmap/i.test(src)) destinations.add('Nominatim / OpenStreetMap');
  if (/nothing leaves|no network|works offline|on your device/i.test(src) && destinations.size === 0) {
    return ['Nothing — this Cap stays on your device by default'];
  }
  return [...destinations].slice(0, 12);
}

function parseSupportFaqs(supportHtml, appName) {
  const faqs = [];
  // Global common questions
  const common = supportHtml.match(/<h2[^>]*>Common questions<\/h2>([\s\S]*?)(?:<\/div>\s*<\/section>|<\/main>)/i);
  const block = common ? common[1] : supportHtml;
  const parts = block.split(/<h3[^>]*>/i).slice(1);
  for (const part of parts) {
    const q = (part.match(/^([^<]+)/) || [])[1]?.trim();
    const a = (part.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    if (!q || !a) continue;
    const text = a.replace(/<[^>]+>/g, '').trim();
    const appSpecific =
      new RegExp(appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(q + text) ||
      /Where is my data|erase everything|Privacy|DeeFoodie/i.test(q);
    if (appSpecific) faqs.push({ q, a: text });
  }
  return faqs.slice(0, 6);
}

function loadGallery(repoPath) {
  const candidates = [
    join(repoPath, 'gallery-manifest.json'),
    join(repoPath, 'qa', 'gallery-manifest.json'),
    join(repoPath, 'docs', 'gallery-manifest.json'),
  ];
  for (const c of candidates) {
    const j = readJson(c);
    if (j) return { manifest: j, path: c };
  }
  return null;
}

function sharedCss() {
  return `/* Capricorn mini-sites — shared skeleton (Wave A). No third-party. */
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/assets/fonts/JetBrainsMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/assets/fonts/JetBrainsMono-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
:root {
  color-scheme: light dark;
  --accent: #5b8dee;
  --accent2: #3d5a9e;
  --bg: #0a0a0f;
  --fg: #f2f2f7;
  --muted: color-mix(in srgb, var(--fg) 62%, transparent);
  --card: color-mix(in srgb, var(--fg) 6%, transparent);
  --border: color-mix(in srgb, var(--fg) 14%, transparent);
  --radius: 16px;
  --font: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f5f5f7;
    --fg: #1c1c1e;
    --card: #fff;
    --border: color-mix(in srgb, var(--fg) 12%, transparent);
  }
}
html[data-scheme="light"] {
  --bg: #f5f5f7;
  --fg: #1c1c1e;
  --card: #fff;
  --border: color-mix(in srgb, var(--fg) 12%, transparent);
}
html[data-scheme="dark"] {
  --bg: #0a0a0f;
  --fg: #f2f2f7;
  --card: color-mix(in srgb, #fff 6%, transparent);
  --border: color-mix(in srgb, #fff 14%, transparent);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font);
  background:
    radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, color-mix(in srgb, var(--accent2) 22%, transparent), transparent 55%),
    var(--bg);
  color: var(--fg);
  line-height: 1.5;
  min-height: 100vh;
}
a { color: var(--accent); }
img { max-width: 100%; height: auto; }
.wrap { width: min(1080px, calc(100% - 2rem)); margin-inline: auto; }
.site-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 0; gap: 1rem;
}
.brand { display: flex; align-items: center; gap: .55rem; text-decoration: none; color: inherit; font-weight: 600; }
.brand img { width: 28px; height: 28px; }
.scheme-toggle {
  appearance: none; border: 1px solid var(--border); background: var(--card);
  color: var(--fg); border-radius: 999px; padding: .4rem .85rem; cursor: pointer; font: inherit;
}
.hero {
  display: grid; gap: 1.25rem; padding: 2.5rem 0 3rem;
  grid-template-columns: auto 1fr; align-items: center;
}
@media (max-width: 720px) {
  .hero { grid-template-columns: 1fr; text-align: center; justify-items: center; }
}
.hero__icon {
  width: 96px; height: 96px; border-radius: 24px;
  box-shadow: 0 12px 40px color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 18%, var(--card));
  object-fit: contain; padding: 12px;
}
.hero h1 { margin: 0 0 .35rem; font-size: clamp(2rem, 4vw, 2.75rem); letter-spacing: -0.02em; }
.hero__desc { margin: 0; color: var(--muted); font-size: 1.1rem; max-width: 36rem; }
.badge {
  display: inline-flex; align-items: center; gap: .35rem;
  font-family: var(--mono); font-size: .75rem; padding: .25rem .55rem;
  border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); margin-top: .75rem;
}
.ctas { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1.25rem; }
@media (max-width: 720px) { .ctas { justify-content: center; } }
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: .65rem 1.15rem; border-radius: 12px;
  text-decoration: none; font-weight: 600; border: 1px solid transparent;
}
.btn--primary { background: var(--accent); color: #fff; }
.btn--secondary { background: var(--card); color: var(--fg); border-color: var(--border); }
.btn--ghost { color: var(--muted); border-color: var(--border); }
.section { padding: 2.25rem 0; border-top: 1px solid var(--border); }
.section h2 { margin: 0 0 .5rem; font-size: 1.35rem; letter-spacing: -0.01em; }
.section__lead { margin: 0 0 1rem; color: var(--muted); max-width: 40rem; }
.placeholder {
  border: 1px dashed var(--border); border-radius: var(--radius);
  padding: 1.25rem; color: var(--muted); background: color-mix(in srgb, var(--card) 70%, transparent);
}
.grid {
  display: grid; gap: .85rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.tile {
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--card); padding: 1rem;
}
.tile h3 { margin: 0 0 .35rem; font-size: 1rem; }
.tile p { margin: 0; color: var(--muted); font-size: .92rem; }
.list { margin: 0; padding-left: 1.1rem; color: var(--muted); }
.list li { margin: .35rem 0; }
.faq details {
  border: 1px solid var(--border); border-radius: 12px; padding: .75rem 1rem;
  background: var(--card); margin-bottom: .55rem;
}
.faq summary { cursor: pointer; font-weight: 600; }
.changelog article {
  border-left: 3px solid var(--accent); padding: .15rem 0 .15rem 1rem; margin-bottom: 1rem;
}
.changelog h3 { margin: 0; font-family: var(--mono); font-size: .95rem; }
.changelog time { color: var(--muted); font-size: .8rem; }
.rail {
  display: flex; gap: .65rem; overflow-x: auto; padding-bottom: .35rem;
  -webkit-overflow-scrolling: touch;
}
.rail a {
  flex: 0 0 auto; text-decoration: none; color: inherit;
  border: 1px solid var(--border); border-radius: 12px; padding: .55rem .8rem;
  background: var(--card); white-space: nowrap; font-size: .9rem;
}
.site-footer {
  padding: 2rem 0 3rem; border-top: 1px solid var(--border);
  color: var(--muted); font-size: .9rem;
}
.site-footer nav { display: flex; flex-wrap: wrap; gap: .75rem 1rem; margin-bottom: 1rem; }
.site-footer a { color: inherit; }
.beta-banner {
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
  background: color-mix(in srgb, var(--accent) 12%, var(--card));
  border-radius: var(--radius); padding: 1rem 1.15rem; margin-top: 1rem;
}
.index-grid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  padding: 1rem 0 3rem;
}
.card-app {
  display: flex; flex-direction: column; gap: .65rem;
  text-decoration: none; color: inherit;
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.1rem; background: var(--card);
  min-height: 140px;
}
.card-app img { width: 48px; height: 48px; border-radius: 12px; }
.card-app strong { font-size: 1.05rem; }
.card-app span { color: var(--muted); font-size: .9rem; }
.card-app .ver { font-family: var(--mono); font-size: .72rem; opacity: .8; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;
}

function pageScript() {
  return `<script>
(function () {
  var root = document.documentElement;
  var key = 'cap-minisite-scheme';
  function apply(v) {
    if (v === 'light' || v === 'dark') root.setAttribute('data-scheme', v);
    else root.removeAttribute('data-scheme');
  }
  apply(localStorage.getItem(key));
  document.getElementById('schemeToggle')?.addEventListener('click', function () {
    var cur = root.getAttribute('data-scheme');
    var next = cur === 'dark' ? 'light' : cur === 'light' ? '' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
    if (next) localStorage.setItem(key, next); else localStorage.removeItem(key);
    apply(next || null);
  });
  var badge = document.getElementById('liveVersion');
  if (badge && badge.dataset.versionUrl) {
    fetch(badge.dataset.versionUrl, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && (j.version || j.ver)) badge.textContent = 'v' + (j.version || j.ver);
    }).catch(function () {});
  }
})();
</script>`;
}

function renderAppPage(app, ctx) {
  const {
    version,
    features,
    changelog,
    network,
    faqs,
    galleryNote,
    iconHref,
    privateBeta,
  } = ctx;
  const desc = DESC_41[app.slug] || app.tagline;
  const disclaimer = DISCLAIMER_42[app.slug];
  const openUrl = app.url || '';
  const osDeep = `${BASE}/?nolock=1&app=${encodeURIComponent(app.slug)}`;
  const canonical = `${BASE}/apps/${app.slug}/`;
  const accent = app.accent || '#5b8dee';
  const accent2 = app.accent2 || accent;
  const bg = app.bg || '#0a0a0f';

  const featureTiles =
    features.length > 0
      ? `<div class="grid">${features
          .map(
            (f) =>
              `<article class="tile"><h3>${esc(f.split(/[·—-]/)[0].trim().slice(0, 48))}</h3><p>${esc(f)}</p></article>`,
          )
          .join('')}</div>`
      : `<div class="placeholder">Feature tiles will land from FEATURES.md (S) in a later wave.</div>`;

  const changelogHtml =
    changelog.length > 0
      ? changelog
          .map(
            (e) => `<article>
          <h3>v${esc(e.heading)}</h3>
          ${e.date ? `<time datetime="${esc(e.date)}">${esc(e.date)}</time>` : ''}
          <ul class="list">${(e.bullets.length ? e.bullets : ['See full changelog in the app repo.'])
            .map((b) => `<li>${esc(b)}</li>`)
            .join('')}</ul>
        </article>`,
          )
          .join('')
      : `<div class="placeholder">Changelog entries appear when CHANGELOG.md is present in the app repo.</div>`;

  const faqHtml =
    faqs.length > 0
      ? faqs
          .map(
            (f) =>
              `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
          )
          .join('')
      : `<details open><summary>Where is my data?</summary><p>On your device (localStorage / IndexedDB), unless this Cap documents a specific optional network call.</p></details>
         <details><summary>How do I get help?</summary><p>Open a GitHub Issue from <a href="/support.html">support</a> with the app name in the title.</p></details>`;

  const networkHtml =
    network.length > 0
      ? `<ul class="list">${network.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
      : `<p class="section__lead">Network destinations will be filled from each Cap’s privacy page.</p>`;

  const ctaBlock = privateBeta
    ? `<div class="beta-banner">
        <strong>Private beta</strong>
        <p style="margin:.35rem 0 0;color:var(--muted)">DeeFoodie is invite-only. There is no public install link. Invited testers: open a DeeFoodie issue on <a href="/support.html#deefoodie">support</a>.</p>
      </div>
      <div class="ctas">
        <a class="btn btn--secondary" href="${esc(osDeep)}">See listing in Capricorn OS</a>
        <a class="btn btn--ghost" href="/support.html#deefoodie">Support</a>
      </div>`
    : `<div class="ctas">
        <a class="btn btn--primary" href="${esc(openUrl)}">Open ${esc(app.name)}</a>
        <a class="btn btn--secondary" href="${esc(osDeep)}">Try it in Capricorn OS</a>
        <a class="btn btn--ghost" href="#install">Add to Home Screen</a>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(app.name)} — Capricorn Systems</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:title" content="${esc(app.name)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="/apps/assets/minisite.css">
  <style>:root{--accent:${esc(accent)};--accent2:${esc(accent2)};--bg:${esc(bg)};}</style>
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: desc,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web, iOS, iPadOS, macOS, Android (PWA)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: canonical,
  })}
  </script>
</head>
<body>
  <div class="wrap">
    <header class="site-header">
      <a class="brand" href="/apps/"><img src="/assets/logo.svg" alt="" width="28" height="28">Capricorn</a>
      <button type="button" class="scheme-toggle" id="schemeToggle" aria-label="Toggle colour scheme">Light / Dark</button>
    </header>

    <section class="hero" aria-labelledby="app-name">
      <img class="hero__icon" src="${esc(iconHref)}" alt="" width="96" height="96">
      <div>
        <h1 id="app-name">${esc(app.name)}</h1>
        <p class="hero__desc">${esc(desc)}</p>
        <span class="badge" id="liveVersion" data-version-url="${
          openUrl ? esc(openUrl.replace(/\/?$/, '/') + 'VERSION.json') : ''
        }">v${esc(version)}</span>
        ${ctaBlock}
      </div>
    </section>

    <section class="section" id="gallery" aria-labelledby="gallery-h">
      <h2 id="gallery-h">Screen gallery</h2>
      <p class="section__lead">${esc(galleryNote)}</p>
      <div class="placeholder">Embedded gallery viewer (light/dark · device filter · lightbox) — Wave C/D.</div>
    </section>

    <section class="section" id="features" aria-labelledby="features-h">
      <h2 id="features-h">What it does</h2>
      <p class="section__lead">Honest features from the shipped set.</p>
      ${featureTiles}
    </section>

    <section class="section" id="privacy" aria-labelledby="privacy-h">
      <h2 id="privacy-h">Privacy, plainly</h2>
      <p class="section__lead">No analytics, no ads, no account required${
        privateBeta ? ' for the public listing' : ''
      }. What stays on device stays on device.</p>
      <h3 style="font-size:1rem;margin:1rem 0 .4rem">Network destinations</h3>
      ${networkHtml}
      ${
        openUrl
          ? `<p style="margin-top:1rem"><a href="${esc(openUrl.replace(/\/?$/, '/') + 'privacy.html')}">Full privacy page</a></p>`
          : ''
      }
    </section>

    <section class="section" id="install" aria-labelledby="install-h">
      <h2 id="install-h">How to install</h2>
      ${
        privateBeta
          ? `<div class="placeholder">No public install. Private beta — invited devices only (D-10 / N-1).</div>`
          : `<div class="placeholder">
        <p><strong>iPhone / iPad (Safari):</strong> Open the app → Share → Add to Home Screen.</p>
        <p><strong>Mac (Safari / Chrome):</strong> Open the app → browser install / Add to Dock when offered.</p>
        <p><strong>Android (Chrome):</strong> Open the app → Install app / Add to Home screen.</p>
        <p>Install screenshots from the gallery land in a later wave.</p>
      </div>`
      }
    </section>

    <section class="section faq" id="faq" aria-labelledby="faq-h">
      <h2 id="faq-h">FAQ</h2>
      ${faqHtml}
      ${
        disclaimer
          ? `<details><summary>Important note</summary><p>${esc(disclaimer)}</p></details>`
          : ''
      }
    </section>

    <section class="section changelog" id="changelog" aria-labelledby="changelog-h">
      <h2 id="changelog-h">What's new</h2>
      ${changelogHtml}
      ${
        app.github
          ? `<p><a href="${esc(app.github)}">Full changelog / source on GitHub</a></p>`
          : ''
      }
    </section>

    <footer class="site-footer">
      <nav aria-label="Site">
        <a href="/">Capricorn OS</a>
        <a href="/support.html">Support</a>
        <a href="/privacy.html">Privacy</a>
        ${app.github ? `<a href="${esc(app.github)}">GitHub</a>` : ''}
        <a href="/apps/">All Caps</a>
      </nav>
      <p>Capricorn Systems · ${esc(app.name)} mini-site (skeleton)</p>
      <div class="rail" aria-label="Other Caps" id="otherCaps"></div>
    </footer>
  </div>
  ${pageScript()}
</body>
</html>`;
}

function renderIndex(apps, versions) {
  const cards = apps
    .map((a) => {
      const ver = versions[a.slug] || a.ver;
      const badge = a.privateBeta ? ' · Private beta' : '';
      return `<a class="card-app" href="/apps/${esc(a.slug)}/" style="--accent:${esc(a.accent)}">
        <img src="/apps/${esc(a.slug)}/assets/icon.svg" alt="" width="48" height="48">
        <strong>${esc(a.name)}${esc(badge)}</strong>
        <span>${esc(DESC_41[a.slug] || a.tagline)}</span>
        <span class="ver">v${esc(ver)}</span>
      </a>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cap apps — Capricorn Systems</title>
  <meta name="description" content="Mini-sites for every Capricorn Cap app.">
  <link rel="canonical" href="${BASE}/apps/">
  <link rel="stylesheet" href="/apps/assets/minisite.css">
</head>
<body>
  <div class="wrap">
    <header class="site-header">
      <a class="brand" href="/"><img src="/assets/logo.svg" alt="" width="28" height="28">Capricorn</a>
      <button type="button" class="scheme-toggle" id="schemeToggle" aria-label="Toggle colour scheme">Light / Dark</button>
    </header>
    <h1 style="margin:1rem 0 .35rem;letter-spacing:-0.02em">Cap apps</h1>
    <p style="color:var(--muted);margin:0 0 1rem;max-width:40rem">One mini-site per Cap. Open an app, try it in Capricorn OS, or read privacy and FAQ.</p>
    <div class="index-grid">${cards}</div>
    <footer class="site-footer">
      <nav><a href="/">Home</a><a href="/support.html">Support</a><a href="/privacy.html">Privacy</a></nav>
      <p>Capricorn Systems</p>
    </footer>
  </div>
  ${pageScript()}
</body>
</html>`;
}

function redirectHtml(slug, name) {
  const target = `${BASE}/apps/${slug}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${target}">
  <title>${esc(name)} → Capricorn Systems</title>
  <link rel="canonical" href="${target}">
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p><a href="${target}">Continue to ${esc(name)}</a></p>
</body>
</html>
`;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function copyIcon(app, destDir) {
  ensureDir(destDir);
  const candidates = [
    join(LAB, app.icon || ''),
    join(LAB, 'assets', 'icons', `${app.slug}.svg`),
    join(HUB, 'assets', 'icons', `${app.slug}.svg`),
    join(HUB, 'assets', 'icons', `${app.slug}.png`),
  ].filter(Boolean);
  const dest = join(destDir, 'icon.svg');
  for (const src of candidates) {
    if (src && existsSync(src)) {
      if (src.endsWith('.svg')) {
        cpSync(src, dest);
        return 'assets/icon.svg';
      }
      // PNG fallback: still reference hub path later
      cpSync(src, join(destDir, basename(src)));
      return `assets/${basename(src)}`;
    }
  }
  // Minimal placeholder SVG using accent
  const glyph = esc(String(app.symbol || app.name?.[0] || '?').slice(0, 1));
  const fill = app.accent || '#5b8dee';
  writeFileSync(
    dest,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      `<rect width="64" height="64" rx="14" fill="${fill}"/>` +
      `<text x="32" y="38" text-anchor="middle" font-size="22" fill="#fff" font-family="system-ui">${glyph}</text>` +
      '</svg>\n',
  );
  return 'assets/icon.svg';
}

async function main() {
  const productsUrl = pathToFileURL(join(LAB, 'js', 'products.js')).href;
  const { APPS } = await import(productsUrl);
  if (!Array.isArray(APPS) || !APPS.length) throw new Error('products.js APPS empty');

  ensureDir(APPS_OUT);
  ensureDir(join(APPS_OUT, 'assets'));
  writeFileSync(join(APPS_OUT, 'assets', 'minisite.css'), sharedCss());

  const supportHtml = readText(join(HUB, 'support.html'));
  const versions = {};
  const generated = [];

  for (const app of APPS) {
    const repoName = SLUG_TO_REPO[app.slug];
    const repoPath = repoName ? join(FLEET, repoName) : null;
    const versionJson = repoPath ? readJson(join(repoPath, 'VERSION.json')) : null;
    const version = versionJson?.version || versionJson?.ver || app.ver || '0.0.0';
    versions[app.slug] = version;

    const featuresMd = repoPath ? readText(join(repoPath, 'FEATURES.md')) : '';
    let features = parseFeaturesS(featuresMd);
    if (!features.length && Array.isArray(app.features)) features = app.features.slice(0, 8);

    const changelogMd = repoPath ? readText(join(repoPath, 'CHANGELOG.md')) : '';
    const changelog = parseChangelogLatest(changelogMd, 5);

    const privacyHtml =
      (repoPath && readText(join(repoPath, 'privacy.html'))) ||
      (repoPath && readText(join(repoPath, 'PRIVACY.md'))) ||
      '';
    const network = extractNetworkList(privacyHtml, '');

    const faqs = parseSupportFaqs(supportHtml, app.name);
    const gallery = repoPath ? loadGallery(repoPath) : null;
    const galleryNote = gallery
      ? 'Gallery manifest found — shots will be size-budgeted and embedded in a later wave.'
      : 'Gallery manifest not present yet — placeholder until Gallery Engineer delivers.';

    const outDir = join(APPS_OUT, app.slug);
    ensureDir(outDir);
    const iconRel = copyIcon(app, join(outDir, 'assets'));

    // Optional: copy a tiny gallery note file for later ingestion
    if (gallery) {
      writeFileSync(
        join(outDir, 'assets', 'gallery-manifest.stub.json'),
        JSON.stringify({ source: gallery.path, note: 'Wave A stub — do not serve as full gallery' }, null, 2),
      );
    }

    const html = renderAppPage(app, {
      version,
      features,
      changelog,
      network,
      faqs,
      galleryNote,
      iconHref: `/apps/${app.slug}/${iconRel}`,
      privateBeta: !!(app.privateBeta || app.slug === 'deefoodie'),
    });
    writeFileSync(join(outDir, 'index.html'), html);

    // Legacy redirect pages (preserve URL, amend target per N-1)
    const legacy = join(HUB, `${app.slug}.html`);
    writeFileSync(legacy, redirectHtml(app.slug, app.name));

    generated.push(app.slug);
    console.log(`✓ apps/${app.slug}/  v${version}${app.privateBeta ? ' (private-beta)' : ''}`);
  }

  writeFileSync(join(APPS_OUT, 'index.html'), renderIndex(APPS, versions));
  console.log(`✓ apps/index.html (${generated.length} Caps)`);
  console.log('Mini-sites built →', APPS_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
