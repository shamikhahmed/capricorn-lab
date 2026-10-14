import { sfx, setSoundPack } from './sounds.js';

/**
 * Capricorn OS skins. One registry drives:
 *  - CSS tokens + component overrides (css/themes.css, keyed on [data-skin])
 *  - wallpaper painters (js/wallpaper.js)
 *  - sound packs (js/sounds.js)
 *  - Appearance app previews (js/appearance.js)
 *
 * `mode` is the light/dark base the skin builds on — it sets [data-theme] so
 * every existing light/dark rule still applies underneath the skin.
 */
export const THEMES = [
  {
    id: 'capricorn-light',
    name: 'Capricorn',
    mood: 'Warm paper, quiet gold.',
    mode: 'light',
    sound: 'soft',
    meta: '#e8e2d6',
    swatch: ['#e8e2d6', '#b8941f', '#1a1816'],
  },
  {
    id: 'capricorn-dark',
    name: 'Capricorn Night',
    mood: 'Night desk, warm brass.',
    mode: 'dark',
    sound: 'soft',
    meta: '#121110',
    swatch: ['#121110', '#d4af37', '#f2efe8'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    mood: 'Northern lights behind frosted glass.',
    mode: 'dark',
    sound: 'glass',
    meta: '#040714',
    swatch: ['#040714', '#3cffb0', '#a78bfa'],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    mood: 'Neon horizon. Endless night drive.',
    mode: 'dark',
    sound: 'synth',
    meta: '#12022b',
    swatch: ['#12022b', '#ff2bd6', '#22e1ff'],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    mood: 'Green phosphor. Root access.',
    mode: 'dark',
    sound: 'chip',
    meta: '#020a04',
    swatch: ['#020a04', '#39ff7a', '#0f3d1e'],
  },
  {
    id: 'truckart',
    name: 'Truck Art',
    mood: 'Painted loud, Karachi-road proud.',
    mode: 'light',
    sound: 'bell',
    meta: '#12183a',
    swatch: ['#12183a', '#ffc914', '#e4252f'],
  },
  {
    id: 'mughal',
    name: 'Mughal',
    mood: 'Lapis tiles and gold geometry.',
    mode: 'dark',
    sound: 'bell',
    meta: '#0a1f4d',
    swatch: ['#0a1f4d', '#d9b45a', '#1fb5a8'],
  },
  {
    id: 'paper',
    name: 'Paper',
    mood: 'Ink on newsprint. Nothing glows.',
    mode: 'light',
    sound: 'paper',
    meta: '#f3f0e8',
    swatch: ['#f3f0e8', '#111111', '#b3261e'],
  },
  {
    id: 'pixel',
    name: 'Pixel 95',
    mood: 'Bevels, pixels, clouds that drift.',
    mode: 'light',
    sound: 'chip',
    meta: '#0e7c7b',
    swatch: ['#0e7c7b', '#c3c3c3', '#000080'],
  },
  {
    id: 'brutal',
    name: 'Brutal',
    mood: 'Raw grid. Loud type. No apologies.',
    mode: 'light',
    sound: 'thud',
    meta: '#f1efe8',
    swatch: ['#f1efe8', '#0a0a0a', '#ffe500'],
  },
];

const SKIN_KEY = 'cap-skin';
const LEGACY_KEY = 'cap-theme';
const DEFAULT_SKIN = 'capricorn-light';

const byId = (id) => THEMES.find((t) => t.id === id);

/** Old ids / short aliases accepted in ?theme= links. */
const ALIASES = {
  light: 'capricorn-light',
  dark: 'capricorn-dark',
  capricorn: 'capricorn-light',
  night: 'capricorn-dark',
  crt: 'terminal',
  neon: 'synthwave',
  truck: 'truckart',
  tile: 'mughal',
  eink: 'paper',
  retro: 'pixel',
  '95': 'pixel',
  brutalist: 'brutal',
};

export function resolveSkin(id) {
  if (!id) return null;
  const key = String(id).toLowerCase().trim();
  return byId(key) ? key : (ALIASES[key] && byId(ALIASES[key]) ? ALIASES[key] : null);
}

export function getSkin() {
  return resolveSkin(document.documentElement.dataset.skin) || DEFAULT_SKIN;
}

export function getSkinDef(id = getSkin()) {
  return byId(id) || byId(DEFAULT_SKIN);
}

/** Back-compat: light/dark base of the active skin. */
export function getTheme() {
  return getSkinDef().mode;
}

function readStoredSkin() {
  try {
    const stored = resolveSkin(localStorage.getItem(SKIN_KEY));
    if (stored) return stored;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'dark') return 'capricorn-dark';
  } catch { /* private browsing */ }
  return null;
}

