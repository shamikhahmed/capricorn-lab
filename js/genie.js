const EASE = 'cubic-bezier(0.45, 0.05, 0.25, 0.95)';

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getDockTarget(slug) {
  const item = document.querySelector(`.dock-item[data-slug="${slug}"]`);
  if (!item) {
    const dock = document.querySelector('.dock-inner');
    const r = dock?.getBoundingClientRect();
    return {
      cx: r ? r.left + r.width / 2 : window.innerWidth / 2,
      cy: r ? r.top + r.height / 2 : window.innerHeight - 60,
      w: 52,
      h: 52,
    };
  }
  const r = item.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
}

export function getMenubarTarget() {
  const logo = document.getElementById('menuLogo') || document.querySelector('.menubar-apple');
  const r = logo?.getBoundingClientRect();
  return {
    cx: r ? r.left + r.width / 2 : 72,
    cy: r ? r.bottom + 6 : 42,
    w: 28,
    h: 28,
  };
}

export function getWorkspaceBounds() {
  const menubar = 38;
  const dock = 88;
  const pad = 16;
  return {
    left: pad,
    top: menubar + pad,
    width: window.innerWidth - pad * 2,
    height: window.innerHeight - menubar - dock - pad * 2,
  };
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/**
 * Genie shrink toward dock (minimize / close — app windows)
 */
export function genieToDock(el, slug, onDone) {
  if (reduced()) {
    onDone?.();
    return Promise.resolve();
  }

  const start = centerOf(el);
  const target = getDockTarget(slug);
  const tx = target.cx - start.x;
  const ty = target.cy - start.y;
  const sx = Math.max(0.04, target.w / start.w);
  const sy = Math.max(0.04, target.h / start.h);

  el.classList.add('is-genie');
  el.style.transformOrigin = `${50 + (tx / start.w) * 25}% ${100}%`;
  el.style.willChange = 'transform, opacity, filter, border-radius';

  return el.animate([
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      borderRadius: '14px',
    },
    {
      offset: 0.5,
      transform: `translate(${tx * 0.45}px, ${ty * 0.55}px) scale(${0.35 + sx * 0.25}, ${0.5})`,
      opacity: 0.88,
      filter: 'blur(1px) brightness(1.05)',
      borderRadius: '20px',
    },
    {
      transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
      opacity: 0,
      filter: 'blur(6px) brightness(1.2)',
      borderRadius: '50%',
    },
  ], { duration: 520, easing: EASE, fill: 'forwards' }).finished.then(() => {
    el.classList.remove('is-genie');
    el.style.willChange = '';
    el.style.transformOrigin = '';
    onDone?.();
  });
}

/**
 * Genie shrink toward menubar (minimize / close — menu-bar windows)
 */
export function genieToMenubar(el, onDone) {
  if (reduced()) {
    onDone?.();
    return Promise.resolve();
  }

  const start = centerOf(el);
  const target = getMenubarTarget();
  const tx = target.cx - start.x;
  const ty = target.cy - start.y;
  const sx = Math.max(0.04, target.w / start.w);
  const sy = Math.max(0.04, target.h / start.h);

  el.classList.add('is-genie');
  el.style.transformOrigin = `${50 + (tx / start.w) * 25}% ${0}%`;
  el.style.willChange = 'transform, opacity, filter, border-radius';

  return el.animate([
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      borderRadius: '14px',
    },
    {
      offset: 0.5,
      transform: `translate(${tx * 0.45}px, ${ty * 0.55}px) scale(${0.35 + sx * 0.25}, ${0.5})`,
      opacity: 0.88,
      filter: 'blur(1px) brightness(1.05)',
      borderRadius: '20px',
    },
    {
      transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
      opacity: 0,
      filter: 'blur(6px) brightness(1.2)',
      borderRadius: '50%',
    },
  ], { duration: 520, easing: EASE, fill: 'forwards' }).finished.then(() => {
    el.classList.remove('is-genie');
    el.style.willChange = '';
    el.style.transformOrigin = '';
    onDone?.();
  });
}

/**
 * Genie expand from dock (open / restore — app windows)
 */
export function genieFromDock(el, slug, endLeft, endTop, endW, endH) {
  if (reduced()) {
    el.style.left = `${endLeft}px`;
    el.style.top = `${endTop}px`;
    el.style.width = `${endW}px`;
    el.style.height = `${endH}px`;
    el.style.opacity = '1';
    return Promise.resolve();
  }

  const target = getDockTarget(slug);
  const endCx = endLeft + endW / 2;
  const endCy = endTop + endH / 2;
  const tx = target.cx - endCx;
  const ty = target.cy - endCy;
  const sx = Math.max(0.04, target.w / endW);
  const sy = Math.max(0.04, target.h / endH);

  el.style.left = `${endLeft}px`;
  el.style.top = `${endTop}px`;
  el.style.width = `${endW}px`;
  el.style.height = `${endH}px`;
  el.style.transformOrigin = `${50 + (tx / endW) * 25}% ${100}%`;
  el.classList.add('is-genie');

  return el.animate([
    {
      transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
      opacity: 0,
      filter: 'blur(8px) brightness(1.15)',
      borderRadius: '50%',
    },
    {
      offset: 0.4,
      transform: `translate(${tx * 0.35}px, ${ty * 0.25}px) scale(${0.45}, ${0.6})`,
      opacity: 0.7,
      filter: 'blur(2px) brightness(1.05)',
      borderRadius: '22px',
    },
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      borderRadius: '14px',
    },
  ], { duration: 520, easing: EASE, fill: 'forwards' }).finished.then(() => {
    el.classList.remove('is-genie');
    el.style.transform = '';
    el.style.filter = '';
    el.style.borderRadius = '';
    el.style.transformOrigin = '';
  });
}

