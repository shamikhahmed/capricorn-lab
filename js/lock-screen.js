import { SYSTEM, APPS } from './products.js';
import { initWallpaper } from './wallpaper.js';
import { sfx } from './sounds.js';

const SESSION_KEY = 'cap-os-unlocked';
const N = APPS.length;

export function isLockSkipped() {
  const params = new URLSearchParams(location.search);
  if (params.get('nolock') === '1') return true;
  if (params.get('lock') === '1') return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearUnlockSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('cap-lock-remember');
    localStorage.removeItem('cap-os-unlocked-persist');
  } catch { /* private mode */ }
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
  return APPS.map((app, i) => {
    const bloomA = ((i / N) * Math.PI * 2) - Math.PI / 2;
    const bloomX = Math.cos(bloomA) * 160;
    const bloomY = Math.sin(bloomA) * 120;
    const src = app.mark || app.icon;
    return `
      <button type="button" class="lock-orbit" style="--orbit-i:${i};--bloom-x:${bloomX.toFixed(1)}px;--bloom-y:${bloomY.toFixed(1)}px"
        data-app-i="${i}" aria-label="${app.name}: ${app.hook}">
        <span class="lock-orbit__face">
          <span class="lock-orbit__icon" style="--orbit-accent:${app.accent}">
            <img src="${src}" alt="" width="32" height="32" loading="eager" decoding="async">
          </span>
        </span>
      </button>
    `;
  }).join('');
}

function buildLockHTML(mode) {
  const variant = mode === 'mobile' ? 'ios' : 'desktop';

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
    <canvas class="lock-screen__sphere" id="lockSphere" aria-hidden="true"></canvas>
    <div class="lock-screen__scrim" aria-hidden="true"></div>
    <a href="https://shamikhahmed.github.io/" class="lock-chrome" id="lockBack" aria-label="Exit Capricorn OS to portfolio site">
      <span class="lock-chrome__chev" aria-hidden="true">‹</span>
      <img class="lock-chrome__mark" src="${SYSTEM.logo}" alt="" width="14" height="14">
      <span class="lock-chrome__label">${variant === 'ios' ? 'Portfolio' : 'Exit to Web'}</span>
    </a>
    <p class="lock-chrome__status" aria-hidden="true">${variant === 'ios' ? 'Locked' : 'Device locked'}</p>
    <div class="lock-screen__panel" id="lockPanel">
      <div class="lock-screen__inner">
        <header class="lock-screen__top">
          <div class="lock-screen__hero-time">
            <time class="lock-screen__time" id="lockTime">--:--</time>
            <p class="lock-screen__date" id="lockDate"></p>
          </div>
        </header>

        <div class="lock-screen__stage" id="lockStage" aria-hidden="true">
          <div class="lock-screen__orbit" id="lockOrbit">
            <div class="lock-screen__carousel" id="lockCarousel">
              ${constellationHTML()}
            </div>
            <div class="lock-screen__logo-wrap">
              <img class="lock-screen__logo" src="${SYSTEM.logo}" alt="" width="112" height="112">
            </div>
          </div>
        </div>

        <footer class="lock-screen__copy">
          <div class="lock-screen__whisper" id="lockWhisper" aria-live="polite">
            <p class="lock-screen__whisper-name" id="lockWhisperName"></p>
            <p class="lock-screen__whisper-hook" id="lockWhisperHook"></p>
          </div>
          <p class="lock-screen__eyebrow">Capricorn Systems</p>
          <h1 class="lock-screen__title">${SYSTEM.name}</h1>
          <p class="lock-screen__tagline">${SYSTEM.tagline}</p>
          <p class="lock-screen__proof" aria-live="polite">
            <span class="lock-screen__proof-dot" aria-hidden="true"></span>
            <span id="lockBytesProof">0 bytes sent today</span>
          </p>
          <button type="button" class="lock-screen__unlock" id="lockUnlock">
            ${variant === 'ios' ? 'Enter Capricorn OS' : 'Unlock device'}
          </button>
          <p class="lock-screen__hint">${variant === 'ios' ? 'Swipe up or tap Enter' : 'Click Unlock, Enter, or Space'}</p>
          ${iosSwipe}
        </footer>
      </div>
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
      if (e.target.closest('.lock-orbit')) return;
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

function initOrbitTilt(el, carousel) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !carousel) return () => {};

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;

  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    carousel.style.setProperty('--tilt-x', `${cy.toFixed(2)}deg`);
    carousel.style.setProperty('--tilt-y', `${cx.toFixed(2)}deg`);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    tx = nx * 14;
    ty = -ny * 10;
  };

  const onLeave = () => { tx = 0; ty = 0; };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);

  const onOrient = (e) => {
    const b = e.beta ?? 0;
    const g = e.gamma ?? 0;
    tx = Math.max(-14, Math.min(14, g * 0.35));
    ty = Math.max(-10, Math.min(10, (b - 45) * -0.2));
  };
  window.addEventListener('deviceorientation', onOrient);

  return () => {
    cancelAnimationFrame(raf);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('deviceorientation', onOrient);
  };
}

