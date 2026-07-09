import { sfx, isSoundEnabled, setSounds } from './sounds.js';
import { notify } from './notifications.js';

const WIFI_BLOCKERS = [
  {
    title: 'Wi‑Fi is not a suggestion.',
    body: 'Every Cap app works offline on your phone. This website? It needs Wi‑Fi like plants need sun. Nice try though.',
  },
  {
    title: 'Sovereignty has limits.',
    body: 'VaultCap, PulseCap, PrismCap — all fine without Wi‑Fi. Capricorn Lab in your browser? Not so much. Wi‑Fi stays on.',
  },
  {
    title: 'You cannot unplug the demo.',
    body: 'Our apps encrypt on-device. Our marketing site streams from the internet. Turning off Wi‑Fi would be very on-brand and very broken.',
  },
];

function setTileState(tile, on, label) {
  tile.classList.toggle('is-on', on);
  tile.setAttribute('aria-pressed', String(on));
  const em = tile.querySelector('em');
  if (em) em.textContent = label;
}

function setPanelOpen(open) {
  document.body.classList.toggle('cc-open', open);
}

export function initControlCenter() {
  const btn = document.getElementById('ccToggle');
  const panel = document.getElementById('controlCenter');
  if (!btn || !panel) return;

  const close = () => {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    setPanelOpen(false);
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    setPanelOpen(open);
    if (open) sfx.click();
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      e.preventDefault();
      close();
    }
  });

  const soundTile = panel.querySelector('[data-cc="sound"]');
  soundTile?.addEventListener('click', (e) => {
    const toggle = e.currentTarget;
    const on = toggle.classList.toggle('is-on');
    setSounds(on);
    setTileState(toggle, on, on ? 'On' : 'Off');
    if (on) sfx.click();
  });

  const wifiTile = panel.querySelector('[data-cc="wifi"]');
  wifiTile?.classList.add('is-on', 'is-locked');
  setTileState(wifiTile, true, 'On');
  wifiTile?.setAttribute('aria-pressed', 'true');

  wifiTile?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (wifiTile.classList.contains('is-on')) {
      notify({ ...WIFI_BLOCKERS[Math.floor(Math.random() * WIFI_BLOCKERS.length)], icon: 'assets/logo.svg', duration: 5600 });
      sfx.click();
      return;
    }
    wifiTile.classList.add('is-on');
    setTileState(wifiTile, true, 'On');
    sfx.click();
  });

  const btTile = panel.querySelector('[data-cc="bluetooth"]');
  btTile?.addEventListener('click', (e) => {
    const on = e.currentTarget.classList.toggle('is-on');
    setTileState(e.currentTarget, on, on ? 'On' : 'Off');
    sfx.click();
  });

  const focusTile = panel.querySelector('[data-cc="focus"]');
  focusTile?.addEventListener('click', (e) => {
    const on = e.currentTarget.classList.toggle('is-on');
    setTileState(e.currentTarget, on, on ? 'Sovereign' : 'Off');
    sfx.click();
  });

  const vol = panel.querySelector('#ccVolume');
  vol?.addEventListener('input', () => { /* visual only */ });

  if (!isSoundEnabled()) {
    soundTile?.classList.remove('is-on');
    setTileState(soundTile, false, 'Off');
  }
}

export function initAppleMenu() {
  const btn = document.getElementById('menuLogo');
  const menu = document.getElementById('appleMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    if (open) sfx.click();
  });

  document.addEventListener('click', () => { menu.hidden = true; });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) menu.hidden = true;
  });

  menu.querySelector('[data-am="about"]')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'about' } }));
  });
  menu.querySelector('[data-am="prefs"]')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'sovereignty' } }));
  });
  menu.querySelector('[data-am="restart"]')?.addEventListener('click', () => location.reload());
}