/**
 * Genie expand from menubar (open / restore — menu-bar windows)
 */
export function genieFromMenubar(el, endLeft, endTop, endW, endH) {
  if (reduced()) {
    el.style.left = `${endLeft}px`;
    el.style.top = `${endTop}px`;
    el.style.width = `${endW}px`;
    el.style.height = `${endH}px`;
    el.style.opacity = '1';
    return Promise.resolve();
  }

  const target = getMenubarTarget();
  const endCx = endLeft + endW / 2;
  const endCy = endTop + endH / 2;
  const tx = target.cx - endCx;
  const ty = target.cy - endCy;
  const sx = Math.max(0.04, target.w / endW);
  const sy = Math.max(0.04, target.h / endH);

  el.style.left = `${endLeft}px`;
  el.style.top = `${endTop}px`;
  el.style.width = `${endW}px`;
  el.style.height = `${endH}px`;
  el.style.transformOrigin = `${50 + (tx / endW) * 25}% ${0}%`;
  el.classList.add('is-genie');

  return el.animate([
    {
      transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
      opacity: 0,
      filter: 'blur(8px) brightness(1.15)',
      borderRadius: '50%',
    },
    {
      offset: 0.4,
      transform: `translate(${tx * 0.35}px, ${ty * 0.25}px) scale(${0.45}, ${0.6})`,
      opacity: 0.7,
      filter: 'blur(2px) brightness(1.05)',
      borderRadius: '22px',
    },
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      borderRadius: '14px',
    },
  ], { duration: 520, easing: EASE, fill: 'forwards' }).finished.then(() => {
    el.classList.remove('is-genie');
    el.style.transform = '';
    el.style.filter = '';
    el.style.borderRadius = '';
    el.style.transformOrigin = '';
  });
}

/**
 * Genie expand to workspace (maximize)
 */
export function genieMaximize(el, bounds, saved, onDone) {
  if (reduced()) {
    applyBounds(el, bounds);
    onDone?.();
    return Promise.resolve();
  }

  const start = { l: saved.left, t: saved.top, w: saved.width, h: saved.height };
  el.style.left = `${start.l}px`;
  el.style.top = `${start.t}px`;
  el.style.width = `${start.w}px`;
  el.style.height = `${start.h}px`;
  el.classList.add('is-genie');

  const frames = [
    { left: start.l, top: start.t, width: start.w, height: start.h, br: 14, op: 1 },
    { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, br: 10, op: 1 },
  ];

  return animateBounds(el, frames, 420).then(() => {
    el.classList.remove('is-genie');
    onDone?.();
  });
}

/**
 * Genie shrink from maximized (restore)
 */
export function genieRestore(el, bounds, saved, onDone) {
  if (reduced()) {
    applyBounds(el, saved);
    onDone?.();
    return Promise.resolve();
  }

  el.classList.add('is-genie');
  const frames = [
    { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, br: 10, op: 1 },
    { left: saved.left, top: saved.top, width: saved.width, height: saved.height, br: 14, op: 1 },
  ];

  return animateBounds(el, frames, 420).then(() => {
    el.classList.remove('is-genie');
    onDone?.();
  });
}

function applyBounds(el, b) {
  el.style.left = `${b.left}px`;
  el.style.top = `${b.top}px`;
  el.style.width = `${b.width}px`;
  el.style.height = `${b.height}px`;
}

function animateBounds(el, frames, duration) {
  const start = frames[0];
  const end = frames[1];
  applyBounds(el, { left: start.left, top: start.top, width: start.width, height: start.height });
  el.style.borderRadius = `${start.br}px`;

  const anim = { t: 0 };
  return new Promise((resolve) => {
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const l = start.left + (end.left - start.left) * e;
      const t = start.top + (end.top - start.top) * e;
      const w = start.width + (end.width - start.width) * e;
      const h = start.height + (end.height - start.height) * e;
      const br = start.br + (end.br - start.br) * e;
      applyBounds(el, { left: l, top: t, width: w, height: h });
      el.style.borderRadius = `${br}px`;
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

export function readWindowBounds(el) {
  return {
    left: parseFloat(el.style.left) || el.offsetLeft,
    top: parseFloat(el.style.top) || el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}
