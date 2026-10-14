import { APPS } from './products.js';

/**
 * Live catalog — every Cap publishes VERSION.json next to its PWA. Read them at
 * runtime so the hub never drifts from what's actually shipped. products.js
 * versions stay as the offline/first-paint fallback.
 *
 * Any element with [data-ver-of="<slug>"] is kept in sync ("v1.2.3").
 */

let ran = false;
const live = new Set();

export function isLiveVersion(slug) {
  return live.has(slug);
}

function paint(slug, ver) {
  document.querySelectorAll(`[data-ver-of="${slug}"]`).forEach((el) => {
    el.textContent = `v${ver}`;
    el.classList.add('is-live');
    el.title = 'Read live from the app just now';
  });
}

async function fetchVersion(app) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${app.url.replace(/\/?$/, '/')}VERSION.json`, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const v = String(data.version || '').trim();
    return /^\d+\.\d+/.test(v) ? v : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function refreshCatalog() {
  if (ran) {
    APPS.forEach((a) => live.has(a.slug) && paint(a.slug, a.ver));
    return;
  }
  ran = true;
  const targets = APPS.filter((a) => a.url && !a.privateBeta);
  Promise.all(targets.map(async (app) => {
    const v = await fetchVersion(app);
    if (!v) return;
    app.ver = v;
    live.add(app.slug);
    paint(app.slug, v);
  })).then(() => {
    document.dispatchEvent(new CustomEvent('cap:catalog', { detail: { live: [...live] } }));
  });
}

/** Re-apply known live versions to freshly rendered DOM (windows, sheets). */
export function syncVersions(root = document) {
  root.querySelectorAll('[data-ver-of]').forEach((el) => {
    const app = APPS.find((a) => a.slug === el.dataset.verOf);
    if (app && live.has(app.slug)) {
      el.textContent = `v${app.ver}`;
      el.classList.add('is-live');
    }
  });
}
