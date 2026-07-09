import { APPS, SYSTEM, SOCIAL, wipBadgeHTML } from './products.js';
import { launchHref } from './ui-helpers.js';
import { sfx } from './sounds.js';
import { notify } from './notifications.js';

const SOCIAL_ICON_SRC = {
  github: 'assets/icons/social/github.svg',
  x: 'assets/icons/social/x.svg',
  instagram: 'assets/icons/social/instagram.svg',
  linkedin: 'assets/icons/social/linkedin.svg',
  youtube: 'assets/icons/social/youtube.svg',
  tiktok: 'assets/icons/social/tiktok.svg',
  threads: 'assets/icons/social/threads.svg',
};

function socialIconImg(id, size = 52) {
  const src = SOCIAL_ICON_SRC[id];
  if (!src) return '';
  return `<img class="home-icon__brand" src="${src}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;
}

export function renderHomeIcon(item, { variant = 'grid' } = {}) {
  const live = Boolean(item.url);
  const size = variant === 'sidebar' ? 28 : variant === 'pill' ? 34 : 48;
  const glyph = `<span class="home-icon__glyph home-icon__glyph--${item.id}">${socialIconImg(item.id, size)}</span>`;

  if (variant === 'pill' || variant === 'sidebar') {
    const cls = variant === 'sidebar' ? 'home-icon--sidebar' : 'home-icon--pill';
    if (live) {
      return `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="home-icon ${cls}" data-social="${item.id}" title="${item.label}" aria-label="${item.label}">
          ${glyph}
        </a>`;
    }
    return `
      <span class="home-icon ${cls} is-disabled" role="button" tabindex="0" data-social="${item.id}" title="${item.label}" aria-label="${item.label} — coming soon">
        ${glyph}
      </span>`;
  }

  const label = `<span class="home-icon__label">${item.label}</span>`;
  if (live) {
    return `
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="home-icon" data-social="${item.id}" title="${item.label}">
        ${glyph}${label}
      </a>`;
  }
  return `
    <span class="home-icon is-disabled" role="button" tabindex="0" data-social="${item.id}" title="${item.label}" aria-label="${item.label} — coming soon">
      ${glyph}${label}
    </span>`;
}

export function bindSocialClicks(root) {
  if (!root) return;
  root.querySelectorAll('.is-disabled[data-social]').forEach((el) => {
    const fire = () => {
      sfx.click();
      const item = SOCIAL.find((s) => s.id === el.dataset.social);
      notify({
        title: item?.label || 'Social',
        body: 'Account not live yet — link goes here when ready.',
        icon: 'assets/logo.svg',
      });
    };
    el.addEventListener('click', (e) => { e.preventDefault(); fire(); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
    });
  });
}

export function initSocial() {
  const desktopIcons = document.getElementById('desktopSocialIcons');
  if (desktopIcons) {
    desktopIcons.innerHTML = SOCIAL.map((item) => renderHomeIcon(item, { variant: 'sidebar' })).join('');
    bindSocialClicks(desktopIcons);
  }
}

export function renderAppHomeIcon(app) {
  const href = launchHref(app);
  return `
    <a href="${href}" class="home-icon home-icon--app${app.wip ? ' home-icon--wip' : ''}" target="_blank" rel="noopener">
      <span class="home-icon__glyph home-icon__glyph--img">
        <img src="${app.icon}" alt="" width="60" height="60">
        ${app.wip ? '<span class="home-icon__badge">WIP</span>' : ''}
      </span>
      <span class="home-icon__label">${app.name}</span>
    </a>
  `;
}

export function renderSystemHomeIcon({ id, label, icon, img }) {
  return `
    <button type="button" class="home-icon home-icon--sys" data-ios-sys="${id}">
      <span class="home-icon__glyph home-icon__glyph--sys">${img ? `<img src="${img}" alt="" width="60" height="60">` : icon}</span>
      <span class="home-icon__label">${label}</span>
    </button>
  `;
}

export { SOCIAL, APPS, SYSTEM };
