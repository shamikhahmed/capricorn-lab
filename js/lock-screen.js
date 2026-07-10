import { SYSTEM, APPS } from './products.js';
import { initWallpaper } from './wallpaper.js';
import { sfx } from './sounds.js';

const SESSION_KEY = 'cap-os-unlocked';
const REMEMBER_KEY = 'cap-lock-remember';
const PERSIST_KEY = 'cap-os-unlocked-persist';

export function isLockSkipped() {
  const params = new URLSearchParams(location.search);
  if (params.get('nolock') === '1') return true;
  if (params.get('lock') === '1') return false;
  try {
    if (localStorage.getItem(REMEMBER_KEY) === '1' && localStorage.getItem(PERSIST_KEY) === '1') {
      return true;
    }
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function startLockClock(root) {
  const timeEl = root.querySelector('.lock-screen__time');
  const dateEl = root.querySelector('.lock-screen__date');
  if (!timeEl) return null;

  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };
  tick();
  return setInterval(tick, 1000);
}

function constellationHTML() {
  return APPS.map((app, i) => `
    <span class="lock-orbit" style="--orbit-i:${i}">
      <span class="lock-orbit__icon" style="--orbit-accent:${app.accent}">
        <img src="${app.icon}" alt="" width="32" height="32" loading="eager" decoding="async">
      </span>
    </span>
  `).join('');
}

function buildLockHTML(mode) {
  const variant = mode === 'mobile' ? 'ios' : 'desktop';
  const remembered = (() => {
    try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch { return false; }
  })();

  const iosSwipe = variant === 'ios' ? `
    <div class="lock-screen__swipe-zone" id="lockSwipeZone" aria-hidden="true">
      <div class="lock-screen__swipe-rail">
        <div class="lock-screen__swipe-handle" id="lockSwipeHandle"></div>
      </div>
      <p class="lock-screen__swipe-label">Swipe up to enter</p>
    </div>
  ` : '';

  return `
    <canvas class="lock-screen__wallpaper" id="lockWallpaper" aria-hidden="true"></canvas>
    <div class="lock-screen__scrim" aria-hidden="true"></div>
    <div class="lock-screen__panel" id="lockPanel">
      <div class="lock-screen__inner">
        <time class="lock-screen__time" id="lockTime">--:--</time>
        <p class="lock-screen__date" id="lockDate"></p>
        <div class="lock-screen__orbit" aria-hidden="true">
          <div class="lock-screen__constellation">${constellationHTML()}</div>
          <img class="lock-screen__logo" src="${SYSTEM.logo}" alt="" width="112" height="112">
        </div>
        <p class="lock-screen__eyebrow">Capricorn Systems</p>
        <h1 class="lock-screen__title">${SYSTEM.name}</h1>
        <p class="lock-screen__tagline">${SYSTEM.tagline}</p>
        <p class="lock-screen__pitch">${SYSTEM.pitch}</p>
        <p class="lock-screen__proof" aria-live="polite">
          <span class="lock-screen__proof-dot" aria-hidden="true"></span>
          <span id="lockBytesProof">0 bytes sent today</span>
        </p>
        <ul class="lock-screen__stats" aria-label="Ecosystem">
          <li>${APPS.length} apps</li>
          <li>0 servers</li>
          <li>On-device</li>
        </ul>
        <p class="lock-screen__founder">Built by ${SYSTEM.founder}</p>
        <label class="lock-screen__remember">
          <input type="checkbox" id="lockRemember" ${remembered ? 'checked' : ''}>
          <span>Remember this device</span>
        </label>
        <button type="button" class="lock-screen__unlock" id="lockUnlock">
          ${variant === 'ios' ? 'Enter Capricorn OS' : 'Unlock device'}
        </button>
        <p class="lock-screen__hint">${variant === 'ios' ? 'Swipe up or tap Enter' : 'Click, Enter, or Space'}</p>
      </div>
      ${iosSwipe}
    </div>
  `;
}

function initSwipeUnlock(el, panel, finish) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handle = el.querySelector('#lockSwipeHandle');
  const zone = el.querySelector('#lockSwipeZone');
  let startY = 0;
  let dragY = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let tracking = false;

  const THRESHOLD = 80;
  const VEL_MIN = 0.45;

  const rubber = (y) => (y < 0 ? y * 0.28 : y);

  const apply = (y, animate = false) => {
    const lift = rubber(y);
    panel.style.transition = animate ? 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    panel.style.transform = `translateY(${-Math.max(0, lift)}px)`;
    if (handle) {
      handle.style.transition = animate ? 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      handle.style.transform = `translateY(${-Math.min(lift * 0.22, 18)}px)`;
    }
    el.style.setProperty('--lock-lift', String(Math.min(lift / THRESHOLD, 1)));
  };

  const reset = () => apply(0, true);

  const onStart = (y) => {
    tracking = true;
    startY = y;
    lastY = y;
    lastT = performance.now();
    velocity = 0;
    dragY = 0;
  };

  const onMove = (y) => {
    if (!tracking) return;
    const now = performance.now();
    velocity = (lastY - y) / Math.max(8, now - lastT);
    lastY = y;
    lastT = now;
    dragY = startY - y;
    apply(dragY);
  };

  const onEnd = () => {
    if (!tracking) return;
    tracking = false;
    if (dragY > THRESHOLD || velocity > VEL_MIN) {
      apply(Math.max(dragY, 140), true);
      finish();
    } else {
      reset();
    }
    dragY = 0;
  };

  const targets = [el, zone].filter(Boolean);
  targets.forEach((target) => {
    target.addEventListener('touchstart', (e) => {
      if (reduced) return;
      onStart(e.touches[0]?.clientY ?? 0);
    }, { passive: true });
    target.addEventListener('touchmove', (e) => {
      if (!tracking || reduced) return;
      onMove(e.touches[0]?.clientY ?? lastY);
    }, { passive: true });
    target.addEventListener('touchend', onEnd, { passive: true });
    target.addEventListener('touchcancel', onEnd, { passive: true });
  });
}

