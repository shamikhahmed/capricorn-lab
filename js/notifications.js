import { sfx } from './sounds.js';
import { APPS } from './products.js';

/** Toast into whichever view (desktop / mobile) is currently visible. */
function activeStack() {
  const root = document.querySelector('#desktop:not([hidden]), #mobile:not([hidden])');
  return root?.querySelector('.notify-stack') || document.querySelector('.notify-stack');
}

/** Session-only toast history for the notification center (max 20). */
const HISTORY = [];

export function getNotifyHistory() {
  return HISTORY;
}

export function notify({ title, body, icon, duration = 4500 }) {
  HISTORY.unshift({ title, body, icon, at: new Date() });
  if (HISTORY.length > 20) HISTORY.pop();
  document.dispatchEvent(new CustomEvent('cap:notify-history'));

  const stack = activeStack();
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'notify';
  el.innerHTML = `
    ${icon ? `<img src="${icon}" alt="" width="32" height="32">` : ''}
    <div>
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
  `;
  stack.appendChild(el);
  sfx.notify();

  requestAnimationFrame(() => el.classList.add('is-in'));

  const close = () => {
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
  };

  const t = setTimeout(close, duration);
  el.addEventListener('click', () => { clearTimeout(t); close(); });
}

export function welcomeToOS() {
  const h = new Date().getHours();
  const daypart = h < 5 ? 'Up late. Respect.' : h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
  setTimeout(() => {
    notify({
      title: `${daypart} Capricorn OS ready.`,
      body: `${APPS.length} apps loaded. Zero servers contacted.`,
      icon: 'assets/logo.svg',
    });
  }, 1200);
}
