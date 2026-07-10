import { sfx } from './sounds.js';
import { notify, getNotifyHistory } from './notifications.js';
import { setWallpaperVariant, getWallpaperVariant } from './wallpaper.js';
import { openApp, openSystem, getOpenWindows, focusWindow } from './window-manager.js';

/* ── Right-click context menu (macOS style) ─────────────────────────── */

const WALLPAPER_CYCLE = ['warm', 'cool', 'mono'];

function initContextMenu() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;

  let menu = null;

  const close = () => { menu?.remove(); menu = null; };

  const items = () => [
    { label: 'About This Device', run: () => openSystem('about') },
    { label: 'Applications', run: () => openSystem('apps') },
    { label: `Change Wallpaper (${getWallpaperVariant()})`, run: () => {
      const cur = WALLPAPER_CYCLE.indexOf(getWallpaperVariant());
      const next = WALLPAPER_CYCLE[(cur + 1) % WALLPAPER_CYCLE.length];
      setWallpaperVariant(next);
      notify({ title: 'Wallpaper', body: `Switched to ${next}. Rendered on-device, obviously.`, icon: 'assets/logo.svg', duration: 2600 });
    } },
    { label: 'Mission Control', run: () => toggleMissionControl() },
    { sep: true },
    { label: 'Lock Screen', run: () => document.dispatchEvent(new CustomEvent('cap:lock-device')) },
  ];

  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.win, .dock, .menubar, .control-center')) return;
    e.preventDefault();
    close();
    sfx.click();
    menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.setAttribute('role', 'menu');
    items().forEach((it) => {
      if (it.sep) {
        const s = document.createElement('div');
        s.className = 'ctx-menu__sep';
        menu.appendChild(s);
        return;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.textContent = it.label;
      b.addEventListener('click', () => { close(); sfx.click(); it.run(); });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - mw - 8)}px`;
    menu.style.top = `${Math.min(e.clientY, window.innerHeight - mh - 8)}px`;
  });

  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ── Notification center — click menubar clock ──────────────────────── */

function initNotifyCenter() {
  const clock = document.getElementById('menubarClock');
  if (!clock) return;
  clock.style.cursor = 'pointer';
  clock.setAttribute('title', 'Notification history');

  let panel = null;
  const close = () => { panel?.remove(); panel = null; };

  const render = () => {
    const hist = getNotifyHistory();
    const rows = hist.length
      ? hist.map((h) => `
          <div class="nc-row">
            ${h.icon ? `<img src="${h.icon}" alt="" width="26" height="26">` : ''}
            <div><strong>${h.title}</strong><p>${h.body}</p></div>
            <time>${h.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
          </div>`).join('')
      : '<p class="nc-empty">No notifications yet. Your device is at peace.</p>';
    panel.innerHTML = `<header><strong>Notifications</strong><span>${hist.length}</span></header><div class="nc-list os-scroll">${rows}</div>`;
  };

  clock.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel) { close(); return; }
    sfx.click();
    panel = document.createElement('div');
    panel.className = 'notify-center';
    render();
    document.body.appendChild(panel);
  });

  document.addEventListener('click', (e) => {
    if (panel && !panel.contains(e.target) && e.target !== clock) close();
  });
  document.addEventListener('cap:notify-history', () => { if (panel) render(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ── Idle screensaver — 75s idle → drifting clock, any input wakes ──── */

function initScreensaver() {
  const IDLE_MS = 75000;
  let timer = 0;
  let saver = null;
  let clockTimer = 0;

  const dismiss = () => {
    if (!saver) return;
    saver.classList.add('is-out');
    const s = saver;
    saver = null;
    clearInterval(clockTimer);
    setTimeout(() => s.remove(), 450);
    arm();
  };

  const show = () => {
    if (saver || document.hidden) { arm(); return; }
    if (!document.body.classList.contains('os-live')) { arm(); return; }
    if (document.getElementById('lockScreen') && !document.getElementById('lockScreen').hidden) { arm(); return; }
    saver = document.createElement('div');
    saver.className = 'screensaver';
    saver.innerHTML = `
      <div class="screensaver__drift">
        <img src="assets/logo.svg" alt="" width="64" height="64">
        <time class="num"></time>
        <p>0 bytes sent · press any key</p>
      </div>`;
    document.body.appendChild(saver);
    const t = saver.querySelector('time');
    const tick = () => { t.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    tick();
    clockTimer = setInterval(tick, 5000);
    requestAnimationFrame(() => saver?.classList.add('is-in'));
  };

  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(show, IDLE_MS);
  };

  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => {
    window.addEventListener(ev, () => { if (saver) dismiss(); else arm(); }, { passive: true });
  });
  arm();
}

/* ── Mission Control — F3 / ⌃↑ / context menu: overview of open windows ── */

let mcOpen = false;

export function toggleMissionControl() {
  if (mcOpen) { closeMissionControl(); return; }
  const wins = [...getOpenWindows().entries()].filter(([, w]) => !w.minimized);
  if (!wins.length) {
    notify({ title: 'Mission Control', body: 'No open windows. Open an app from the dock first.', icon: 'assets/logo.svg', duration: 2600 });
    return;
  }
  mcOpen = true;
  sfx.click();
  const overlay = document.createElement('div');
  overlay.className = 'mission-control';
  overlay.id = 'missionControl';
  overlay.innerHTML = '<p class="mission-control__hint">Click a window · Esc to exit</p>';

  const cols = Math.ceil(Math.sqrt(wins.length));
  wins.forEach(([id, w], i) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'mission-control__cell';
    const clone = w.el.cloneNode(true);
    clone.removeAttribute('style');
    clone.classList.add('mission-control__win');
    cell.appendChild(clone);
    const label = document.createElement('span');
    label.className = 'mission-control__label';
    label.textContent = w.el.querySelector('.win-title')?.textContent || id;
    cell.appendChild(label);
    cell.style.setProperty('--mc-i', String(i));
    cell.addEventListener('click', () => {
      closeMissionControl();
      focusWindow(id);
    });
    overlay.appendChild(cell);
  });
  overlay.style.setProperty('--mc-cols', String(cols));
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-in'));
}

function closeMissionControl() {
  const overlay = document.getElementById('missionControl');
  if (!overlay) { mcOpen = false; return; }
  overlay.classList.remove('is-in');
  setTimeout(() => overlay.remove(), 320);
  mcOpen = false;
}

function initMissionControl() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
      e.preventDefault();
      toggleMissionControl();
    }
    if (e.key === 'Escape' && mcOpen) closeMissionControl();
  });
}

/* ── Guided tour — ?tour=1 auto-pilots a 30s demo ───────────────────── */

function initTour() {
  if (new URLSearchParams(location.search).get('tour') !== '1') return;
  const steps = [
    [1500, () => notify({ title: 'Welcome to the tour', body: 'Sit back — the device drives itself for 30 seconds.', icon: 'assets/logo.svg', duration: 4000 })],
    [4500, () => openApp('vaultcap')],
    [9500, () => openApp('ledgercap')],
    [14500, () => toggleMissionControl()],
    [18500, () => { closeMissionControl(); openSystem('apps'); }],
    [26000, () => notify({ title: 'Tour over', body: 'Everything you saw ran on your device. Zero servers. Explore freely.', icon: 'assets/logo.svg', duration: 6000 })],
  ];
  steps.forEach(([at, fn]) => setTimeout(fn, at));
}

/* ── Easter egg — type "sovereignty" on the desktop ─────────────────── */

function initEasterEgg() {
  const WORD = 'sovereignty';
  let buf = '';
  document.addEventListener('keydown', (e) => {
    if (e.target?.closest?.('input, textarea, [contenteditable]')) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-WORD.length);
    if (buf === WORD) {
      buf = '';
      sfx.notify();
      notify({
        title: 'Manifesto unlocked.',
        body: 'Your data belongs to you. Not to a dashboard. Not to a model. Not to us.',
        icon: 'assets/logo.svg',
        duration: 6000,
      });
      setTimeout(() => openSystem('sovereignty'), 900);
    }
  });
}

export function initDesktopExtras() {
  initContextMenu();
  initNotifyCenter();
  initScreensaver();
  initMissionControl();
  initTour();
  initEasterEgg();
}
