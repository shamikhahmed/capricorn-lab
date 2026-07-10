import { runBoot } from './boot.js';
import { runLockScreen, isLockSkipped } from './lock-screen.js';
import { initWallpaper } from './wallpaper.js';
import { openApp, openSystem } from './window-manager.js';
import { initDock } from './dock.js';
import { initIOSHome } from './mobile-ios.js';
import { initPalette } from './command-palette.js';
import { initWidgets, layoutWidgetHeights } from './widgets.js';
import { initSocial } from './social.js';
import { initSounds, sfx } from './sounds.js';
import { initControlCenter, initAppleMenu } from './control-center.js';
import { initTheme } from './theme.js';
import { welcomeToOS } from './notifications.js';
import { SYSTEM, APPS } from './products.js';

function isMobileViewport() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export function getViewMode() {
  const forced = new URLSearchParams(location.search).get('view');
  if (forced === 'mobile' || forced === 'ios') return 'mobile';
  if (forced === 'desktop' || forced === 'mac') return 'desktop';
  return isMobileViewport() ? 'mobile' : 'desktop';
}

function applyViewMode(mode) {
  document.documentElement.dataset.view = mode;
}

let desktopReady = false;
let mobileReady = false;
let currentMode = getViewMode();

function startMenubarClock() {
  const el = document.getElementById('menubarClock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  tick();
  setInterval(tick, 1000);
}

function initAmbient() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  const tint = document.createElement('div');
  tint.className = 'ambient-tint';
  tint.setAttribute('aria-hidden', 'true');
  desktop.prepend(tint);

  const apply = (id) => {
    const app = APPS.find((a) => a.slug === id);
    if (app) {
      tint.style.setProperty('--ambient', app.accent);
      desktop.classList.add('is-tinted');
    } else {
      desktop.classList.remove('is-tinted');
    }
  };

  document.addEventListener('cap:window-focus', (e) => apply(e.detail.id));
  document.addEventListener('cap:window-close', () => {
    const anyApp = [...document.querySelectorAll('[data-win-id]')]
      .some((w) => !w.dataset.winId.startsWith('sys-'));
    if (!anyApp) desktop.classList.remove('is-tinted');
  });
}

function bindMenus() {
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.click();
      const action = btn.dataset.action;
      if (action === 'apps') openSystem('apps');
      else openSystem(action);
    });
  });
}

document.addEventListener('cap:open-system', (e) => {
  openSystem(e.detail.action);
});

function handleCommand(cmd) {
  if (cmd.type === 'app') openApp(cmd.id);
  else openSystem(cmd.id);
}

function enterDesktop({ welcome = false } = {}) {
  document.getElementById('boot').hidden = true;
  document.getElementById('mobile').hidden = true;
  document.getElementById('desktop').hidden = false;
  document.getElementById('mobile')?.setAttribute('aria-hidden', 'true');
  document.getElementById('desktop')?.setAttribute('aria-hidden', 'false');
  applyViewMode('desktop');

  if (!desktopReady) {
    initSounds();
    initWallpaper(document.getElementById('wallpaper'));
    initDock({ onOpen: openApp });
    initWidgets({ onOpen: openApp });
    const ecoCount = document.querySelector('#widgetEcoTitle .num');
    if (ecoCount) ecoCount.textContent = String(APPS.length);
    initSocial();
    initPalette({ onSelect: handleCommand });
    initControlCenter();
    initAppleMenu();
    bindMenus();
    initAmbient();
    startMenubarClock();
    desktopReady = true;
    if (welcome) welcomeToOS();
    if (new URLSearchParams(location.search).get('pitch')) {
      setTimeout(() => openSystem('apps'), 700);
    }
    document.title = `${SYSTEM.name} — ${SYSTEM.tagline}`;
  }

  requestAnimationFrame(() => layoutWidgetHeights());
}

function enterMobile({ welcome = false } = {}) {
  document.getElementById('boot').hidden = true;
  document.getElementById('desktop').hidden = true;
  document.getElementById('mobile').hidden = false;
  document.getElementById('desktop')?.setAttribute('aria-hidden', 'true');
  document.getElementById('mobile')?.setAttribute('aria-hidden', 'false');
  applyViewMode('mobile');

  if (!mobileReady) {
    initSounds();
    initIOSHome();
    mobileReady = true;
    document.title = `${SYSTEM.name}`;
    if (welcome) welcomeToOS();
  }
}

function signalLive() {
  document.body.classList.add('os-live');
  document.dispatchEvent(new CustomEvent('cap:os-live'));
}

function startOS() {
  if (currentMode === 'mobile') {
    enterMobile({ welcome: true });
    return;
  }
  const boot = document.getElementById('boot');
  if (boot) boot.hidden = false;
  const fullBoot = new URLSearchParams(location.search).get('boot') === 'full';
  runBoot({
    quick: !fullBoot,
    onDone: () => enterDesktop({ welcome: true }),
    onChime: () => { initSounds(); sfx.boot(); },
  });
}

function bootstrap() {
  applyViewMode(currentMode);
  initTheme();

  if (isLockSkipped()) {
    signalLive();
    startOS();
    return;
  }

  runLockScreen({
    mode: currentMode,
    onUnlock: () => {
      initSounds();
      signalLive();
      startOS();
    },
  });
}

bootstrap();

window.addEventListener('resize', () => {
  if (new URLSearchParams(location.search).get('view')) return;
  const mode = isMobileViewport() ? 'mobile' : 'desktop';
  if (mode === currentMode) return;
  currentMode = mode;
  if (mode === 'mobile') enterMobile();
  else enterDesktop();
});
