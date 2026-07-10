import { APPS, SYSTEM, SOCIAL, renderAppHomeIcon, renderHomeIcon, renderSystemHomeIcon, bindSocialClicks } from './social.js';
import { wipBadgeHTML } from './products.js';
import { renderMobileTasks, bindTaskClicks } from './tasks.js';
import { IOS_WIDGET_SNAPSHOTS } from './widgets.js';
import { launchHref } from './ui-helpers.js';
import { sfx } from './sounds.js';
import { toggleTheme } from './theme.js';

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
    const href = launchHref(a);
    return `
    <a class="ios-widget ios-widget--app${a.wip ? ' ios-widget--wip' : ''}" style="--w-accent:${a.accent};--live-i:${i + 1}" href="${href}" target="_blank" rel="noopener" aria-label="${a.name}${a.wip ? ' — in development' : ''}">
      <header><img src="${a.icon}" alt="" width="20" height="20"><span>${a.name}</span>${a.wip ? wipBadgeHTML() : ''}</header>
      <strong>${snap.big}</strong>
      <small>${snap.small}</small>
      ${snap.extra || ''}
    </a>`;
  };

  return `
    <div class="ios-widgets" aria-label="Widgets">
      <div class="ios-widget ios-widget--clock ios-widget--span2" style="--live-i:0">
        <time id="iosWidgetTime">--:--</time>
        <p id="iosWidgetDate"></p>
        <span>Local · Capricorn OS</span>
      </div>
      ${APPS.map((a, i) => appTile(a, i)).join('')}
    </div>`;
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
      pageEls[i].scrollIntoView({ behavior: 'smooth', inline: 'center' });
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
  const dock = document.getElementById('iosDock');

  if (todayHost) {
    todayHost.innerHTML = `<p class="ios-page-label">Today</p>${buildIOSWidgets()}`;
  }

  if (tasksHost && appGrid) {
    tasksHost.insertAdjacentHTML('afterbegin', `${renderMobileTasks()}<p class="ios-page-label ios-page-label--apps">Apps</p>`);
    const systemIcons = [
      renderSystemHomeIcon({ id: 'about', label: 'About', img: SYSTEM.logo }),
      renderSystemHomeIcon({ id: 'apps', label: 'Apps', icon: '▦' }),
      renderSystemHomeIcon({ id: 'sovereignty', label: 'Settings', icon: '⚙' }),
    ];
    appGrid.innerHTML = systemIcons.join('') + APPS.map(renderAppHomeIcon).join('');

    bindTaskClicks(tasksHost, {
      onOpen: (slug) => {
        const app = APPS.find((a) => a.slug === slug);
        if (app) window.open(launchHref(app), '_blank', 'noopener');
      },
      onSocial: (social) => {
        const pages = document.getElementById('iosPages');
        pages?.scrollTo({ left: pages.clientWidth * 2, behavior: 'smooth' });
        setTimeout(() => {
          document.querySelector(`#iosSocialGrid [data-social="${social}"]`)?.click();
        }, 400);
      },
    });

    appGrid.querySelectorAll('[data-ios-sys]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.click();
        document.dispatchEvent(new CustomEvent('cap:ios-sheet', { detail: { action: btn.dataset.iosSys } }));
      });
    });
  }

  if (socialGrid) {
    socialGrid.innerHTML = SOCIAL.map((item) => renderHomeIcon(item, { variant: 'grid' })).join('');
    bindSocialClicks(socialGrid);
  }

  if (dock) {
    dock.innerHTML = APPS.map((app, i) => `
      <a href="${launchHref(app)}" class="ios-dock__icon${app.wip ? ' ios-dock__icon--wip' : ''}" style="--dock-i:${i}" target="_blank" rel="noopener" aria-label="${app.name}${app.wip ? ' — WIP' : ''}">
        <img src="${app.icon}" alt="" width="54" height="54">
        ${app.wip ? '<span class="ios-dock__wip">WIP</span>' : ''}
      </a>
    `).join('');
  }

  document.getElementById('iosThemeToggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTheme();
  });

  startIOSClock();
  initPages();
  initIOSSheets();
}

function initIOSSheets() {
  const sheet = document.getElementById('iosSheet');
  const backdrop = document.getElementById('iosSheetBackdrop');
  if (!sheet) return;

  const close = () => {
    sheet.hidden = true;
    backdrop.hidden = true;
    sheet.innerHTML = '';
  };

  backdrop?.addEventListener('click', close);

  document.addEventListener('cap:ios-sheet', (e) => {
    const action = e.detail.action;
    sfx.click();

    if (action === 'about') {
      sheet.innerHTML = `
        <div class="ios-sheet__head"><h2>${SYSTEM.name}</h2><button type="button" class="ios-sheet__close" data-close>Done</button></div>
        <div class="ios-sheet__body">
          <p>${SYSTEM.tagline}</p>
          <p>Built by <strong>${SYSTEM.founder}</strong>. ${APPS.length} Cap apps. Zero cloud.</p>
          <a href="https://shamikhahmed.github.io/" target="_blank" rel="noopener">shamikhahmed.github.io</a>
        </div>`;
    } else if (action === 'apps') {
      sheet.innerHTML = `
        <div class="ios-sheet__head"><h2>Applications</h2><button type="button" class="ios-sheet__close" data-close>Done</button></div>
        <div class="ios-sheet__body ios-sheet__list">
          ${APPS.map((a) => `
            <a href="${launchHref(a)}" target="_blank" rel="noopener" class="ios-sheet__row${a.wip ? ' ios-sheet__row--wip' : ''}">
              <img src="${a.icon}" alt="" width="40" height="40">
              <div><strong>${a.name}${a.wip ? ' · WIP' : ''}</strong><span>${a.tagline}</span></div>
            </a>`).join('')}
        </div>`;
    } else if (action === 'sovereignty') {
      const isDark = document.documentElement.dataset.theme === 'dark';
      sheet.innerHTML = `
        <div class="ios-sheet__head"><h2>Settings</h2><button type="button" class="ios-sheet__close" data-close>Done</button></div>
        <div class="ios-sheet__body">
          <ul class="ios-settings">
            <li><span>Appearance</span><button type="button" class="ios-settings__theme" data-ios-theme>${isDark ? 'Dark' : 'Light'}</button></li>
            <li><span>Cloud sync</span><em>Off</em></li>
            <li><span>Analytics</span><em>Off</em></li>
            <li><span>Offline</span><em>On</em></li>
            <li><span>Encryption</span><em>On</em></li>
          </ul>
          <p class="ios-settings__note">Your data belongs to you.</p>
        </div>`;
      sheet.querySelector('[data-ios-theme]')?.addEventListener('click', () => toggleTheme());
      document.addEventListener('cap:theme', () => close(), { once: true });
    }

    sheet.hidden = false;
    backdrop.hidden = false;
    sheet.querySelector('[data-close]')?.addEventListener('click', close);
  });
}
