import { runBoot } from './boot.js';
import { runLockScreen, isLockSkipped, lockDevice } from './lock-screen.js';
import { initWallpaper } from './wallpaper.js';
import { openApp, openSystem } from './window-manager.js';
import { initDock } from './dock.js';
import { initIOSHome } from './mobile-ios.js';
import { initPalette } from './command-palette.js';
import { initWidgets, layoutWidgetHeights } from './widgets.js';
import { initSocial } from './social.js';
import { initSounds, sfx } from './sounds.js';
import { initControlCenter, initAppleMenu } from './control-center.js';
import { initTheme, applySkin, surpriseSkin } from './theme.js';
import { welcomeToOS } from './notifications.js';
import { initDesktopExtras } from './desktop-extras.js';
import { SYSTEM, APPS } from './products.js';
import { refreshCatalog } from './live-catalog.js';

/**
 * Three surfaces:
 *  - mobile  (phones, < 600px)            → iOS home
 *  - tablet  (iPad / touch 600–1366, or any window 600–900) → iPadOS home
 *  - desktop (mouse/trackpad ≥ 900px)     → Capricorn OS desktop
 * ?view=mobile|tablet|desktop forces one.
 */
function autoViewMode() {
  const w = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches
    || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  if (w < 600) return 'mobile';
  if (coarse && w <= 1366) return 'tablet';
  if (w < 900) return 'tablet';
  return 'desktop';
}

export function getViewMode() {
  const forced = new URLSearchParams(location.search).get('view');
  if (forced === 'mobile' || forced === 'ios' || forced === 'phone') return 'mobile';
  if (forced === 'tablet' || forced === 'ipad') return 'tablet';
  if (forced === 'desktop' || forced === 'mac') return 'desktop';
  return autoViewMode();
}

const isHomeMode = (m) => m === 'mobile' || m === 'tablet';

function applyViewMode(mode) {
  document.documentElement.dataset.view = mode;
  document.dispatchEvent(new CustomEvent('cap:view', { detail: { mode } }));
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
  else if (cmd.type === 'skin') {
    if (cmd.id === 'surprise') surpriseSkin();
    else applySkin(cmd.id);
  } else if (cmd.type === 'lock') document.dispatchEvent(new CustomEvent('cap:lock-device'));
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
    initDesktopExtras();
    desktopReady = true;
    refreshCatalog();
    if (welcome) welcomeToOS();
    if (new URLSearchParams(location.search).get('pitch')) {
      setTimeout(() => openSystem('apps'), 700);
    }
    document.title = `${SYSTEM.name} — ${SYSTEM.tagline}`;
  }

  scheduleDeepLink();
  requestAnimationFrame(() => layoutWidgetHeights());
}

function enterMobile({ welcome = false } = {}) {
  document.getElementById('boot').hidden = true;
  document.getElementById('desktop').hidden = true;
  document.getElementById('mobile').hidden = false;
  document.getElementById('desktop')?.setAttribute('aria-hidden', 'true');
  document.getElementById('mobile')?.setAttribute('aria-hidden', 'false');
  applyViewMode(currentMode === 'tablet' ? 'tablet' : 'mobile');

  if (!mobileReady) {
    initSounds();
    initIOSHome();
    mobileReady = true;
    document.title = `${SYSTEM.name} — ${SYSTEM.tagline}`;
    refreshCatalog();
    if (welcome) welcomeToOS();
  }
  scheduleDeepLink();
}

/** `?app=<slug>` opens that Cap window (desktop) or sheet (phone/iPad). §10.4 / N-1. */
let deepLinkConsumed = false;
function scheduleDeepLink() {
  if (deepLinkConsumed) return;
  const slug = new URLSearchParams(location.search).get('app');
  if (!slug) return;
  const app = APPS.find((a) => a.slug === slug);
  if (!app) return;
  deepLinkConsumed = true;
  const open = () => {
    if (isHomeMode(currentMode)) {
      document.dispatchEvent(new CustomEvent('cap:ios-sheet', { detail: { action: 'app', slug } }));
    } else {
      openApp(slug);
    }
  };
  // After first paint / sheet init
  setTimeout(open, 450);
}

function onUnlockFromLock({ skipBoot = false } = {}) {
  initSounds();
  signalLive();
  if (skipBoot && (desktopReady || mobileReady)) {
    if (isHomeMode(currentMode)) enterMobile();
    else enterDesktop();
    return;
  }
  startOS();
}

function relockOS() {
  lockDevice({ mode: currentMode, onUnlock: () => onUnlockFromLock({ skipBoot: true }) });
}

function bindLockControls() {
  document.getElementById('menubarLock')?.addEventListener('click', (e) => {
    e.stopPropagation();
    relockOS();
  });
  document.getElementById('iosLockBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    relockOS();
  });
  document.addEventListener('cap:lock-device', relockOS);
}

function signalLive() {
  document.body.classList.add('os-live');
  document.dispatchEvent(new CustomEvent('cap:os-live'));
}

function startOS() {
  if (isHomeMode(currentMode)) {
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
  bindLockControls();

  if (isLockSkipped()) {
    signalLive();
    startOS();
    return;
  }

  runLockScreen({
    mode: currentMode,
    onUnlock: onUnlockFromLock,
  });
}

bootstrap();

window.addEventListener('resize', () => {
  if (new URLSearchParams(location.search).get('view')) return;
  const mode = autoViewMode();
  if (mode === currentMode) return;
  const prev = currentMode;
  currentMode = mode;
  // lock screen still up: it rebuilds for the new surface on next lock
  if (!document.body.classList.contains('os-live') && !document.getElementById('lockScreen')?.hidden) {
    applyViewMode(mode);
    return;
  }
  if (isHomeMode(mode) && isHomeMode(prev)) applyViewMode(mode);
  else if (isHomeMode(mode)) enterMobile();
  else enterDesktop();
});
