import { APPS } from './products.js';
import { THEMES } from './theme.js';

const COMMANDS = [
  { id: 'apps', label: `Applications — all ${APPS.length} Cap apps`, type: 'system' },
  { id: 'appearance', label: 'Appearance — browse all themes', type: 'system' },
  { id: 'privacy', label: 'Privacy Monitor — every request this page made', type: 'system' },
  { id: 'sovereignty', label: 'System Preferences — Sovereignty', type: 'system' },
  { id: 'about', label: 'About This Device', type: 'system' },
  { id: 'help', label: 'Help', type: 'system' },
  { id: 'lock', label: 'Lock Screen', type: 'lock' },
  ...APPS.map((a) => ({
    id: a.slug,
    label: `${a.name} — ${a.tagline}`,
    type: 'app',
    icon: a.icon,
  })),
  { id: 'surprise', label: 'Theme: Surprise me', type: 'skin', swatch: ['#888', '#ff2bd6', '#3cffb0'] },
  ...THEMES.map((t) => ({ id: t.id, label: `Theme: ${t.name} — ${t.mood}`, type: 'skin', swatch: t.swatch })),
];

export function initPalette({ onSelect }) {
  const palette = document.getElementById('palette');
  const input = document.getElementById('paletteInput');
  const list = document.getElementById('paletteList');
  let selected = 0;
  let filtered = [...COMMANDS];

  function render() {
    list.innerHTML = filtered.map((cmd, i) => `
      <li class="palette-item${i === selected ? ' is-selected' : ''}" role="option" data-index="${i}">
        ${cmd.icon ? `<img class="palette-item__icon" src="${cmd.icon}" alt="" width="28" height="28">`
          : cmd.swatch ? `<span class="palette-item__skin" style="--s0:${cmd.swatch[0]};--s1:${cmd.swatch[1]};--s2:${cmd.swatch[2]}" aria-hidden="true"></span>`
          : '<span class="palette-item__sys">⚙</span>'}
        <span class="palette-item__label">${cmd.label}</span>
        <kbd>↵</kbd>
      </li>
    `).join('');

    list.querySelectorAll('.palette-item').forEach((item) => {
      item.addEventListener('click', () => pick(filtered[Number(item.dataset.index)]));
    });
  }

  function pick(cmd) {
    close();
    onSelect(cmd);
  }

  function open() {
    palette.hidden = false;
    input.value = '';
    filtered = [...COMMANDS];
    selected = 0;
    render();
    input.focus();
    import('./sounds.js').then((m) => m.sfx.palette());
  }

  function close() {
    palette.hidden = true;
    input.blur();
  }

  function filter(q) {
    const query = q.toLowerCase().trim();
    filtered = query
      ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query) || c.id.includes(query))
      : [...COMMANDS];
    selected = 0;
    render();
  }

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(selected + 1, filtered.length - 1);
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
      render();
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      pick(filtered[selected]);
    } else if (e.key === 'Escape') {
      close();
    }
  });

  palette.querySelector('[data-close]').addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      palette.hidden ? open() : close();
    }
    if (e.key === 'Escape' && !palette.hidden) close();
  });

  return { open, close };
}