function initWhisper(el) {
  const nameEl = el.querySelector('#lockWhisperName');
  const hookEl = el.querySelector('#lockWhisperHook');
  const whisper = el.querySelector('#lockWhisper');
  if (!nameEl || !hookEl || !whisper) return () => {};

  let selected = -1;

  const show = (i) => {
    const app = APPS[i];
    if (!app) return;
    selected = i;
    nameEl.textContent = app.name;
    hookEl.textContent = app.hook;
    whisper.classList.add('is-on');
    whisper.style.setProperty('--whisper-accent', app.accent);
    el.querySelectorAll('.lock-orbit').forEach((btn) => {
      btn.classList.toggle('is-selected', Number(btn.dataset.appI) === i);
    });
  };

  const clear = () => {
    selected = -1;
    whisper.classList.remove('is-on');
    el.querySelectorAll('.lock-orbit.is-selected').forEach((b) => b.classList.remove('is-selected'));
  };

  el.querySelectorAll('.lock-orbit').forEach((btn) => {
    const i = Number(btn.dataset.appI);
    btn.addEventListener('pointerenter', () => show(i));
    btn.addEventListener('focus', () => show(i));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      sfx.click();
      if (selected === i) clear();
      else show(i);
    });
  });

  return clear;
}

function initSovereigntyPulse(proofEl) {
  if (!proofEl) return () => {};
  const pill = proofEl.closest('.lock-screen__proof') || proofEl;
  const lines = [
    '0 bytes sent today',
    'Telemetry blocked · 0 bytes',
    '0 bytes leave this device',
  ];
  let i = 0;
  const id = setInterval(() => {
    i = (i + 1) % lines.length;
    pill.classList.add('is-flash');
    proofEl.textContent = lines[i];
    setTimeout(() => pill.classList.remove('is-flash'), 320);
  }, 7000);
  return () => clearInterval(id);
}

export function runLockScreen({ mode = 'desktop', onUnlock } = {}) {
  const variant = mode === 'mobile' ? 'ios' : 'desktop';
  const el = document.getElementById('lockScreen');
  if (!el) {
    onUnlock?.();
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  el.className = `lock-screen lock-screen--${variant}`;
  el.hidden = false;
  el.classList.remove('is-done', 'is-unlocking', 'is-bloom');
  el.innerHTML = buildLockHTML(mode);

  const unlockBtn = document.getElementById('lockUnlock');
  const panel = document.getElementById('lockPanel');
  const carousel = document.getElementById('lockCarousel');
  const lockCanvas = document.getElementById('lockWallpaper');
  const sphereCanvas = document.getElementById('lockSphere');
  const whisper = el.querySelector('#lockWhisper');
  const whisperName = el.querySelector('#lockWhisperName');
  const whisperHook = el.querySelector('#lockWhisperHook');

  let done = false;
  let keyHandler = null;
  let stopTilt = () => {};
  let stopWhisper = () => {};

  const showWhisper = (app) => {
    if (!whisper || !whisperName || !whisperHook) return;
    if (!app) {
      whisper.classList.remove('is-on');
      return;
    }
    whisperName.textContent = app.name;
    whisperHook.textContent = app.hook;
    whisper.classList.add('is-on');
    whisper.style.setProperty('--whisper-accent', app.accent);
  };

  const stopWallpaper = lockCanvas
    ? initWallpaper(lockCanvas, { surface: variant === 'ios' ? 'ios' : 'desktop', art: false })
    : null;

  let stopSphere = () => {};
  const useCSSFallback = () => {
    stopTilt = initOrbitTilt(el, carousel);
    stopWhisper = initWhisper(el);
  };
  import('./lock-sphere.js')
    .then(({ initLockSphere }) => {
      if (done || el.hidden) return;
      const stop = initLockSphere(sphereCanvas, {
        reduced,
        onSelectApp: (app, _i, fromTap) => {
          showWhisper(app);
          if (app && fromTap) sfx.click();
        },
      });
      // null = WebGL disabled (?three=0) or unavailable — CSS carousel
      // must still get tilt + whisper interactivity.
      if (stop) stopSphere = stop;
      else useCSSFallback();
    })
    .catch(useCSSFallback);

  const stopPulse = initSovereigntyPulse(document.getElementById('lockBytesProof'));
  const clockTimer = startLockClock(el);

  const cleanup = () => {
    if (clockTimer) clearInterval(clockTimer);
    stopTilt();
    stopWhisper();
    stopPulse();
    stopSphere();
    stopWallpaper?.();
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
  };

  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* private mode */ }
    sfx.unlock();
    el.classList.add('is-unlocking', 'is-bloom');
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    const wait = reduced ? 140 : 920;
    setTimeout(() => {
      cleanup();
      el.classList.add('is-done');
      el.hidden = true;
      onUnlock?.();
    }, wait);
  };

  if (variant === 'ios') initSwipeUnlock(el, panel, finish);

  unlockBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    finish();
  });

  document.getElementById('lockBack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
  });

  el.addEventListener('click', (e) => {
    if (done) return;
    if (e.target.closest('.lock-chrome')) return;
    if (e.target.closest('.lock-screen__unlock')) return;
    if (e.target.closest('.lock-orbit')) return;
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

export function lockDevice({ mode = 'desktop', onUnlock } = {}) {
  clearUnlockSession();
  document.body.classList.remove('os-live');
  document.body.classList.remove('cc-open');

  document.getElementById('boot')?.setAttribute('hidden', '');
  document.getElementById('desktop')?.setAttribute('hidden', '');
  document.getElementById('mobile')?.setAttribute('hidden', '');
  document.getElementById('palette')?.setAttribute('hidden', '');
  document.getElementById('controlCenter')?.setAttribute('hidden', '');
  document.getElementById('appleMenu')?.setAttribute('hidden', '');
  document.getElementById('iosSheet')?.setAttribute('hidden', '');
  document.getElementById('iosSheetBackdrop')?.setAttribute('hidden', '');

  document.getElementById('desktop')?.setAttribute('aria-hidden', 'true');
  document.getElementById('mobile')?.setAttribute('aria-hidden', 'true');

  document.getElementById('ccToggle')?.setAttribute('aria-expanded', 'false');
  document.getElementById('windows')?.replaceChildren();

  sfx.click();
  runLockScreen({ mode, onUnlock });
}