function setSkinNow(id, { persist = true } = {}) {
  const def = getSkinDef(id);
  const root = document.documentElement;
  root.dataset.skin = def.id;
  root.dataset.theme = def.mode;

  if (persist) {
    try {
      localStorage.setItem(SKIN_KEY, def.id);
      localStorage.setItem(LEGACY_KEY, def.mode);
    } catch { /* private browsing */ }
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = def.meta;

  setSoundPack(def.sound);
  syncThemeControls(def);
  document.dispatchEvent(new CustomEvent('cap:theme', { detail: { theme: def.mode, skin: def.id } }));
}

/**
 * Switch skin. With an origin point and View Transitions support the new skin
 * is revealed as an expanding circle from that point; otherwise it swaps
 * instantly (reduced motion always swaps instantly).
 */
export function applySkin(id, { x, y, persist = true } = {}) {
  const next = resolveSkin(id) || DEFAULT_SKIN;
  if (next === getSkin()) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const ox = Number.isFinite(x) ? x : window.innerWidth / 2;
  const oy = Number.isFinite(y) ? y : window.innerHeight / 2;

  const swap = () => {
    setSkinNow(next, { persist });
    sfx.theme();
  };

  if (!document.startViewTransition || reduced) {
    swap();
    return;
  }

  const r = Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy));
  root.style.setProperty('--vt-x', `${ox}px`);
  root.style.setProperty('--vt-y', `${oy}px`);
  root.style.setProperty('--vt-r', `${Math.ceil(r)}px`);
  root.classList.add('is-skin-vt');
  try {
    const vt = document.startViewTransition(swap);
    vt.finished.finally(() => root.classList.remove('is-skin-vt'));
  } catch {
    root.classList.remove('is-skin-vt');
    swap();
  }
}

/** Random skin that isn't the current one. */
export function surpriseSkin(opts) {
  const pool = THEMES.filter((t) => t.id !== getSkin());
  applySkin(pool[Math.floor(Math.random() * pool.length)].id, opts);
}

/** Back-compat: flip light/dark. Capricorn flips between its two skins;
 *  any other skin returns to Capricorn in the opposite base. */
export function applyTheme(mode) {
  applySkin(mode === 'dark' ? 'capricorn-dark' : 'capricorn-light');
}

export function toggleTheme(opts) {
  sfx.click();
  const cur = getSkin();
  if (cur === 'capricorn-light') applySkin('capricorn-dark', opts);
  else if (cur === 'capricorn-dark') applySkin('capricorn-light', opts);
  else applySkin(getSkinDef(cur).mode === 'dark' ? 'capricorn-light' : 'capricorn-dark', opts);
}

/** Link that opens the hub in a given skin. */
export function skinShareURL(id = getSkin()) {
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('theme', id);
  return u.toString();
}

function syncThemeControls(def) {
  const label = `Theme: ${def.name} — open Appearance`;
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.style.setProperty('--skin-dot-a', def.swatch[1]);
    btn.style.setProperty('--skin-dot-b', def.swatch[2]);
  });

  const cc = document.querySelector('[data-cc="appearance"]');
  if (cc) {
    cc.classList.add('is-on');
    const em = cc.querySelector('em');
    if (em) em.textContent = def.name;
  }

  document.querySelectorAll('[data-skin-pick]').forEach((el) => {
    const on = el.dataset.skinPick === def.id;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', String(on));
  });
}

function originOf(el, e) {
  if (e && Number.isFinite(e.clientX) && (e.clientX || e.clientY)) return { x: e.clientX, y: e.clientY };
  const r = el?.getBoundingClientRect?.();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : {};
}

/** Delegated: any [data-skin-pick] anywhere applies that skin from its position. */
function bindSkinPickers() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-skin-pick]');
    if (!el) return;
    e.stopPropagation();
    sfx.click();
    applySkin(el.dataset.skinPick, originOf(el, e));
  });
}

export function initTheme() {
  const params = new URLSearchParams(location.search);
  const fromURL = resolveSkin(params.get('theme') || params.get('skin'));
  const initial = fromURL || resolveSkin(document.documentElement.dataset.skin) || readStoredSkin() || DEFAULT_SKIN;
  setSkinNow(initial, { persist: Boolean(fromURL) || Boolean(readStoredSkin()) });

  bindSkinPickers();

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'appearance' } }));
    });
  });

  document.querySelector('[data-cc="appearance"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    document.getElementById('controlCenter')?.setAttribute('hidden', '');
    document.body.classList.remove('cc-open');
    document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'appearance' } }));
  });
}
