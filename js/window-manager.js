import { APPS, SYSTEM } from './products.js';
import { wipBadgeHTML, launchLabel, launchHref, statusBadgeHTML, secondaryLabel, secondaryHref } from './ui-helpers.js';
import { demoHTML, initAppDemo } from './app-demos.js';
import {
  genieToDock,
  genieToMenubar,
  genieFromDock,
  genieFromMenubar,
  genieMaximize,
  genieRestore,
  getWorkspaceBounds,
  readWindowBounds,
} from './genie.js';
import { sfx } from './sounds.js';
import { appearanceHTML, bindAppearance } from './appearance.js';
import { privacyMonitorHTML, bindPrivacyMonitor, networkStats } from './privacy-monitor.js';
import { syncVersions } from './live-catalog.js';
import { canRun, runnerHTML, bindRunner } from './app-runner.js';
import { getSkinDef } from './theme.js';

let zIndex = 10;
const openWindows = new Map();

function dockSlug(id) {
  return id.startsWith('sys-') ? null : id;
}

function appPanelHTML(app) {
  const highlights = app.highlights.map((h) => `<span>${h}</span>`).join('');
  const features = app.features.map((f) => `<li>${f}</li>`).join('');

  const hasShot = Boolean(app.screenshot) && !app.wip && !app.privateBeta;
  const deviceInner = hasShot
    ? `<img class="device-preview__shot" src="${app.screenshot}" alt="${app.name} app screenshot" loading="lazy">`
    : `<div class="device-preview__status" aria-hidden="true"><span>9:41</span><span class="device-preview__sig"></span></div>
       <img class="device-preview__icon" src="${app.icon}" alt="" width="60" height="60" loading="lazy">
       <p class="device-preview__name">${app.name}</p>
       <p class="device-preview__hook">${app.hook}</p>
       <p class="device-preview__soon">${app.privateBeta ? 'Private beta' : app.wip ? 'In development' : 'Screenshot coming soon'}</p>
       <span class="device-preview__home" aria-hidden="true"></span>`;

  const launch = launchLabel(app);
  const href = launchHref(app);
  const secHref = secondaryHref(app);
  const secLabel = secondaryLabel(app);
  const statusNote = app.privateBeta ? ' · Private beta' : app.wip ? ' · In development' : '';

  return `
    <div class="app-panel app--${app.vibe}${app.light ? ' app-panel--light' : ''}${app.wip || app.privateBeta ? ' app-panel--wip' : ''}" style="--accent:${app.accent};--accent2:${app.accent2}">
      <header class="app-panel__head">
        <img class="app-panel__icon" src="${app.icon}" alt="" width="64" height="64" loading="lazy">
        <div class="app-panel__titles">
          <p class="app-panel__eyebrow">${app.category} · <span data-ver-of="${app.slug}">v${app.ver}</span>${statusNote}</p>
          <h2>${app.name}${statusBadgeHTML(app)}</h2>
          <p class="app-panel__tagline">${app.tagline}</p>
        </div>
      </header>
      <div class="app-panel__split">
        <div class="app-panel__info">
          <p class="app-panel__pitch">${app.pitch}</p>
          <ul class="app-panel__features">${features}</ul>
          ${demoHTML(app)}
          <div class="app-highlights">${highlights}</div>
          <div class="app-panel__actions">
            ${canRun(app) ? `<button type="button" class="app-run" data-run-app="${app.slug}"><span aria-hidden="true">▶</span> Run here</button>` : ''}
            <a class="app-launch${app.wip || app.privateBeta ? ' app-launch--wip' : ''}" href="${href}" ${app.privateBeta ? '' : 'target="_blank" rel="noopener"'}>
              <img src="${app.icon}" alt="" width="20" height="20"> ${launch}
            </a>
            <a class="app-secondary" href="${secHref}" target="_blank" rel="noopener">${secLabel}</a>
          </div>
        </div>
        <figure class="app-panel__device">
          <div class="device-frame">
            <div class="device-frame__island" aria-hidden="true"></div>
            <div class="device-preview${hasShot ? ' device-preview--shot' : ''}">${deviceInner}</div>
          </div>
          <figcaption class="device-caption">${hasShot ? 'On your device · live PWA' : app.privateBeta ? 'Private beta · no public install' : app.wip ? 'In development · preview only' : 'On your device · offline'}</figcaption>
        </figure>
      </div>
    </div>
  `;
}

