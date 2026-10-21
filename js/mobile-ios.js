import { APPS, SYSTEM, SOCIAL, renderHomeIcon, bindSocialClicks } from './social.js';
import { renderMobileTasks, bindTaskClicks } from './tasks.js';
import { IOS_WIDGET_SNAPSHOTS } from './widgets.js';
import { launchHref, launchLabel, statusBadgeHTML, shortBadgeHTML, screenshotFor } from './ui-helpers.js';
import { sfx } from './sounds.js';
import { getSkinDef } from './theme.js';
import { initWallpaper } from './wallpaper.js';
import { appearanceHTML, bindAppearance } from './appearance.js';
import { privacyMonitorHTML, bindPrivacyMonitor, watchNetwork, proofLine } from './privacy-monitor.js';
import { canRun, runnerHTML, bindRunner } from './app-runner.js';
import { syncVersions } from './live-catalog.js';

/** Phone dock = 4 favourites (iOS limit). iPad dock = 9 + App Library. */
const DOCK_PHONE = ['vaultcap', 'pulsecap', 'ledgercap', 'scentcap'];
const DOCK_TABLET = ['vaultcap', 'pulsecap', 'ledgercap', 'steadycap', 'soulcap', 'travelcap', 'scentcap', 'cookcap'];

const isTablet = () => document.documentElement.dataset.view === 'tablet';
const appBySlug = (slug) => APPS.find((a) => a.slug === slug);

function startIOSClock() {
  const el = document.getElementById('iosClock');
  const wt = document.getElementById('iosWidgetTime');
  const wd = document.getElementById('iosWidgetDate');
  const tick = () => {
    const now = new Date();
    const fmt = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (el) el.textContent = now.toLocaleTimeString([], fmt);
    if (wt) wt.textContent = now.toLocaleTimeString([], fmt);
    if (wd) wd.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  };
  tick();
  setInterval(tick, 1000);
}

function buildIOSWidgets() {
  const appTile = (a, i) => {
    const snap = IOS_WIDGET_SNAPSHOTS[a.slug] || { big: a.symbol, small: a.tagline, extra: '' };
    return `
    <button type="button" class="ios-widget ios-widget--app${a.wip ? ' ios-widget--wip' : ''}" style="--w-accent:${a.accent};--live-i:${i + 1}" data-app-sheet="${a.slug}">
      <header><img src="${a.icon}" alt="" width="20" height="20"><span>${a.name}</span>${shortBadgeHTML(a)}</header>
      <strong>${snap.big}</strong>
      <small>${snap.small}</small>
      ${snap.extra || ''}
    </button>`;
  };

  return `
    <div class="ios-widgets" aria-label="Widgets">
      <div class="ios-widget ios-widget--clock ios-widget--span2" style="--live-i:0">
        <time id="iosWidgetTime">--:--</time>
        <p id="iosWidgetDate"></p>
        <span class="ios-widget__proof"><i aria-hidden="true"></i><b id="iosProof">0 trackers · 0 third-party requests</b></span>
      </div>
      ${APPS.map((a, i) => appTile(a, i)).join('')}
    </div>`;
}

function appIconHTML(app) {
  return `
    <button type="button" class="home-icon home-icon--app${app.wip ? ' home-icon--wip' : ''}" data-app-sheet="${app.slug}" aria-label="${app.name}">
      <span class="home-icon__glyph home-icon__glyph--img">
        <img src="${app.icon}" alt="" width="60" height="60">
        ${app.privateBeta ? '<span class="home-icon__badge">Beta</span>' : app.wip ? '<span class="home-icon__badge">WIP</span>' : ''}
      </span>
      <span class="home-icon__label">${app.name}</span>
    </button>`;
}

function sysIconHTML({ id, label, glyph, img }) {
  return `
    <button type="button" class="home-icon home-icon--sys" data-ios-sys="${id}" aria-label="${label}">
      <span class="home-icon__glyph home-icon__glyph--sys">${img ? `<img src="${img}" alt="" width="60" height="60">` : glyph}</span>
      <span class="home-icon__label">${label}</span>
    </button>`;
}

