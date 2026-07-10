import { APPS } from './products.js';

function scanLines(perLine = 5) {
  const lines = [];
  for (let i = 0; i < APPS.length; i += perLine) {
    lines.push(APPS.slice(i, i + perLine).map((a) => a.name).join(' '));
  }
  return lines;
}

const FULL_BOOT = (() => {
  const scans = scanLines();
  const head = [
    { text: 'Capricorn BIOS v∞.1 — sovereign build', delay: 0 },
    { text: 'Checking local storage... OK (0 bytes sent)', delay: 280 },
    { text: 'Loading constellation drivers... OK', delay: 560 },
    { text: 'Mounting /device/sovereignty... OK', delay: 840 },
  ];
  const scanEntries = scans.map((names, i) => ({
    text: `Scanning apps: ${names}`,
    delay: 1120 + i * 240,
  }));
  const afterScan = 1120 + scans.length * 240;
  const tail = [
    { text: 'Network stack: <span class="gold">DISABLED BY DESIGN</span>', delay: afterScan },
    { text: 'Analytics daemon: <span class="dim">not found (good)</span>', delay: afterScan + 280 },
    { text: `Booting Capricorn OS... ${APPS.length} apps`, delay: afterScan + 560 },
  ];
  return { lines: [...head, ...scanEntries, ...tail], autoMs: 3200, logoMs: 900 };
})();

const QUICK_BOOT = {
  lines: [
    { text: 'Unlock verified — mounting desktop...', delay: 0 },
    { text: `${APPS.length} apps verified local · 0 bytes sent`, delay: 140 },
    { text: 'Network stack: <span class="gold">DISABLED BY DESIGN</span>', delay: 280 },
    { text: 'Analytics daemon: <span class="dim">not found (good)</span>', delay: 400 },
    { text: `Capricorn OS ready — ${APPS.length} worlds online`, delay: 520 },
  ],
  autoMs: 880,
  logoMs: 420,
};

export function runBoot({ onDone, onChime, quick = false } = {}) {
  const boot = document.getElementById('boot');
  const log = document.getElementById('bootLog');
  const logo = boot.querySelector('.boot-logo');
  const skip = document.getElementById('bootSkip');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cfg = quick ? QUICK_BOOT : FULL_BOOT;

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    logo.hidden = false;
    onChime?.();
    boot.querySelector('.boot-terminal').style.opacity = '0';
    const logoDelay = reduced ? 120 : cfg.logoMs;
    setTimeout(() => {
      boot.classList.add('is-done');
      onDone();
      setTimeout(() => { boot.hidden = true; }, reduced ? 200 : 450);
    }, logoDelay);
  }

  skip.addEventListener('click', finish);
  boot.addEventListener('click', (e) => {
    if (e.target === skip) return;
    finish();
  });
  document.addEventListener('keydown', (e) => {
    if (!finished && boot && !boot.hidden) finish();
  }, { once: false });

  if (reduced) {
    log.innerHTML = 'Capricorn OS ready.';
    setTimeout(finish, 280);
    return;
  }

  cfg.lines.forEach(({ text, delay }) => {
    setTimeout(() => {
      if (finished) return;
      log.innerHTML += (log.innerHTML ? '\n' : '') + text;
      log.scrollTop = log.scrollHeight;
    }, delay);
  });

  setTimeout(finish, cfg.autoMs);
}