function sovereigntyHTML() {
  return `
    <div class="sys-panel sys-panel--prefs">
      <div class="sys-panel__hero">
        <img src="${SYSTEM.logo}" alt="" width="48" height="48">
        <div>
          <h2>Device Sovereignty</h2>
          <p>Capricorn OS system preferences</p>
        </div>
      </div>
      <div class="sys-toggle"><span>Cloud sync</span><div class="sys-switch is-off" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>Analytics & telemetry</span><div class="sys-switch is-off" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>Account required</span><div class="sys-switch is-off" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>Background data collection</span><div class="sys-switch is-off" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>Offline capable</span><div class="sys-switch" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>Local encryption</span><div class="sys-switch" aria-hidden="true"></div></div>
      <div class="sys-toggle"><span>UI sounds</span><div class="sys-switch" aria-hidden="true"></div></div>
      <p class="sys-manifesto">"Your data belongs to you. That's not a tagline — it's the only rule we have."</p>
      <div class="sys-links">
        <button type="button" class="sys-link" data-open-sys="privacy">Privacy Monitor — see every request →</button>
        <button type="button" class="sys-link" data-open-sys="appearance">Appearance — ${getSkinDef().name} →</button>
      </div>
      <button type="button" class="sys-cert-btn" data-download-cert>Download sovereignty certificate</button>
      <p class="sys-build">Build ${SYSTEM.build} · ${APPS.length} apps · 0 trackers</p>
    </div>
  `;
}