const SYS_ICONS = [
  { id: 'about', label: 'About', img: SYSTEM.logo },
  { id: 'apps', label: 'Library', glyph: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"/></svg>' },
  { id: 'appearance', label: 'Themes', glyph: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>' },
  { id: 'privacy', label: 'Privacy', glyph: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5.05 3.41 9.76 8 11 4.59-1.24 8-5.95 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z"/></svg>' },
  { id: 'sovereignty', label: 'Settings', glyph: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>' },
];

function renderDock() {
  const dock = document.getElementById('iosDock');
  if (!dock) return;
  const slugs = isTablet() ? DOCK_TABLET : DOCK_PHONE;
  const icons = slugs.map(appBySlug).filter(Boolean).map((app, i) => `
    <button type="button" class="ios-dock__icon" style="--dock-i:${i}" data-app-sheet="${app.slug}" aria-label="${app.name}">
      <img src="${app.icon}" alt="" width="54" height="54">
    </button>`).join('');
  const library = isTablet() ? `
    <span class="ios-dock__sep" aria-hidden="true"></span>
    <button type="button" class="ios-dock__icon ios-dock__icon--lib" data-ios-sys="apps" aria-label="App Library — all ${APPS.length} Caps">
      ${APPS.slice(0, 4).map((a) => `<img src="${a.icon}" alt="">`).join('')}
    </button>` : '';
  dock.innerHTML = icons + library;
}

function initPages() {
  const pages = document.getElementById('iosPages');
  const dots = document.getElementById('iosDots');
  if (!pages || !dots) return;

  const pageEls = pages.querySelectorAll('.ios-page');
  pageEls.forEach((page, i) => {
    page.setAttribute('role', 'tabpanel');
    page.id = `iosPage${i + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `ios-dot${i === 0 ? ' is-active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.setAttribute('aria-controls', page.id);
    dot.setAttribute('aria-label', `Page ${i + 1}`);
    dot.addEventListener('click', () => {
      pages.scrollTo({ left: pages.clientWidth * i, behavior: 'smooth' });
    });
    dots.appendChild(dot);
  });
  dots.setAttribute('role', 'tablist');

  pages.addEventListener('scroll', () => {
    const idx = Math.round(pages.scrollLeft / pages.clientWidth);
    dots.querySelectorAll('.ios-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  }, { passive: true });
}

export function initIOSHome() {
  const todayHost = document.getElementById('iosToday');
  const tasksHost = document.getElementById('iosTasksPage');
  const appGrid = document.getElementById('iosAppGrid');
  const socialGrid = document.getElementById('iosSocialGrid');

  const wall = document.getElementById('iosWallpaper');
  if (wall) initWallpaper(wall, { surface: 'ios' });

  if (todayHost) {
    todayHost.innerHTML = `<p class="ios-page-label">Today</p>${buildIOSWidgets()}`;
  }

  if (tasksHost && appGrid) {
    tasksHost.insertAdjacentHTML('afterbegin', `${renderMobileTasks()}<p class="ios-page-label ios-page-label--apps">Apps</p>`);
    appGrid.innerHTML = SYS_ICONS.map(sysIconHTML).join('') + APPS.map(appIconHTML).join('');

    bindTaskClicks(tasksHost, {
      onOpen: (slug) => openSheet('app', { slug }),
      onSocial: (social) => {
        const pages = document.getElementById('iosPages');
        pages?.scrollTo({ left: pages.clientWidth * 2, behavior: 'smooth' });
        setTimeout(() => {
          document.querySelector(`#iosSocialGrid [data-social="${social}"]`)?.click();
        }, 400);
      },
    });
  }

  if (socialGrid) {
    socialGrid.innerHTML = SOCIAL.map((item) => renderHomeIcon(item, { variant: 'grid' })).join('');
    bindSocialClicks(socialGrid);
  }

  renderDock();
  document.addEventListener('cap:view', renderDock);

  // one delegated handler for every app / system tap on the home screen
  document.getElementById('mobile')?.addEventListener('click', (e) => {
    const appEl = e.target.closest('[data-app-sheet]');
    const sysEl = e.target.closest('[data-ios-sys]');
    if (appEl && !appEl.closest('.ios-sheet')) {
      sfx.click();
      openSheet('app', { slug: appEl.dataset.appSheet });
    } else if (sysEl && !sysEl.closest('.ios-sheet')) {
      sfx.click();
      openSheet(sysEl.dataset.iosSys);
    }
  });

  document.getElementById('iosThemeToggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    openSheet('appearance');
  });

  const proof = document.getElementById('iosProof');
  if (proof) watchNetwork((s) => { proof.textContent = proofLine(s); });

  startIOSClock();
  initPages();
  initIOSSheets();
}

/* ── Sheets ────────────────────────────────────────────────────────────── */

let sheetCleanup = null;

function head(title, { back = '' } = {}) {
  return `<div class="ios-sheet__head">
    ${back ? `<button type="button" class="ios-sheet__back" data-sheet-back="${back}">‹ Back</button>` : '<span></span>'}
    <h2>${title}</h2>
    <button type="button" class="ios-sheet__close" data-close>Done</button>
  </div>`;
}

function appSheetHTML(app) {
  const shot = app.screenshot && !app.wip && !app.privateBeta;
  return `
    ${head(app.name)}
    <div class="ios-sheet__body ios-app" style="--accent:${app.accent}">
      <header class="ios-app__hero">
        <img src="${app.icon}" alt="" width="76" height="76">
        <div>
          <p class="ios-app__cat">${app.category} · <span data-ver-of="${app.slug}">v${app.ver}</span></p>
          <h3>${app.name}${statusBadgeHTML(app)}</h3>
          <p class="ios-app__tag">${app.tagline}</p>
        </div>
      </header>
      <div class="ios-app__actions">
        ${canRun(app) ? '<button type="button" class="ios-app__run" data-sheet-run>▶ Try it here</button>' : ''}
        <a class="ios-app__open" href="${launchHref(app)}" ${app.privateBeta ? '' : 'target="_blank" rel="noopener"'}>${app.privateBeta ? 'Private beta — ask for access' : `${launchLabel(app)} ↗`}</a>
        <a class="ios-app__open ios-app__open--secondary" href="/apps/${app.slug}/" target="_blank" rel="noopener">Website</a>
        <a class="ios-app__open ios-app__open--secondary" href="/apps/${app.slug}/#who-h" target="_blank" rel="noopener">Example stories</a>
      </div>
      <p class="ios-app__pitch">${app.pitch}</p>
      ${shot ? `<figure class="ios-app__shot"><img src="${screenshotFor(app)}" alt="${app.name} screenshot" loading="lazy"></figure>` : ''}
      <ul class="ios-app__features">${app.features.map((f) => `<li>${f}</li>`).join('')}</ul>
      <div class="ios-app__chips">${app.highlights.map((h) => `<span>${h}</span>`).join('')}</div>
    </div>`;
}

function libraryHTML() {
  return `
    ${head('App Library')}
    <div class="ios-sheet__body ios-sheet__list">
      ${APPS.map((a) => `
        <button type="button" class="ios-sheet__row${a.wip ? ' ios-sheet__row--wip' : ''}" data-sheet-app="${a.slug}">
          <img src="${a.icon}" alt="" width="40" height="40">
          <div><strong>${a.name}${a.privateBeta ? ' · Beta' : ''}</strong><span>${a.tagline}</span></div>
          <em data-ver-of="${a.slug}">v${a.ver}</em>
        </button>`).join('')}
    </div>`;
}

function settingsHTML() {
  return `
    ${head('Settings')}
    <div class="ios-sheet__body">
      <ul class="ios-settings">
        <li><span>Theme</span><button type="button" class="ios-settings__go" data-sheet-go="appearance">${getSkinDef().name} ›</button></li>
        <li><span>Privacy Monitor</span><button type="button" class="ios-settings__go" data-sheet-go="privacy">Open ›</button></li>
      </ul>
      <ul class="ios-settings">
        <li><span>Cloud sync</span><em>Off</em></li>
        <li><span>Analytics</span><em>Off</em></li>
        <li><span>Works offline</span><em>On</em></li>
        <li><span>Accounts required</span><em>None</em></li>
      </ul>
      <p class="ios-settings__note">Your data belongs to you.</p>
    </div>`;
}

function aboutHTML() {
  return `
    ${head(SYSTEM.name)}
    <div class="ios-sheet__body ios-about">
      <img src="${SYSTEM.logo}" alt="" width="64" height="64">
      <p class="ios-about__tag">${SYSTEM.tagline}</p>
      <p>Built by <strong>${SYSTEM.founder}</strong>. ${APPS.length} Cap apps, each with its own look — one rule: your data stays on your device.</p>
      <p>Version ${SYSTEM.version} · ${getSkinDef().name} theme</p>
      <p><a href="https://shamikhahmed.github.io/support.html" target="_blank" rel="noopener">Support</a> · <a href="https://shamikhahmed.github.io/privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="https://github.com/shamikhahmed" target="_blank" rel="noopener">GitHub</a></p>
    </div>`;
}

let openSheet = () => {};

function initIOSSheets() {
  const sheet = document.getElementById('iosSheet');
  const backdrop = document.getElementById('iosSheetBackdrop');
  if (!sheet) return;

  const close = () => {
    sheetCleanup?.();
    sheetCleanup = null;
    sheet.classList.add('is-closing');
    backdrop?.classList.add('is-closing');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      sheet.hidden = true;
      if (backdrop) backdrop.hidden = true;
      sheet.classList.remove('is-closing', 'ios-sheet--full');
      backdrop?.classList.remove('is-closing');
      sheet.innerHTML = '';
    }, reduced ? 0 : 220);
  };

  const render = (action, opts = {}) => {
    sheetCleanup?.();
    sheetCleanup = null;
    sheet.classList.remove('ios-sheet--full');
    const app = opts.slug ? appBySlug(opts.slug) : null;

    if (action === 'app' && app) {
      sheet.innerHTML = appSheetHTML(app);
      sheet.querySelector('[data-sheet-run]')?.addEventListener('click', () => {
        sfx.click();
        render('run', { slug: app.slug });
      });
    } else if (action === 'run' && app) {
      sheet.classList.add('ios-sheet--full');
      sheet.innerHTML = runnerHTML(app, { surface: 'ios' });
      bindRunner(sheet, { onBack: () => render('app', { slug: app.slug }) });
    } else if (action === 'apps') {
      sheet.innerHTML = libraryHTML();
    } else if (action === 'appearance') {
      sheet.innerHTML = `${head('Themes', { back: opts.back || '' })}<div class="ios-sheet__body">${appearanceHTML({ surface: 'ios' })}</div>`;
      bindAppearance(sheet, { surface: 'ios' });
    } else if (action === 'privacy') {
      sheet.innerHTML = `${head('Privacy', { back: opts.back || '' })}<div class="ios-sheet__body">${privacyMonitorHTML()}</div>`;
      sheetCleanup = bindPrivacyMonitor(sheet);
    } else if (action === 'sovereignty') {
      sheet.innerHTML = settingsHTML();
    } else if (action === 'about') {
      sheet.innerHTML = aboutHTML();
    } else {
      return;
    }

    syncVersions(sheet);
    sheet.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); close(); }));
    sheet.querySelectorAll('[data-sheet-app]').forEach((b) => b.addEventListener('click', () => { sfx.click(); render('app', { slug: b.dataset.sheetApp }); }));
    sheet.querySelectorAll('[data-sheet-go]').forEach((b) => b.addEventListener('click', () => { sfx.click(); render(b.dataset.sheetGo, { back: action }); }));
    sheet.querySelectorAll('[data-sheet-back]').forEach((b) => b.addEventListener('click', () => { sfx.click(); render(b.dataset.sheetBack); }));

    sheet.hidden = false;
    if (backdrop) backdrop.hidden = false;
    sheet.scrollTop = 0;
    sheet.querySelector('.ios-sheet__body')?.scrollTo?.(0, 0);
    (sheet.querySelector('[data-close]') || sheet.querySelector('button'))?.focus({ preventScroll: true });
  };

  openSheet = render;

  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) close();
  });
  document.addEventListener('cap:ios-sheet', (e) => render(e.detail.action, e.detail));
  // theme changed from inside the Themes sheet → refresh labels without closing
  document.addEventListener('cap:theme', () => {
    sheet.querySelectorAll('.ios-settings__go[data-sheet-go="appearance"]').forEach((b) => { b.textContent = `${getSkinDef().name} ›`; });
  });
}
