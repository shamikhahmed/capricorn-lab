import { THEMES, getSkin, getSkinDef, surpriseSkin, skinShareURL } from './theme.js';
import { paintPreview } from './wallpaper.js';
import { notify } from './notifications.js';
import { sfx } from './sounds.js';

/**
 * Appearance — the theme gallery. Each card carries [data-skin] so the skin's
 * CSS tokens apply inside the card; the mini desktop / phone is drawn only with
 * those tokens (sp-* classes) and the wallpaper is a still frame of the real
 * painter. Clicking a card is handled by theme.js ([data-skin-pick]).
 */

function miniDesktop() {
  return `
    <span class="sp sp--desk" aria-hidden="true">
      <span class="sp-bar"><i></i><i></i><i></i></span>
      <span class="sp-win">
        <span class="sp-title"><b></b><b></b><b></b></span>
        <span class="sp-line"></span><span class="sp-line sp-line--short"></span>
        <span class="sp-btn"></span>
      </span>
      <span class="sp-widget"><span class="sp-num">42</span><span class="sp-line sp-line--short"></span></span>
      <span class="sp-widget sp-widget--b"><span class="sp-num">07</span><span class="sp-line sp-line--short"></span></span>
      <span class="sp-dock"><i></i><i></i><i></i><i></i><i></i><i></i></span>
    </span>`;
}

function miniPhone() {
  return `
    <span class="sp sp--phone" aria-hidden="true">
      <span class="sp-status"></span>
      <span class="sp-widget sp-widget--wide"><span class="sp-num">9:41</span></span>
      <span class="sp-widget"><span class="sp-num">42</span></span>
      <span class="sp-widget"><span class="sp-num">07</span></span>
      <span class="sp-dock"><i></i><i></i><i></i><i></i></span>
    </span>`;
}

function cardHTML(t, surface) {
  const on = t.id === getSkin();
  return `
    <button type="button" class="skin-card skin-card--${surface}${on ? ' is-active' : ''}" data-skin-pick="${t.id}" data-skin="${t.id}"
      aria-pressed="${on}" aria-label="${t.name} theme — ${t.mood}">
      <span class="skin-card__stage">
        <canvas class="skin-card__wall" data-skin-wall="${t.id}"></canvas>
        ${surface === 'ios' ? miniPhone() : miniDesktop()}
        <span class="skin-card__check" aria-hidden="true">✓</span>
      </span>
      <span class="skin-card__meta">
        <strong>${t.name}</strong>
        <small>${t.mood}</small>
      </span>
    </button>`;
}

export function appearanceHTML({ surface = 'desktop' } = {}) {
  return `
    <div class="sys-panel sys-panel--appearance appear appear--${surface}">
      <header class="appear__head">
        <div>
          <h2>Appearance</h2>
          <p>${THEMES.length} complete looks — wallpaper, glass, type and sound. Rendered live on your device.</p>
        </div>
        <div class="appear__actions">
          <button type="button" class="appear__btn" data-skin-surprise>✦ Surprise me</button>
          <button type="button" class="appear__btn appear__btn--ghost" data-skin-share>Copy theme link</button>
        </div>
      </header>
      <div class="appear__grid">${THEMES.map((t) => cardHTML(t, surface)).join('')}</div>
      <p class="appear__foot">Tip: share <code>?theme=synthwave</code> — or any theme name — and the hub opens dressed that way.</p>
    </div>`;
}

/** Paint previews lazily (one per idle slice) and wire the extra buttons. */
export function bindAppearance(root, { surface = 'desktop' } = {}) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 16));
  const walls = [...root.querySelectorAll('[data-skin-wall]')];
  const paintNext = () => {
    const c = walls.shift();
    if (!c || !c.isConnected) return;
    if (c.clientWidth) paintPreview(c, c.dataset.skinWall, { surface });
    idle(paintNext, { timeout: 120 });
  };
  requestAnimationFrame(() => idle(paintNext, { timeout: 120 }));

  root.querySelector('[data-skin-surprise]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    surpriseSkin({ x: e.clientX, y: e.clientY });
  });

  root.querySelector('[data-skin-share]')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    sfx.click();
    const url = skinShareURL();
    const name = getSkinDef().name;
    try {
      if (navigator.share && surface === 'ios') {
        await navigator.share({ title: `Capricorn OS — ${name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify({ title: 'Theme link copied', body: `${name} · ${url.replace(/^https?:\/\//, '')}`, icon: 'assets/logo.svg', duration: 3200 });
    } catch {
      notify({ title: 'Theme link', body: url, icon: 'assets/logo.svg', duration: 6000 });
    }
  });

}