/** Client-side "0 bytes leaked" certificate — canvas → PNG download. */
function downloadCertificate() {
  const stats = networkStats();
  const W = 1200;
  const H = 675;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#141210');
  bg.addColorStop(1, '#0e0d0c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  ctx.fillStyle = '#d4af37';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CAPRICORN SYSTEMS · DEVICE SOVEREIGNTY CERTIFICATE', W / 2, 120);

  ctx.fillStyle = '#f2efe8';
  ctx.font = '700 64px -apple-system, system-ui, sans-serif';
  ctx.fillText(stats.third === 0 ? '0 trackers' : `${stats.third} third-party calls`, W / 2, 260);

  ctx.fillStyle = '#9c958c';
  ctx.font = '400 24px -apple-system, system-ui, sans-serif';
  ctx.fillText(`This visit: ${stats.first} first-party requests, ${stats.third} third-party. Measured, not promised.`, W / 2, 330);
  ctx.fillText('No analytics. No ads. No account. Your Cap data stays on your device.', W / 2, 368);

  ctx.fillStyle = '#4ade80';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  const now = new Date();
  ctx.fillText(`VERIFIED ${now.toISOString().slice(0, 10)} · ${APPS.length} APPS · ${stats.third} THIRD-PARTY REQUESTS`, W / 2, 452);

  ctx.fillStyle = '#5a544c';
  ctx.font = '400 18px -apple-system, system-ui, sans-serif';
  ctx.fillText(`Issued by ${SYSTEM.name} ${SYSTEM.version} · generated client-side, like everything else`, W / 2, 560);

  const a = document.createElement('a');
  a.download = `capricorn-sovereignty-${now.toISOString().slice(0, 10)}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}

function aboutHTML() {
  return `
    <div class="sys-panel sys-panel--about sys-panel--rich">
      <div class="sys-panel__hero">
        <img src="${SYSTEM.logo}" alt="" width="64" height="64">
        <div>
          <h2>${SYSTEM.name}</h2>
          <p>Version ${SYSTEM.version} · Build ${SYSTEM.build}</p>
        </div>
      </div>
      <p class="about-lead">${SYSTEM.tagline}</p>
      <div class="about-specs">
        <div><span>Processor</span><strong>Your device</strong></div>
        <div><span>Memory</span><strong>Local only</strong></div>
        <div><span>Storage</span><strong>IndexedDB + on-device</strong></div>
        <div><span>Network</span><strong>First-party only</strong></div>
        <div><span>Accounts</span><strong>0 required</strong></div>
        <div><span>Analytics</span><strong>None</strong></div>
        <div><span>Theme</span><strong>${getSkinDef().name}</strong></div>
      </div>
      <p>Capricorn Systems builds premium personal software — ${APPS.length} Cap apps that live on your phone, work offline, and keep your data on your device. No analytics, no ads, no accounts required. Each app looks completely different. One rule ties them: <em>device sovereignty</em>.</p>
      <p>Founded and built by <strong>${SYSTEM.founder}</strong> — Cap apps for finance, training, play, recovery, wealth, travel, wellness, fragrance, cooking, collection, and your Apple setup. Encrypted or stored locally. Capricorn OS is the hub.</p>
      <p class="about-foot">Production hub: <a href="https://shamikhahmed.github.io/" target="_blank" rel="noopener">shamikhahmed.github.io</a> · Support: <a href="https://shamikhahmed.github.io/support.html" target="_blank" rel="noopener">support</a> · GitHub: <a href="https://github.com/shamikhahmed" target="_blank" rel="noopener">@shamikhahmed</a></p>
    </div>
  `;
}

function applicationsHTML() {
  const cards = APPS.map((a) => `
    <article class="app-card${a.wip || a.privateBeta ? ' app-card--wip' : ''}" data-open-app="${a.slug}">
      <img class="app-card__icon" src="${a.icon}" alt="" width="72" height="72">
      <div class="app-card__body">
        <header>
          <h3>${a.name}${statusBadgeHTML(a)}</h3>
          <span class="app-card__ver" data-ver-of="${a.slug}">v${a.ver}</span>
        </header>
        <p class="app-card__cat">${a.category}${a.privateBeta ? ' · Private beta' : a.wip ? ' · In development' : ''}</p>
        <p class="app-card__tag">${a.tagline}</p>
        <p class="app-card__pitch">${a.pitch}</p>
        <ul class="app-card__features">${a.features.map((f) => `<li>${f}</li>`).join('')}</ul>
        <div class="app-card__actions">
          <button type="button" class="app-card__open" data-open-app="${a.slug}">Open</button>
          <a href="${launchHref(a)}" ${a.privateBeta ? '' : 'target="_blank" rel="noopener"'} class="app-card__launch">${a.privateBeta ? 'Private beta' : a.wip ? 'GitHub ↗' : 'Launch PWA ↗'}</a>
        </div>
      </div>
    </article>
  `).join('');

  return `
    <div class="sys-panel sys-panel--apps">
      <header class="apps-header">
        <h2>Applications</h2>
        <p>${APPS.filter((a) => !a.privateBeta).length} live Cap apps + DeeFoodie private beta. Open a card for details — or hit <strong>Run here</strong> to use the real app inside Capricorn OS.</p>
      </header>
      <div class="apps-grid">${cards}</div>
    </div>
  `;
}

function helpHTML() {
  return `
    <div class="sys-panel">
      <h2>Help</h2>
      <div class="help-grid">
        <div><strong>Dock</strong><p>Click icons to open apps. Yellow minimizes with genie. Green maximizes.</p></div>
        <div><strong>Run here</strong><p>Every live Cap runs inside its window — the real app, not a video.</p></div>
        <div><strong>Themes</strong><p>Ten looks in Appearance, Control Center, or right-click → Next Theme.</p></div>
        <div><strong>⌘K</strong><p>Spotlight: apps, themes, Privacy Monitor, lock.</p></div>
        <div><strong>Windows</strong><p>Drag the title bar. Drag the corner to resize. Double-click to maximize.</p></div>
        <div><strong>Privacy Monitor</strong><p>Counts every request this page makes. Third-party: zero.</p></div>
      </div>
    </div>
  `;
}

function createWindow({ id, title, content, app = false, system = false, wide = false, fromDock = true }) {
  const container = document.getElementById('windows');
  const el = document.createElement('div');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const defaultW = Math.round(wide ? Math.min(940, vw * 0.92) : app ? Math.min(760, vw * 0.94) : system ? Math.min(460, vw * 0.92) : 520);
  const defaultH = Math.round(wide ? Math.min(660, vh * 0.8) : app ? Math.min(600, vh * 0.78) : Math.min(480, vh * 0.7));
  const left = Math.max(8, Math.min(60 + (openWindows.size * 32) % 220, vw - defaultW - 8));
  const top = Math.max(44, Math.min(48 + (openWindows.size * 28) % 140, vh - defaultH - 90));

  el.className = `win${app || wide ? ' win--app' : ''}${system ? ' win--system' : ''}${wide ? ' win--wide' : ''}`;
  el.dataset.winId = id;
  el.style.zIndex = ++zIndex;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.width = `${defaultW}px`;
  el.style.height = `${defaultH}px`;

  el.innerHTML = `
    <div class="win-titlebar" data-drag>
      <div class="win-traffic">
        <button type="button" class="win-close" aria-label="Close"></button>
        <button type="button" class="win-min" aria-label="Minimize"></button>
        <button type="button" class="win-max" aria-label="Maximize"></button>
      </div>
      <span class="win-title">${title}</span>
    </div>
    <div class="win-body">${content}</div>
    <span class="win-resize" aria-hidden="true"></span>
  `;

  container.appendChild(el);

  const state = {
    el,
    minimized: false,
    maximized: false,
    origin: fromDock && dockSlug(id) ? 'dock' : 'menubar',
    saved: { left, top, width: defaultW, height: defaultH },
  };
  openWindows.set(id, state);

  el.querySelectorAll('[data-open-app]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openApp(btn.dataset.openApp);
    });
  });

  el.querySelectorAll('.app-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      openApp(card.dataset.openApp);
    });
  });

  el.querySelector('[data-download-cert]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    downloadCertificate();
  });

  el.querySelectorAll('[data-open-sys]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      openSystem(btn.dataset.openSys);
    });
  });

  if (el.querySelector('.appear')) bindAppearance(el);
  if (el.querySelector('.sys-panel--privacy')) bindPrivacyMonitor(el);

  const demoApp = APPS.find((a) => a.slug === id);
  if (demoApp) {
    initAppDemo(el, demoApp);
    bindRunButton(el, demoApp);
  }
  syncVersions(el);

  bindWindow(el, id);

  if (state.origin === 'dock' && dockSlug(id)) {
    el.style.opacity = '0';
    genieFromDock(el, id, left, top, defaultW, defaultH).then(() => {
      focusWindow(id);
      sfx.windowOpen();
    });
  } else {
    el.style.opacity = '0';
    genieFromMenubar(el, left, top, defaultW, defaultH).then(() => {
      focusWindow(id);
      sfx.windowOpen();
    });
  }

  return id;
}

function bindWindow(el, id) {
  const titlebar = el.querySelector('[data-drag]');
  const closeBtn = el.querySelector('.win-close');
  const minBtn = el.querySelector('.win-min');
  const maxBtn = el.querySelector('.win-max');

  el.addEventListener('pointerdown', () => focusWindow(id));

  closeBtn.addEventListener('click', () => closeWindow(id));
  minBtn.addEventListener('click', () => minimizeWindow(id));
  maxBtn.addEventListener('click', () => toggleMaximize(id));

  titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.win-traffic')) return;
    toggleMaximize(id);
  });

  // Pointer events: mouse, pen and touch (iPad / touch laptops) all drag.
  let drag = null;
  titlebar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.win-traffic, button, a')) return;
    const win = openWindows.get(id);
    if (win?.maximized) return;
    drag = { x: e.clientX, y: e.clientY, left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
    titlebar.setPointerCapture?.(e.pointerId);
    el.classList.add('is-dragging');
    e.preventDefault();
  });
  titlebar.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const maxL = window.innerWidth - 80;
    const maxT = window.innerHeight - 60;
    el.style.left = `${Math.min(maxL, Math.max(8 - el.offsetWidth + 120, drag.left + e.clientX - drag.x))}px`;
    el.style.top = `${Math.min(maxT, Math.max(40, drag.top + e.clientY - drag.y))}px`;
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    el.classList.remove('is-dragging');
    const win = openWindows.get(id);
    if (win && !win.maximized) win.saved = readWindowBounds(el);
  };
  titlebar.addEventListener('pointerup', endDrag);
  titlebar.addEventListener('pointercancel', endDrag);

  const grip = el.querySelector('.win-resize');
  let size = null;
  grip?.addEventListener('pointerdown', (e) => {
    const win = openWindows.get(id);
    if (win?.maximized) return;
    size = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight };
    grip.setPointerCapture?.(e.pointerId);
    el.classList.add('is-resizing');
    e.preventDefault();
    e.stopPropagation();
  });
  grip?.addEventListener('pointermove', (e) => {
    if (!size) return;
    const w = Math.max(320, Math.min(window.innerWidth - el.offsetLeft - 8, size.w + e.clientX - size.x));
    const h = Math.max(240, Math.min(window.innerHeight - el.offsetTop - 12, size.h + e.clientY - size.y));
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.maxHeight = 'none';
  });
  const endSize = () => {
    if (!size) return;
    size = null;
    el.classList.remove('is-resizing');
    const win = openWindows.get(id);
    if (win && !win.maximized) win.saved = readWindowBounds(el);
  };
  grip?.addEventListener('pointerup', endSize);
  grip?.addEventListener('pointercancel', endSize);
}

/** "Run here": swap the info panel for the live app, sized like a phone. */
function bindRunButton(el, app) {
  const btn = el.querySelector('[data-run-app]');
  if (!btn) return;
  const body = el.querySelector('.win-body');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    const info = body.innerHTML;
    const prev = { width: el.style.width, height: el.style.height, maxHeight: el.style.maxHeight };
    const win = openWindows.get(app.slug);
    if (!win?.maximized) {
      const h = Math.min(window.innerHeight - 120, 900);
      el.style.maxHeight = 'none';
      el.style.height = `${h}px`;
      el.style.width = `${Math.min(window.innerWidth - 24, Math.max(460, Math.round(h * 0.56)))}px`;
      const maxT = window.innerHeight - h - 80;
      el.style.top = `${Math.max(44, Math.min(parseFloat(el.style.top), maxT))}px`;
      const maxL = window.innerWidth - el.offsetWidth - 8;
      el.style.left = `${Math.max(8, Math.min(parseFloat(el.style.left), maxL))}px`;
    }
    el.classList.add('win--running');
    body.innerHTML = runnerHTML(app);
    bindRunner(body, {
      onBack: () => {
        el.classList.remove('win--running');
        body.innerHTML = info;
        if (!openWindows.get(app.slug)?.maximized) Object.assign(el.style, prev);
        body.querySelectorAll('[data-open-app]').forEach((b) => b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openApp(b.dataset.openApp);
        }));
        initAppDemo(el, app);
        bindRunButton(el, app);
        syncVersions(el);
      },
    });
    const w = openWindows.get(app.slug);
    if (w && !w.maximized) w.saved = readWindowBounds(el);
  });
}

export function focusWindow(id) {
  const win = openWindows.get(id);
  if (!win || win.minimized) return;
  win.el.style.zIndex = ++zIndex;
  win.el.classList.add('is-focused');
  openWindows.forEach((w, k) => {
    if (k !== id) w.el.classList.remove('is-focused');
  });
  document.dispatchEvent(new CustomEvent('cap:window-focus', { detail: { id } }));
}

function closeWindow(id) {
  const win = openWindows.get(id);
  if (!win) return;
  win.el.style.pointerEvents = 'none';
  sfx.windowClose();

  const slug = dockSlug(id) || 'system';
  const finish = () => {
    win.el.remove();
    openWindows.delete(id);
    document.dispatchEvent(new CustomEvent('cap:window-close', { detail: { id } }));
  };

  if (win.minimized) {
    finish();
    return;
  }

  if (win.origin === 'menubar') {
    genieToMenubar(win.el, finish);
  } else {
    genieToDock(win.el, slug, finish);
  }
}

function minimizeWindow(id) {
  const win = openWindows.get(id);
  if (!win || win.minimized) return;

  if (win.maximized) {
    const bounds = getWorkspaceBounds();
    genieRestore(win.el, bounds, win.saved, () => {
      win.maximized = false;
      win.el.classList.remove('is-maximized');
      win.el.querySelector('.win-max').setAttribute('aria-label', 'Maximize');
      doMinimize(id);
    });
    return;
  }

  win.saved = readWindowBounds(win.el);
  doMinimize(id);
}

function doMinimize(id) {
  const win = openWindows.get(id);
  if (!win) return;

  const slug = dockSlug(id) || 'system';
  win.el.style.pointerEvents = 'none';
  sfx.minimize();

  const onDone = () => {
    win.el.getAnimations?.().forEach((a) => a.cancel());
    win.el.style.transform = '';
    win.el.style.filter = '';
    win.el.style.opacity = '0';
    win.minimized = true;
    win.el.classList.add('is-minimized');
    win.el.style.pointerEvents = 'none';
    document.dispatchEvent(new CustomEvent('cap:window-minimize', { detail: { id, minimized: true } }));
  };

  if (win.origin === 'menubar') {
    genieToMenubar(win.el, onDone);
  } else {
    genieToDock(win.el, slug, onDone);
  }
}

export function restoreWindow(id) {
  const win = openWindows.get(id);
  if (!win || !win.minimized) return;

  const { left, top, width, height } = win.saved;
  win.minimized = false;
  win.el.classList.remove('is-minimized');
  win.el.style.pointerEvents = 'auto';
  win.el.style.opacity = '1';

  const slug = dockSlug(id) || 'system';
  sfx.restore();

  const onDone = () => {
    win.el.getAnimations?.().forEach((a) => a.cancel());
    win.el.style.transform = '';
    win.el.style.filter = '';
    win.el.style.opacity = '1';
    focusWindow(id);
    document.dispatchEvent(new CustomEvent('cap:window-minimize', { detail: { id, minimized: false } }));
  };

  if (win.origin === 'menubar') {
    genieFromMenubar(win.el, left, top, width, height).then(onDone);
  } else {
    genieFromDock(win.el, slug, left, top, width, height).then(onDone);
  }
}

function toggleMaximize(id) {
  const win = openWindows.get(id);
  if (!win || win.minimized) return;

  if (win.maximized) {
    const bounds = getWorkspaceBounds();
    sfx.restore();
    genieRestore(win.el, bounds, win.saved, () => {
      win.maximized = false;
      win.el.classList.remove('is-maximized');
      win.el.querySelector('.win-max').setAttribute('aria-label', 'Maximize');
    });
  } else {
    win.saved = readWindowBounds(win.el);
    const bounds = getWorkspaceBounds();
    sfx.maximize();
    win.maximized = true;
    win.el.classList.add('is-maximized');
    win.el.querySelector('.win-max').setAttribute('aria-label', 'Restore');
    genieMaximize(win.el, bounds, win.saved);
  }
}

export function openApp(slug) {
  if (openWindows.has(slug)) {
    const win = openWindows.get(slug);
    if (win.minimized) restoreWindow(slug);
    else focusWindow(slug);
    return slug;
  }
  const app = APPS.find((a) => a.slug === slug);
  if (!app) return null;
  return createWindow({ id: slug, title: app.name, content: appPanelHTML(app), app: true });
}

export function openSystem(action) {
  const id = `sys-${action}`;
  if (openWindows.has(id)) {
    const win = openWindows.get(id);
    if (win.minimized) restoreWindow(id);
    else focusWindow(id);
    return id;
  }
  const map = {
    sovereignty: { title: 'System Preferences', content: sovereigntyHTML(), system: true },
    about: { title: 'About This Device', content: aboutHTML(), system: true },
    apps: { title: 'Applications', content: applicationsHTML(), wide: true },
    help: { title: 'Help', content: helpHTML(), system: true },
    appearance: { title: 'Appearance', content: appearanceHTML(), wide: true },
    privacy: { title: 'Privacy Monitor', content: privacyMonitorHTML(), system: true },
  };
  const cfg = map[action];
  if (!cfg) return null;
  return createWindow({
    id,
    title: cfg.title,
    content: cfg.content,
    system: cfg.system,
    app: cfg.wide,
    fromDock: false,
  });
}

export function getOpenWindows() {
  return openWindows;
}