export function runLockScreen({ mode = 'desktop', onUnlock } = {}) {
  const variant = mode === 'mobile' ? 'ios' : 'desktop';
  const el = document.getElementById('lockScreen');
  if (!el) {
    onUnlock?.();
    return;
  }

  el.className = `lock-screen lock-screen--${variant}`;
  el.hidden = false;
  el.innerHTML = buildLockHTML(mode);

  const unlockBtn = document.getElementById('lockUnlock');
  const rememberCb = document.getElementById('lockRemember');
  const panel = document.getElementById('lockPanel');
  const lockCanvas = document.getElementById('lockWallpaper');
  const stopWallpaper = lockCanvas
    ? initWallpaper(lockCanvas, { surface: variant === 'ios' ? 'ios' : 'desktop', art: true })
    : null;

  const clockTimer = startLockClock(el);
  let done = false;
  let keyHandler = null;

  const persistUnlock = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
      if (rememberCb?.checked) {
        localStorage.setItem(REMEMBER_KEY, '1');
        localStorage.setItem(PERSIST_KEY, '1');
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(PERSIST_KEY);
      }
    } catch { /* private mode */ }
  };

  const finish = () => {
    if (done) return;
    done = true;
    if (clockTimer) clearInterval(clockTimer);
    persistUnlock();
    sfx.unlock();
    el.classList.add('is-unlocking');
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    setTimeout(() => {
      stopWallpaper?.();
      el.classList.add('is-done');
      el.hidden = true;
      onUnlock?.();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 520);
  };

  if (variant === 'ios') initSwipeUnlock(el, panel, finish);

  unlockBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    finish();
  });

  rememberCb?.addEventListener('click', (e) => e.stopPropagation());

  el.addEventListener('click', (e) => {
    if (done) return;
    if (e.target === unlockBtn || unlockBtn?.contains(e.target)) return;
    if (e.target.closest('.lock-screen__remember')) return;
    if (e.target.closest('.lock-screen__unlock')) return;
    if (variant === 'desktop' && e.target.closest('.lock-screen__inner')) finish();
  });

  keyHandler = (e) => {
    if (done || el.hidden) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finish();
    }
  };
  document.addEventListener('keydown', keyHandler);

  unlockBtn?.focus();
}
