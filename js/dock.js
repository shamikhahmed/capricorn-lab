import { APPS, SYSTEM } from './products.js';
import { sfx } from './sounds.js';
import { restoreWindow } from './window-manager.js';

let dockItems = [];

export function initDock({ onOpen }) {
  const dock = document.getElementById('dock');
  dockItems = [];

  const sysBtn = document.createElement('button');
  sysBtn.type = 'button';
  sysBtn.className = 'dock-item dock-item--sys';
  sysBtn.dataset.slug = 'system';
  sysBtn.setAttribute('aria-label', 'About Capricorn');
  sysBtn.innerHTML = `
    <span class="dock-tip" aria-hidden="true">About Capricorn</span>
    <div class="dock-icon dock-icon--sys">
      <img src="${SYSTEM.logo}" alt="" width="46" height="46">
    </div>
    <span class="dock-dot" aria-hidden="true"></span>
  `;
  sysBtn.addEventListener('click', () => {
    sfx.dock();
    document.dispatchEvent(new CustomEvent('cap:open-system', { detail: { action: 'about' } }));
  });
  sysBtn.style.setProperty('--dock-i', '0');
  dock.appendChild(sysBtn);

  const sep = document.createElement('div');
  sep.className = 'dock-sep';
  sep.setAttribute('aria-hidden', 'true');
  dock.appendChild(sep);

  APPS.forEach((app, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dock-item';
    btn.dataset.slug = app.slug;
    btn.style.setProperty('--dock-i', String(i + 1));
    btn.setAttribute('aria-label', `Open ${app.name}${app.wip ? ' (in development)' : ''}`);
    btn.innerHTML = `
      <span class="dock-tip">${app.name}${app.wip ? ' · WIP' : ''}</span>
      <div class="dock-icon${app.wip ? ' dock-icon--wip' : ''}">
        <img src="${app.icon}" alt="" width="46" height="46" loading="eager" decoding="async">
        ${app.wip ? '<span class="dock-wip" aria-hidden="true">WIP</span>' : ''}
      </div>
      <span class="dock-dot" aria-hidden="true"></span>
    `;

    btn.addEventListener('mouseenter', () => {
      magnify(btn, dockItems);
    });
    btn.addEventListener('mouseleave', () => {
      resetMagnify(dockItems);
    });
    btn.addEventListener('click', () => {
      sfx.dock();
      btn.classList.add('is-bounce');
      setTimeout(() => btn.classList.remove('is-bounce'), 400);

      const win = document.querySelector(`[data-win-id="${app.slug}"]`);
      if (win?.classList.contains('is-minimized')) {
        restoreWindow(app.slug);
      } else {
        onOpen(app.slug);
      }
    });

    dock.appendChild(btn);
    dockItems.push(btn);
  });

  // Keyboard: arrow keys move focus across the dock (macOS-style).
  dock.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const items = [...dock.querySelectorAll('.dock-item')];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0);
    items[next].focus();
    magnify(items[next], dockItems.filter((d) => d.dataset.slug !== 'system'));
  });

  dockItems.forEach((item) => {
    item.addEventListener('focus', () => magnify(item, dockItems.filter((d) => d.dataset.slug !== 'system')));
    item.addEventListener('blur', () => resetMagnify(dockItems.filter((d) => d.dataset.slug !== 'system')));
  });

  document.addEventListener('cap:window-focus', () => updateDots());
  document.addEventListener('cap:window-close', () => updateDots());
  document.addEventListener('cap:window-minimize', () => updateDots());

  function updateDots() {
    dock.querySelectorAll('.dock-item[data-slug]').forEach((item) => {
      const slug = item.dataset.slug;
      if (slug === 'system') return;
      const win = document.querySelector(`[data-win-id="${slug}"]`);
      item.classList.toggle('is-open', win && !win.classList.contains('is-minimized'));
    });
  }
}

function magnify(active, items) {
  const idx = items.indexOf(active);
  if (idx < 0) return;
  items.forEach((item, i) => {
    const dist = Math.abs(i - idx);
    const scale = dist === 0 ? 1.28 : dist === 1 ? 1.1 : dist === 2 ? 1.02 : 0.96;
    const lift = dist === 0 ? -12 : dist === 1 ? -6 : dist === 2 ? -2 : 0;
    item.style.transform = `translateY(${lift}px) scale(${scale})`;
  });
}

function resetMagnify(items) {
  items.forEach((item) => { item.style.transform = ''; });
}
