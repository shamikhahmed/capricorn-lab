import { sfx } from './sounds.js';

/**
 * Tiny live demos inside app windows — the window stops being a brochure.
 * Each returns markup via demoHTML() and comes alive via initAppDemo().
 */

const DEMO_SLUGS = ['vaultcap', 'pulsecap'];

export function hasDemo(slug) {
  return DEMO_SLUGS.includes(slug);
}

export function demoHTML(app) {
  if (app.slug === 'vaultcap') {
    return `
      <div class="app-demo app-demo--vault" data-demo="vaultcap" aria-label="Live demo — vault balances">
        <p class="app-demo__label">Live demo · numbers are theatre</p>
        <div class="app-demo__rows">
          <div class="app-demo__row"><span>Cash</span><strong data-count="48200" data-prefix="£">£0</strong></div>
          <div class="app-demo__row"><span>Markets</span><strong data-count="180000" data-prefix="£">£0</strong></div>
          <div class="app-demo__row"><span>Gold</span><strong data-count="56320" data-prefix="£">£0</strong></div>
        </div>
      </div>`;
  }
  if (app.slug === 'pulsecap') {
    return `
      <div class="app-demo app-demo--pulse" data-demo="pulsecap" aria-label="Live demo — recovery ring">
        <p class="app-demo__label">Live demo · recovery readiness</p>
        <div class="app-demo__ring">
          <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><circle cx="40" cy="40" r="34" class="app-demo__ring-fill"/></svg>
          <strong class="num" data-ring="87">0</strong>
        </div>
      </div>`;
  }
  return '';
}

export function initAppDemo(root, app) {
  const el = root.querySelector(`[data-demo="${app.slug}"]`);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (app.slug === 'vaultcap') {
    el.querySelectorAll('[data-count]').forEach((n, i) => {
      const target = Number(n.dataset.count);
      const prefix = n.dataset.prefix || '';
      if (reduced) { n.textContent = prefix + target.toLocaleString('en-GB'); return; }
      const t0 = performance.now() + i * 180;
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - t0) / 1100));
        const e = 1 - Math.pow(1 - p, 3);
        n.textContent = prefix + Math.round(target * e).toLocaleString('en-GB');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  if (app.slug === 'pulsecap') {
    const num = el.querySelector('[data-ring]');
    const fill = el.querySelector('.app-demo__ring-fill');
    const target = Number(num.dataset.ring);
    const CIRC = 2 * Math.PI * 34;
    if (fill) {
      fill.style.strokeDasharray = String(CIRC);
      fill.style.strokeDashoffset = String(CIRC);
    }
    if (reduced) {
      num.textContent = String(target);
      if (fill) fill.style.strokeDashoffset = String(CIRC * (1 - target / 100));
      return;
    }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 1300);
      const e = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(target * e));
      if (fill) fill.style.strokeDashoffset = String(CIRC * (1 - (target / 100) * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

}
