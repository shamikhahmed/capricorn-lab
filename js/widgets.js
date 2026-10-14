import { APPS } from './products.js';
import { shortBadgeHTML } from './ui-helpers.js';
import { sfx } from './sounds.js';
import { notify } from './notifications.js';
import { renderDesktopTasks, bindTaskClicks } from './tasks.js';
import { watchNetwork, proofLine } from './privacy-monitor.js';

/** Tap widget body → witty nudge to install the real app */
const WIDGET_TEASE = {
  clock: {
    title: 'Time is real. Widget is theatre.',
    body: 'Capricorn OS runs on your device — like the apps behind these widgets. Pick one and install it.',
    icon: 'assets/logo.svg',
  },
  tasks: {
    title: 'Nice list. Wrong universe.',
    body: 'These tasks fire inside the Cap apps, not a marketing page. Download one — then check it off for real.',
    icon: 'assets/logo.svg',
  },
  vaultcap: {
    title: 'Not your vault.',
    body: 'That net worth is demo glitter. Install VaultCap on your phone — then encrypt your actual life.',
  },
  pulsecap: {
    title: 'Nice widget. Wrong biceps.',
    body: 'Smart Coach can\'t coach fake reps. Download PulseCap and log a real session.',
  },
  prismcap: {
    title: 'Demo arcade closed.',
    body: 'Cipher Duel doesn\'t run in a browser tile. Get PrismCap — 38 games, zero Wi‑Fi.',
  },
  steadycap: {
    title: 'Day 47 isn\'t yours yet.',
    body: 'Recovery isn\'t a screenshot. Install SteadyCap — habits, meds, and SOS on your device.',
  },
  ledgercap: {
    title: 'Paper terminal vibes.',
    body: 'ENGRO won\'t move in a widget. Download LedgerCap and track PSX wealth where it\'s real.',
  },
  deeponycap: {
    title: 'Those pieces aren\'t yours.',
    body: 'A real collection needs DeePonyCap — series you define, photos on device.',
  },
  scentcap: {
    title: 'Oud Wood not detected.',
    body: 'We can\'t smell through glass. Install ScentCap and log what you actually wore.',
  },
  auracap: {
    title: 'Aura Score: unreleased.',
    body: 'Digital DNA needs your real app list. Download AuraCap — nothing gets uploaded.',
  },
  travelcap: {
    title: 'Barcelona isn\'t packed yet.',
    body: 'That readiness score is theatre. Install TravelCap — real trips, packing, passport stats on your phone.',
  },
  soulcap: {
    title: 'A tile can\'t check in for you.',
    body: 'SoulCap keeps check-ins and your journal on your phone. Quiet tools — not therapy.',
  },
  masterycap: {
    title: 'Lesson not loaded.',
    body: 'Bilingual learning needs the real app. Install MasteryCap — sessions stay on your device.',
  },
  ideacap: {
    title: 'Sticky notes are theatre here.',
    body: 'Capture for real in IdeaCap — voice or typed, private on device.',
  },
  carcap: {
    title: 'Garage is empty on this tile.',
    body: 'Service logs and fuel need CarCap — install and add your car.',
  },
  cookcap: {
    title: 'Cookbook closed.',
    body: 'Family recipes live in CookCap. Open it and start cooking.',
  },
  deefoodie: {
    title: 'Private beta.',
    body: 'DeeFoodie is a Karachi food journal for invited testers. Ask for access if you want in.',
  },
};

function widgetRoot(slug, classes, accent, size, inner) {
  return `<div class="mw ${classes} mw--${size}" data-widget-tease="${slug}" style="--w-accent:${accent}" role="button" tabindex="0">${inner}</div>`;
}

function wHead(a) {
  return `<header class="mw__head"><img src="${a.icon}" alt="" width="20" height="20"><span>${a.name}</span>${shortBadgeHTML(a)}</header>`;
}

function wHero(main, sub = '') {
  return `<p class="mw__hero">${main}${sub ? `<small>${sub}</small>` : ''}</p>`;
}

function wFoot(a, label, extra = '') {
  return `<footer class="mw__foot"><button type="button" class="mw__cta${extra}" data-open-app="${a.slug}">${label}</button></footer>`;
}

function wMeta(cols) {
  return `<div class="mw__meta">${cols.map((c) => `<div><span>${c.k}</span><strong class="${c.tone || ''}">${c.v}</strong></div>`).join('')}</div>`;
}

function wBar(label, value, note = '') {
  return `<div class="mw__bar"><span class="mw__bar-k">${label}</span><span class="mw__bar-track"><span class="mw__bar-fill" style="width:${value}%"></span></span><strong>${note || `${value}%`}</strong></div>`;
}

