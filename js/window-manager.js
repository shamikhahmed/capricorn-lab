import { APPS, SYSTEM } from './products.js';
import { wipBadgeHTML, launchLabel, launchHref } from './ui-helpers.js';
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

let zIndex = 10;
const openWindows = new Map();

function dockSlug(id) {
  return id.startsWith('sys-') ? null : id;
}

function appPanelHTML(app) {
  const highlights = app.highlights.map((h) => `<span>${h}</span>`).join('');
  const features = app.features.map((f) => `<li>${f}</li>`).join('');

  const hasShot = Boolean(app.screenshot) && !app.wip;
  const deviceInner = hasShot
    ? `<img class="device-preview__shot" src="${app.screenshot}" alt="${app.name} app screenshot" loading="lazy">`
    : `<div class="device-preview__status" aria-hidden="true"><span>9:41</span><span class="device-preview__sig"></span></div>
       <img class="device-preview__icon" src="${app.icon}" alt="" width="60" height="60" loading="lazy">
       <p class="device-preview__name">${app.name}</p>
       <p class="device-preview__hook">${app.hook}</p>
       <p class="device-preview__soon">${app.wip ? 'In development' : 'Screenshot coming soon'}</p>
       <span class="device-preview__home" aria-hidden="true"></span>`;

  const launch = launchLabel(app);
  const href = launchHref(app);

  return `
    <div class="app-panel app--${app.vibe}${app.light ? ' app-panel--light' : ''}${app.wip ? ' app-panel--wip' : ''}" style="--accent:${app.accent};--accent2:${app.accent2}">
      <header class="app-panel__head">
        <img class="app-panel__icon" src="${app.icon}" alt="" width="64" height="64" loading="lazy">
        <div class="app-panel__titles">
          <p class="app-panel__eyebrow">${app.category} · v${app.ver}${app.wip ? ' · In development' : ''}</p>
          <h2>${app.name}${app.wip ? wipBadgeHTML() : ''}</h2>
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
            <a class="app-launch${app.wip ? ' app-launch--wip' : ''}" href="${href}" target="_blank" rel="noopener">
              <img src="${app.icon}" alt="" width="20" height="20"> ${launch}
            </a>
            <a class="app-secondary" href="${app.pitchUrl}" target="_blank" rel="noopener">${app.wip ? 'Repository' : 'Pitch deck'}</a>
          </div>
        </div>
        <figure class="app-panel__device">
          <div class="device-frame">
            <div class="device-frame__island" aria-hidden="true"></div>
            <div class="device-preview${hasShot ? ' device-preview--shot' : ''}">${deviceInner}</div>
          </div>
          <figcaption class="device-caption">${hasShot ? 'On your device · live PWA' : app.wip ? 'In development · preview only' : 'On your device · offline'}</figcaption>
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
      <button type="button" class="sys-cert-btn" data-download-cert>Download sovereignty certificate</button>
      <p class="sys-build">Build ${SYSTEM.build} · ${APPS.length} apps · 0 servers</p>
    </div>
  `;
}

