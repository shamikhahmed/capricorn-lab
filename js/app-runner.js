import { sfx } from './sounds.js';

/**
 * Run here — the real Cap PWA inside the OS (desktop window or iOS sheet).
 * Same-origin first-party iframe: the app keeps its own storage exactly as if
 * it were opened directly. No sandbox (it would break IndexedDB / workers).
 */

export function canRun(app) {
  return Boolean(app?.url) && !app.privateBeta && !app.wip;
}

export function runnerHTML(app, { surface = 'desktop' } = {}) {
  const shown = app.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `
    <div class="runner runner--${surface}" style="--accent:${app.accent}">
      <div class="runner__bar">
        <button type="button" class="runner__btn" data-runner-back aria-label="Back to ${app.name} info">‹ <span>Info</span></button>
        <span class="runner__url" title="${app.url}"><img src="${app.icon}" alt="" width="16" height="16"><span>${shown}</span></span>
        <button type="button" class="runner__btn" data-runner-reload aria-label="Reload ${app.name}" title="Reload">↻</button>
        ${surface === 'desktop' ? '<button type="button" class="runner__btn" data-runner-frame aria-label="Toggle phone frame" title="Phone frame / full width">▯</button>' : ''}
        <a class="runner__btn" href="${app.url}" target="_blank" rel="noopener" aria-label="Open ${app.name} in a new tab" title="Open in new tab">↗</a>
        ${surface === 'ios' ? '<button type="button" class="runner__btn runner__done" data-close>Done</button>' : ''}
      </div>
      <div class="runner__stage${surface === 'desktop' ? ' is-phone' : ''}">
        <div class="runner__device">
          <iframe class="runner__frame" src="${app.url}" title="${app.name} — running live"
            allow="clipboard-read; clipboard-write; microphone; camera; fullscreen; web-share"
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
          <div class="runner__loading" aria-hidden="true">
            <img src="${app.icon}" alt="" width="56" height="56">
            <span>Starting ${app.name}…</span>
          </div>
        </div>
      </div>
      <p class="runner__note">This is the real ${app.name}. Anything you add stays in this browser — same as opening the app directly.</p>
    </div>`;
}

/** Wire toolbar; onBack restores the caller's previous view. */
export function bindRunner(root, { onBack } = {}) {
  const frame = root.querySelector('.runner__frame');
  const stage = root.querySelector('.runner__stage');
  const loading = root.querySelector('.runner__loading');
  const settle = () => loading?.classList.add('is-gone');
  frame?.addEventListener('load', settle, { once: true });
  // some PWAs keep the load event pending behind workers — never trap the user
  setTimeout(settle, 6000);

  root.querySelector('[data-runner-back]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    onBack?.();
  });
  root.querySelector('[data-runner-reload]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    loading?.classList.remove('is-gone');
    frame?.addEventListener('load', settle, { once: true });
    if (frame) frame.src = frame.src;
  });
  root.querySelector('[data-runner-frame]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    stage?.classList.toggle('is-phone');
  });
}