function wLine(html, tone = '') {
  return `<p class="mw__line${tone ? ` mw__line--${tone}` : ''}">${html}</p>`;
}

const WIDGET_RENDERERS = {
  vaultcap: (a) => widgetRoot(a.slug, 'mw--vault', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">£284,520</span>', 'net worth')}
      ${wMeta([{ k: 'Cash', v: '£48k' }, { k: 'Markets', v: '£180k' }, { k: 'Gold', v: '£56k' }])}
      ${wLine('<strong>Zakat</strong> review due this week', 'warn')}
      ${wFoot(a, 'Open vault →')}`),

  steadycap: (a) => widgetRoot(a.slug, 'mw--steady', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('Day <span class="num">47</span>', 'steady · 0 relapses')}
      ${wMeta([{ k: 'Habits', v: '5/6' }, { k: 'Meds', v: 'On time', tone: 'ok' }, { k: 'Mood', v: 'Calm' }])}
      ${wLine('Trigger forecast <strong>low</strong> today', 'ok')}
      ${wFoot(a, 'SOS ready', ' mw__cta--sos')}`),

  ledgercap: (a) => widgetRoot(a.slug, 'mw--ledger', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">Rs 4.2M</span> <em class="up">▲ 1.8%</em>', 'net worth')}
      ${wMeta([{ k: 'ENGRO', v: '+2.1%', tone: 'up' }, { k: 'HBL', v: '−0.4%', tone: 'dn' }, { k: 'OGDC', v: '+1.2%', tone: 'up' }])}
      ${wLine('IPO opens tomorrow · <strong>Meezan</strong> profit paid')}
      ${wFoot(a, 'Open terminal')}`),

  deeponycap: (a) => widgetRoot(a.slug, 'mw--pony', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">127</span>', 'in your collection')}
      <div class="mw__bars">${wBar('Shelf A', 82, '41/50')}</div>
      ${wLine('<strong>3 favorites</strong> on wishlist · 2 pre-orders live')}
      ${wFoot(a, 'Open stable')}`),

  travelcap: (a) => widgetRoot(a.slug, 'mw--travel', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">12</span> days', 'to Barcelona')}
      <div class="mw__bars">${wBar('Ready', 94)}${wBar('Packed', 78)}</div>
      ${wLine('Flight <strong>BCN 14:20</strong> · hotel confirmed', 'info')}
      ${wFoot(a, 'Open trip →')}`),

  auracap: (a) => widgetRoot(a.slug, 'mw--aura', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">84</span>', 'Aura Score')}
      <div class="mw__bars">${wBar('Modules', 75, '12/16')}</div>
      ${wLine('Digital DNA ready · <strong>42</strong> wallpapers')}
      ${wFoot(a, 'Run DNA scan')}`),

  pulsecap: (a) => widgetRoot(a.slug, 'mw--pulse', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<span class="num">87</span>', 'recovery ready')}
      ${wMeta([{ k: 'Today', v: 'Push' }, { k: 'Last PR', v: '+2.5 kg', tone: 'up' }])}
      ${wLine('Smart Coach · <strong>deload</strong> not needed', 'ok')}
      ${wFoot(a, 'Start session')}`),

  prismcap: (a) => widgetRoot(a.slug, 'mw--prism', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<span class="num">38</span>', 'games offline')}
      ${wLine('<strong>Cipher Duel</strong> · Level 4')}
      ${wLine('Daily challenge · streak <strong>6</strong>', 'info')}
      ${wFoot(a, 'Play now')}`),

  scentcap: (a) => widgetRoot(a.slug, 'mw--scent', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<strong>Oud Wood</strong>', 'worn today')}
      <div class="mw__bars">${wBar('Bleu de Chanel', 22)}</div>
      ${wMeta([{ k: 'Wears', v: '3/wk' }, { k: 'Layer', v: 'Oud+Amber' }])}
      ${wFoot(a, 'Log wear')}`),

  soulcap: (a) => widgetRoot(a.slug, 'mw--soul', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<strong>Steady</strong>', 'mood · checked in today')}
      ${wMeta([{ k: 'Journal', v: '4 days' }, { k: 'Breathe', v: '3 min' }])}
      ${wLine('Evening check-in · <strong>on device</strong>', 'info')}
      ${wFoot(a, 'Open Soul')}`),

  masterycap: (a) => widgetRoot(a.slug, 'mw--mastery', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<span class="num">15</span> min', 'today\'s session')}
      ${wMeta([{ k: 'Track', v: 'Foundations' }, { k: 'Lang', v: 'EN · UR' }])}
      ${wLine('Continue where you left off', 'info')}
      ${wFoot(a, 'Start session')}`),

  ideacap: (a) => widgetRoot(a.slug, 'mw--idea', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<span class="num">12</span>', 'ideas this week')}
      ${wMeta([{ k: 'Voice', v: 'On-device' }, { k: 'Board', v: 'Clear' }])}
      ${wLine('Capture · find · keep private', 'ok')}
      ${wFoot(a, 'New idea')}`),

  carcap: (a) => widgetRoot(a.slug, 'mw--car', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<strong>Service due</strong>', 'in 320 km')}
      ${wMeta([{ k: 'Fuel', v: '12.4 L/100' }, { k: 'Docs', v: 'OK', tone: 'ok' }])}
      ${wLine('Coming up · oil change', 'warn')}
      ${wFoot(a, 'Open garage')}`),

  cookcap: (a) => widgetRoot(a.slug, 'mw--cook', a.accent, 'medium', `
      ${wHead(a)}
      ${wHero('<span class="num">48</span>', 'family recipes')}
      ${wMeta([{ k: 'Tonight', v: 'Biryani' }, { k: 'List', v: '6 items' }])}
      ${wLine('Cook mode ready · shopping list synced', 'ok')}
      ${wFoot(a, 'Open cookbook')}`),

  deefoodie: (a) => widgetRoot(a.slug, 'mw--foodie', a.accent, 'small', `
      ${wHead(a)}
      ${wHero('<strong>Your Karachi</strong>', 'private beta')}
      ${wMeta([{ k: 'Visits', v: '—' }, { k: 'Near me', v: 'Soon' }])}
      ${wLine('Invited testers only', 'info')}
      ${wFoot(a, 'Learn more')}`),
};

/** Compact hero copy for iOS Today widgets — mirrors desktop widget stats */
export const IOS_WIDGET_SNAPSHOTS = {
  vaultcap: { big: '£284,520', small: 'net worth', extra: '<em class="warn">Zakat review due</em>' },
  pulsecap: { big: '87', small: 'recovery ready', extra: '<em class="ok">Smart Coach ready</em>' },
  prismcap: { big: '38', small: 'games offline', extra: '<em>Cipher Duel · Lv 4</em>' },
  steadycap: { big: 'Day 47', small: 'steady · 0 relapses', extra: '<em class="ok">Trigger forecast low</em>' },
  ledgercap: { big: 'Rs 4.2M', small: 'net worth', extra: '<em class="up">ENGRO ▲ 2.1%</em>' },
  deeponycap: { big: '127', small: 'in your collection', extra: '<em>3 favorites on wishlist</em>' },
  scentcap: { big: 'Oud Wood', small: 'worn today', extra: '<em>Bleu de Chanel 22%</em>' },
  auracap: { big: '84', small: 'Aura Score', extra: '<em>12/16 modules</em>' },
  travelcap: { big: '12 days', small: 'to Barcelona', extra: '<em class="info">Packed 78%</em>' },
  soulcap: { big: 'Steady', small: 'mood · checked in', extra: '<em class="info">Journal 4 days</em>' },
  masterycap: { big: '15 min', small: "today's session", extra: '<em>Foundations · EN · UR</em>' },
  ideacap: { big: '12', small: 'ideas this week', extra: '<em class="ok">On-device capture</em>' },
  carcap: { big: '320 km', small: 'to service', extra: '<em class="warn">Oil change</em>' },
  cookcap: { big: '48', small: 'family recipes', extra: '<em>Shopping list 6</em>' },
  deefoodie: { big: 'Karachi', small: 'private beta', extra: '<em class="info">Invite only</em>' },
};

const WIDGET_SIZES = {
  vaultcap: 'medium',
  pulsecap: 'small',
  prismcap: 'small',
  steadycap: 'medium',
  ledgercap: 'medium',
  deeponycap: 'medium',
  scentcap: 'small',
  soulcap: 'small',
  travelcap: 'medium',
  auracap: 'medium',
  masterycap: 'small',
  ideacap: 'small',
  carcap: 'small',
  cookcap: 'medium',
  deefoodie: 'small',
};

function buildClock() {
  return `
    <div class="mw mw--clock" data-widget-tease="clock" role="button" tabindex="0">
      <time class="clock__time num" id="widgetClock">--:--</time>
      <p class="clock__date" id="widgetDate"></p>
      <p class="clock__city">Local · Capricorn OS</p>
      <p class="clock__proof"><span class="clock__proof-dot" aria-hidden="true"></span><span data-proof>0 trackers · 0 third-party requests</span></p>
    </div>
  `;
}

function bindOpenButtons(root, onOpen) {
  root.querySelectorAll('[data-open-app]').forEach((btn) => {
    if (btn.closest('.task__item')) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      onOpen(btn.dataset.openApp);
    });
  });
}

function showWidgetTease(key) {
  const tease = WIDGET_TEASE[key];
  if (!tease) return;
  const app = APPS.find((a) => a.slug === key);
  sfx.click();
  notify({
    title: tease.title,
    body: tease.body,
    icon: tease.icon || app?.icon || 'assets/logo.svg',
    duration: 5200,
  });
}

function bindWidgetTeases(root) {
  root.querySelectorAll('.mw[data-widget-tease]:not(.mw--tasks)').forEach((el) => {
    const fire = (e) => {
      if (e.target.closest('[data-open-app], [data-task-social], .task__item, .mw__cta')) return;
      showWidgetTease(el.dataset.widgetTease);
    };
    el.addEventListener('click', fire);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fire(e);
      }
    });
  });
}

function countUp(el, dur = 900) {
  const raw = el.textContent.trim();
  const m = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return;
  const [, pre, numStr, suf] = m;
  const target = parseFloat(numStr.replace(/,/g, ''));
  if (!isFinite(target)) return;
  const decimals = (numStr.split('.')[1] || '').length;
  const hasComma = numStr.includes(',');
  const fmt = (v) => {
    const n = decimals ? v.toFixed(decimals) : Math.round(v);
    const s = hasComma
      ? Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : String(n);
    return pre + s + suf;
  };
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * e);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = raw;
  };
  requestAnimationFrame(tick);
}

function animateWidgets(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.querySelectorAll('.mw__bar-fill').forEach((fill) => {
    const target = fill.style.width;
    fill.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = target; }));
  });

  root.querySelectorAll('.widget-row--apps .mw__hero .num')
    .forEach((el) => countUp(el));
}

export function initWidgets({ onOpen }) {
  const grid = document.getElementById('widgetGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="widget-row widget-row--system">
      <div class="widget-cell widget-cell--clock">${buildClock()}</div>
      <div class="widget-cell widget-cell--tasks">${renderDesktopTasks()}</div>
    </div>
    <div class="widget-row widget-row--apps" id="widgetApps"></div>
  `;

  bindOpenButtons(grid, onOpen);

  bindTaskClicks(grid, {
    onOpen,
    onSocial: (social) => {
      const icon = document.querySelector(`#desktopSocialIcons [data-social="${social}"]`);
      icon?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (icon) {
        icon.classList.add('is-highlight');
        icon.focus({ preventScroll: true });
        icon.click();
        setTimeout(() => icon.classList.remove('is-highlight'), 1200);
      }
    },
  });

  const appsRow = document.getElementById('widgetApps');

  APPS.forEach((app, i) => {
    const render = WIDGET_RENDERERS[app.slug];
    if (!render) return;

    const wrap = document.createElement('div');
    const size = WIDGET_SIZES[app.slug] || 'small';
    wrap.className = `widget-cell widget-cell--${size}`;
    wrap.style.setProperty('--delay', `${i * 40}ms`);
    wrap.innerHTML = render(app);
    bindOpenButtons(wrap, onOpen);
    appsRow.appendChild(wrap);
  });

  bindWidgetTeases(grid);
  requestAnimationFrame(() => animateWidgets(grid));

  const proof = grid.querySelector('[data-proof]');
  if (proof) watchNetwork((st) => { proof.textContent = proofLine(st); });

  function tickClock() {
    const now = new Date();
    const t = document.getElementById('widgetClock');
    const d = document.getElementById('widgetDate');
    if (t) {
      t.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (d) {
      d.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    }
  }
  tickClock();
  setInterval(tickClock, 1000);
}

/**
 * Widget grid is natural-flow CSS now (any number of Caps, scrolls under the
 * dock). Kept as an export for callers; it only flags the scroll-fade state.
 */
export function layoutWidgetHeights() {
  const grid = document.getElementById('widgetGrid');
  if (!grid || grid.offsetParent === null) return;
  const update = () => {
    const more = grid.scrollHeight - grid.clientHeight - grid.scrollTop > 8;
    grid.classList.toggle('has-more', more);
  };
  if (!grid.dataset.fadeBound) {
    grid.dataset.fadeBound = '1';
    grid.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }
  update();
}