/** Client-side "0 bytes leaked" certificate — canvas → PNG download. */
function downloadCertificate() {
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
  ctx.font = '700 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('0 bytes leaked', W / 2, 260);

  ctx.fillStyle = '#9c958c';
  ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('This session ran entirely on your device.', W / 2, 330);
  ctx.fillText('No cloud sync. No analytics. No account. No telemetry.', W / 2, 368);

  ctx.fillStyle = '#4ade80';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  const now = new Date();
  ctx.fillText(`VERIFIED ${now.toISOString().slice(0, 10)} · ${APPS.length} APPS · 0 SERVERS`, W / 2, 452);

  ctx.fillStyle = '#5a544c';
  ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
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
        <div><span>Network</span><strong>Disabled by design</strong></div>
        <div><span>Accounts</span><strong>0 required</strong></div>
        <div><span>Analytics</span><strong>None</strong></div>
      </div>
      <p>Capricorn Systems builds premium personal software — ${APPS.length} Cap apps that live on your phone, work offline, and never phone home. Each app looks completely different. One rule ties them: <em>device sovereignty</em>.</p>
      <p>Founded and built by <strong>${SYSTEM.founder}</strong> — one person, ten worlds, zero cloud dependency. Finance, performance, play, recovery, wealth, travel, wellness, fragrance, Apple ecosystem, and collection tools — all encrypted or stored locally before anything is saved.</p>
      <p class="about-foot">Experimental lab · Production hub: <a href="https://shamikhahmed.github.io/" target="_blank" rel="noopener">shamikhahmed.github.io</a> · GitHub: <a href="https://github.com/shamikhahmed" target="_blank" rel="noopener">@shamikhahmed</a></p>
    </div>
  `;
}

function applicationsHTML() {
  const cards = APPS.map((a) => `
    <article class="app-card${a.wip ? ' app-card--wip' : ''}" data-open-app="${a.slug}">
      <img class="app-card__icon" src="${a.icon}" alt="" width="72" height="72">
      <div class="app-card__body">
        <header>
          <h3>${a.name}${a.wip ? wipBadgeHTML() : ''}</h3>
          <span class="app-card__ver">v${a.ver}</span>
        </header>
        <p class="app-card__cat">${a.category}${a.wip ? ' · In development' : ''}</p>
        <p class="app-card__tag">${a.tagline}</p>
        <p class="app-card__pitch">${a.pitch}</p>
        <ul class="app-card__features">${a.features.map((f) => `<li>${f}</li>`).join('')}</ul>
        <div class="app-card__actions">
          <button type="button" class="app-card__open" data-open-app="${a.slug}">Open</button>
          <a href="${launchHref(a)}" target="_blank" rel="noopener" class="app-card__launch">${a.wip ? 'GitHub ↗' : 'Launch PWA ↗'}</a>
        </div>
      </div>
    </article>
  `).join('');

  return `
    <div class="sys-panel sys-panel--apps">
      <header class="apps-header">
        <h2>Applications</h2>
        <p>${APPS.length} Cap apps — installed on your device. No App Store. No accounts. Click any app to open its window.</p>
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
        <div><strong>Widgets & Tasks</strong><p>Live app data on desktop and iOS Today — tap to open.</p></div>
        <div><strong>⌘K</strong><p>Spotlight-style command palette.</p></div>
        <div><strong>Title bar</strong><p>Double-click to maximize. Drag to move.</p></div>
      </div>
    </div>
  `;
}

function createWindow({ id, title, content, app = false, system = false, wide = false, fromDock = true }) {
  const container = document.getElementById('windows');
  const el = document.createElement('div');
  const defaultW = wide ? Math.min(900, window.innerWidth * 0.92) : app ? Math.min(720, window.innerWidth * 0.94) : system ? 440 : 520;
  const defaultH = wide ? Math.min(640, window.innerHeight * 0.78) : app ? Math.min(560, window.innerHeight * 0.75) : 400;
  const left = 60 + (openWindows.size * 32) % 220;
  const top = 48 + (openWindows.size * 28) % 140;

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

  const demoApp = APPS.find((a) => a.slug === id);
  if (demoApp) initAppDemo(el, demoApp);

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

  el.addEventListener('mousedown', () => focusWindow(id));

  closeBtn.addEventListener('click', () => closeWindow(id));
  minBtn.addEventListener('click', () => minimizeWindow(id));
  maxBtn.addEventListener('click', () => toggleMaximize(id));

  titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.win-traffic')) return;
    toggleMaximize(id);
  });

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.win-traffic')) return;
    const win = openWindows.get(id);
    if (win?.maximized) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = parseFloat(el.style.left);
    origY = parseFloat(el.style.top);
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    el.style.left = `${Math.max(8, origX + e.clientX - startX)}px`;
    el.style.top = `${Math.max(40, origY + e.clientY - startY)}px`;
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      const win = openWindows.get(id);
      if (win && !win.maximized) win.saved = readWindowBounds(el);
    }
    dragging = false;
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
