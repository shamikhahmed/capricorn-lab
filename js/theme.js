import { sfx } from './sounds.js';

const STORAGE_KEY = 'cap-theme';

export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private browsing */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === 'dark' ? '#121110' : '#e8e2d6';

  document.dispatchEvent(new CustomEvent('cap:theme', { detail: { theme: next } }));
  syncThemeControls(next);
}

export function toggleTheme() {
  sfx.click();
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function syncThemeControls(theme) {
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const icon = isDark ? '☀' : '☾';

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.textContent = icon;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });

  const cc = document.querySelector('[data-cc="appearance"]');
  if (cc) {
    cc.classList.add('is-on');
    const em = cc.querySelector('em');
    if (em) em.textContent = isDark ? 'Dark' : 'Light';
  }
}

export function initTheme() {
  syncThemeControls(getTheme());

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
    });
  });

  document.querySelector('[data-cc="appearance"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTheme();
  });
}
