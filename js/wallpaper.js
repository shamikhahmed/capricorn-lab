import { getSkin, getSkinDef } from './theme.js';

/**
 * Wallpaper engine — one painter per skin (js/theme.js THEMES).
 * Painter: { fps, maxDpr, draw(env) }. fps 0 = static (drawn on resize / skin
 * change only). Heavy static layers are cached in env.cache and rebuilt when
 * the canvas size or skin changes. Loop pauses while the tab or canvas is hidden.
 */

/* ── helpers ───────────────────────────────────────────────────────────── */

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function ridge(seed, n = 72, rough = 0.55) {
  const r = rng(seed);
  const pts = [];
  let v = r();
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * rough;
    v = Math.min(1, Math.max(0, v));
    pts.push(v);
  }
  // two smoothing passes — mountains, not static noise
  for (let p = 0; p < 2; p++) {
    for (let i = 1; i < n - 1; i++) pts[i] = (pts[i - 1] + pts[i] * 2 + pts[i + 1]) / 4;
  }
  return pts;
}

function fillRidge(ctx, pts, w, h, baseY, amp, fill, shape = () => 1) {
  ctx.beginPath();
  ctx.moveTo(0, h);
  pts.forEach((v, i) => {
    const u = i / (pts.length - 1);
    ctx.lineTo(u * w, baseY - v * amp * shape(u));
  });
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRidge(ctx, pts, w, baseY, amp, stroke, width, shape = () => 1) {
  ctx.beginPath();
  pts.forEach((v, i) => {
    const u = i / (pts.length - 1);
    const y = baseY - v * amp * shape(u);
    if (i) ctx.lineTo(u * w, y);
    else ctx.moveTo(0, y);
  });
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function vignette(ctx, w, h, color, inner = 0.25, outer = 0.9) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * inner, w / 2, h / 2, Math.max(w, h) * outer);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ── Capricorn (light / dark) — drifting warm mesh, the original ───────── */

const CAPRICORN = {
  light: {
    base: ['#d8d0c4', '#cfc6b8', '#c4baa8'],
    blobs: [
      { x: 0.25, y: 0.35, r: 0.42, color: [210, 195, 175], speed: 0.15 },
      { x: 0.72, y: 0.28, r: 0.38, color: [195, 210, 225], speed: 0.12 },
      { x: 0.55, y: 0.72, r: 0.45, color: [225, 205, 170], speed: 0.1 },
      { x: 0.15, y: 0.78, r: 0.32, color: [188, 178, 165], speed: 0.18 },
    ],
    mesh: [201, 162, 39, 0.06],
    vignette: [40, 35, 28, 0.08],
    lines: 'rgba(255,255,255,0.04)',
    darkBlobs: false,
  },
  dark: {
    base: ['#141210', '#121110', '#0e0d0c'],
    blobs: [
      { x: 0.22, y: 0.32, r: 0.48, color: [55, 48, 72], speed: 0.12 },
      { x: 0.78, y: 0.22, r: 0.42, color: [32, 42, 68], speed: 0.1 },
      { x: 0.58, y: 0.75, r: 0.5, color: [68, 52, 38], speed: 0.14 },
      { x: 0.12, y: 0.82, r: 0.36, color: [42, 38, 34], speed: 0.16 },
    ],
    mesh: [212, 175, 55, 0.08],
    vignette: [0, 0, 0, 0.35],
    lines: 'rgba(255,255,255,0.02)',
    darkBlobs: true,
  },
  ios: {
    base: ['#1a1f3a', '#2d1f3d', '#1a2848'],
    blobs: [
      { x: 0.2, y: 0.12, r: 0.52, color: [120, 140, 200], speed: 0.11 },
      { x: 0.85, y: 0.28, r: 0.46, color: [180, 120, 200], speed: 0.13 },
      { x: 0.52, y: 0.88, r: 0.58, color: [40, 60, 120], speed: 0.1 },
      { x: 0.08, y: 0.55, r: 0.34, color: [90, 70, 140], speed: 0.15 },
    ],
    mesh: [160, 120, 220, 0.12],
    vignette: [0, 0, 0, 0.28],
    lines: 'rgba(255,255,255,0.025)',
    darkBlobs: true,
  },
};

const capricorn = {
  // soft gradients drifting slowly — half-res + low fps is visually identical
  fps: 15,
  maxDpr: 0.6,
  draw({ ctx, w, h, t, mode, surface, parx, pary }) {
    const pal = surface === 'ios' ? CAPRICORN.ios : CAPRICORN[mode];
    const tt = t * 0.24;
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, pal.base[0]);
    base.addColorStop(0.45, pal.base[1]);
    base.addColorStop(1, pal.base[2]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    pal.blobs.forEach((b, i) => {
      const cx = (b.x + Math.sin(tt * b.speed + i) * 0.04) * w + parx * 0.35;
      const cy = (b.y + Math.cos(tt * b.speed * 0.8 + i * 1.3) * 0.03) * h + pary * 0.35;
      const radius = b.r * Math.max(w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const [r, gr, bl] = b.color;
      g.addColorStop(0, `rgba(${r}, ${gr}, ${bl}, ${pal.darkBlobs ? 0.65 : 0.55})`);
      g.addColorStop(0.55, `rgba(${r}, ${gr}, ${bl}, ${pal.darkBlobs ? 0.22 : 0.18})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    const mesh = ctx.createLinearGradient(0, h * 0.6, w, h);
    mesh.addColorStop(0, `rgba(${pal.mesh[0]}, ${pal.mesh[1]}, ${pal.mesh[2]}, 0)`);
    mesh.addColorStop(1, `rgba(${pal.mesh[0]}, ${pal.mesh[1]}, ${pal.mesh[2]}, ${pal.mesh[3]})`);
    ctx.fillStyle = mesh;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = pal.lines;
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = (h / 12) * i + Math.sin(tt + i) * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const v = pal.vignette;
    vignette(ctx, w, h, `rgba(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]})`, 0.2, 0.85);
  },
};

/* ── Aurora — curtains of light over a dark ridge ──────────────────────── */

const AURORA_COLORS = ['#3cffb0', '#22d3ee', '#a78bfa', '#f472b6'];

const aurora = {
  fps: 24,
  maxDpr: 0.75,
  draw({ ctx, w, h, t, cache, parx, pary }) {
    if (!cache.init) {
      const r = rng(11);
      cache.stars = Array.from({ length: 220 }, () => ({
        x: r(), y: r() * 0.8, s: 0.4 + r() * 1.3, p: r() * 6.28, k: 0.4 + r() * 1.8,
      }));
      cache.sprites = AURORA_COLORS.map((col) => {
        const c = layer(1, 256);
        const g = c.getContext('2d');
        const gr = g.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(0.5, rgba(col, 0.22));
        gr.addColorStop(0.9, rgba(col, 0.95));
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 1, 256);
        return c;
      });
      cache.ridgeA = ridge(4, 90, 0.5);
      cache.ridgeB = ridge(9, 70, 0.7);
      cache.init = true;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#01020a');
    sky.addColorStop(0.5, '#06103a');
    sky.addColorStop(1, '#0b1a40');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (const s of cache.stars) {
      const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * s.k + s.p));
      ctx.fillStyle = `rgba(226, 238, 255, ${a * 0.75})`;
      ctx.fillRect(s.x * w + parx * 0.08, s.y * h + pary * 0.05, s.s, s.s);
    }

    ctx.globalCompositeOperation = 'lighter';
    const ribbons = [
      { base: 0.42, amp: 0.08, k: 1.1, sp: 0.16, hgt: 0.42, spr: 0, ph: 0, a: 0.72 },
      { base: 0.56, amp: 0.06, k: 1.6, sp: -0.12, hgt: 0.34, spr: 1, ph: 2.1, a: 0.6 },
      { base: 0.3, amp: 0.07, k: 0.8, sp: 0.09, hgt: 0.28, spr: 2, ph: 4.2, a: 0.62 },
      { base: 0.7, amp: 0.05, k: 2.2, sp: 0.2, hgt: 0.24, spr: 3, ph: 1.3, a: 0.5 },
      { base: 0.84, amp: 0.04, k: 1.3, sp: -0.17, hgt: 0.22, spr: 0, ph: 3.4, a: 0.45 },
    ];
    const step = Math.max(3, Math.round(w / 300));
    for (const rb of ribbons) {
      const spr = cache.sprites[rb.spr];
      for (let x = -step; x < w + step; x += step) {
        const u = x / w;
        const y = h * (rb.base
          + rb.amp * Math.sin(u * rb.k * Math.PI * 2 + t * rb.sp + rb.ph)
          + rb.amp * 0.45 * Math.sin(u * rb.k * 6.1 - t * rb.sp * 1.8)) + pary * 0.3;
        const curtain = h * rb.hgt * (0.55 + 0.45 * Math.sin(u * 15 + t * 0.7 + rb.ph));
        const a = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(u * 8 - t * 0.45 + rb.ph * 1.3), 2);
        ctx.globalAlpha = a * rb.a;
        ctx.drawImage(spr, x + parx * 0.18, y - curtain, step + 1, curtain);
      }
    }
    ctx.globalAlpha = 1;

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, w * 0.75);
    glow.addColorStop(0, 'rgba(60, 255, 176, 0.09)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    fillRidge(ctx, cache.ridgeA, w, h, h * 0.84 + pary * 0.15, h * 0.12, '#050c22');
    fillRidge(ctx, cache.ridgeB, w, h, h * 0.92 + pary * 0.25, h * 0.08, '#02050f');
  },
};

/* ── Synthwave — striped sun, neon ridges, grid floor rushing at you ───── */

const synthwave = {
  fps: 24,
  maxDpr: 1.5,
  draw({ ctx, w, h, t, cache, parx, surface, dpr }) {
    if (!cache.init) {
      const r = rng(23);
      cache.stars = Array.from({ length: 120 }, () => ({ x: r(), y: r() * 0.5, s: 0.5 + r() * 1.2, p: r() * 6.28 }));
      cache.far = ridge(31, 80, 0.8);
      cache.near = ridge(57, 64, 0.9);
      cache.init = true;
    }
    const hy = h * (surface === 'ios' ? 0.62 : 0.6);
    const valley = (u) => Math.pow(Math.min(1, Math.abs(u - 0.5) * 2.2), 1.4) * 0.92 + 0.08;

    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#07011a');
    sky.addColorStop(0.42, '#250742');
    sky.addColorStop(0.78, '#7c1366');
    sky.addColorStop(1, '#ff3d81');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hy + 1);

    for (const s of cache.stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.p));
      ctx.fillStyle = `rgba(255, 220, 255, ${a * 0.8})`;
      ctx.fillRect(s.x * w, s.y * hy, s.s, s.s);
    }

    // sun + glow
    const R = Math.min(w, h) * (surface === 'ios' ? 0.3 : 0.21);
    const cx = w / 2 + parx * 0.2;
    const cy = hy - R * 0.32;
    const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.4);
    halo.addColorStop(0, 'rgba(255, 70, 160, 0.45)');
    halo.addColorStop(1, 'rgba(255, 70, 160, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, hy);

    const size = Math.ceil(R * 2 * dpr);
    if (!cache.sun || cache.sun.width !== size) cache.sun = layer(size, size);
    const sc = cache.sun.getContext('2d');
    sc.setTransform(dpr, 0, 0, dpr, 0, 0);
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, R * 2, R * 2);
    const sg = sc.createLinearGradient(0, 0, 0, R * 2);
    sg.addColorStop(0, '#fff27a');
    sg.addColorStop(0.45, '#ffb347');
    sg.addColorStop(0.75, '#ff4f8b');
    sg.addColorStop(1, '#d6249f');
    sc.fillStyle = sg;
    sc.beginPath();
    sc.arc(R, R, R, 0, Math.PI * 2);
    sc.fill();
    sc.globalCompositeOperation = 'destination-out';
    const drift = (t * 6) % (R * 0.16);
    for (let i = 0; i < 9; i++) {
      const y = R * 0.98 + i * R * 0.16 + drift - R * 0.16;
      const gap = 1.5 + i * 1.35;
      if (y > R * 0.9) sc.fillRect(0, y, R * 2, gap);
    }
    ctx.drawImage(cache.sun, cx - R, cy - R, R * 2, R * 2);

    // ridges
    fillRidge(ctx, cache.far, w, h, hy + 1, h * 0.16, '#2a0752', valley);
    strokeRidge(ctx, cache.far, w, hy + 1, h * 0.16, 'rgba(34, 225, 255, 0.55)', 1.2, valley);
    fillRidge(ctx, cache.near, w, h, hy + 2, h * 0.09, '#14022c', valley);
    strokeRidge(ctx, cache.near, w, hy + 2, h * 0.09, 'rgba(255, 43, 214, 0.85)', 1.5, valley);

    // floor + grid
    const floor = ctx.createLinearGradient(0, hy, 0, h);
    floor.addColorStop(0, '#1b0336');
    floor.addColorStop(1, '#040009');
    ctx.fillStyle = floor;
    ctx.fillRect(0, hy, w, h - hy);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, hy, w, h - hy);
    ctx.clip();
    const vx = w / 2 + parx * 0.2;
    const depth = h - hy;
    const cols = 22;
    const pass = (width, alpha) => {
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(255, 43, 214, ${alpha})`;
      ctx.beginPath();
      for (let i = -cols; i <= cols; i++) {
        ctx.moveTo(vx + i * w * 0.018, hy);
        ctx.lineTo(vx + (i / cols) * w * 3.4, h);
      }
      const phase = (t * 0.55) % 1;
      for (let k = 0; k < 26; k++) {
        const z = k + 1 - phase;
        const f = 1.06 / (1 + z * 0.62);
        const y = hy + depth * f;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    };
    pass(5, 0.12);
    pass(1.3, 0.75);
    ctx.restore();

    const haze = ctx.createLinearGradient(0, hy - 30, 0, hy + 60);
    haze.addColorStop(0, 'rgba(255, 61, 129, 0)');
    haze.addColorStop(0.45, 'rgba(255, 120, 200, 0.55)');
    haze.addColorStop(1, 'rgba(255, 61, 129, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, hy - 30, w, 90);
    vignette(ctx, w, h, 'rgba(5, 0, 15, 0.55)', 0.3, 0.85);
  },
};

/* ── Terminal — phosphor rain behind a CRT glow ────────────────────────── */

const GLYPHS = '0123456789ABCDEF<>/{}[]=+*#$%&capricorn◆◇✦○▣♡◌✧✈◎';

const terminal = {
  fps: 16,
  maxDpr: 1,
  draw({ ctx, w, h, cache, reduced }) {
    const fs = w < 600 ? 13 : 15;
    if (!cache.init) {
      cache.rain = layer(w, h);
      const r = rng(5);
      cache.cols = Math.ceil(w / fs);
      cache.drops = Array.from({ length: cache.cols }, () => ({
        y: -r() * (h / fs) * 1.6, v: 0.3 + r() * 0.7, on: r() < 0.6,
      }));
      cache.init = true;
      // still frames (previews, reduced motion) need rain already on screen
      if (reduced) for (let k = 0; k < 140; k++) stepRain(cache, w, h, fs);
    }
    if (!reduced) stepRain(cache, w, h, fs);

    const base = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.75);
    base.addColorStop(0, '#05260f');
    base.addColorStop(1, '#010502');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(cache.rain, 0, 0, w, h);
    ctx.globalAlpha = 1;
    vignette(ctx, w, h, 'rgba(0, 0, 0, 0.7)', 0.25, 0.8);
  },
};

function stepRain(cache, w, h, fs) {
  const rc = cache.rain.getContext('2d');
  rc.fillStyle = 'rgba(1, 8, 3, 0.13)';
  rc.fillRect(0, 0, w, h);
  rc.font = `${fs}px "JetBrains Mono", ui-monospace, monospace`;
  rc.textBaseline = 'top';
  for (let i = 0; i < cache.cols; i++) {
    const d = cache.drops[i];
    if (!d.on) {
      if (Math.random() < 0.004) d.on = true;
      continue;
    }
    const y = Math.floor(d.y) * fs;
    const x = i * fs;
    rc.fillStyle = '#1fd65f';
    rc.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - fs);
    rc.fillStyle = '#d6ffe2';
    rc.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y);
    d.y += d.v;
    if (y > h && Math.random() > 0.97) {
      d.y = 0;
      d.on = Math.random() < 0.65;
    }
  }
}

/* ── Truck Art — painted rosettes, chevron bands, mirror-work that glints ─ */

const TA = {
  red: '#e4252f', yellow: '#ffc914', green: '#14a85a', teal: '#1fc2b0',
  blue: '#2347c5', pink: '#ff4fa0', orange: '#ff7a1a', white: '#fff8e7', ink: '#111326',
};

function petal(ctx, cx, cy, ang, dist, rx, ry, fill) {
  ctx.save();
  ctx.translate(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = TA.white;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-rx * 0.55, 0);
  ctx.lineTo(rx * 0.55, 0);
  ctx.strokeStyle = 'rgba(17, 19, 38, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function mirror(ctx, x, y, r, mirrors) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#cfe3ff');
  g.addColorStop(1, '#7c8db5');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = TA.ink;
  ctx.stroke();
  mirrors.push({ x, y, r });
}

function chevronBand(ctx, w, y, bh, flip) {
  ctx.fillStyle = TA.red;
  ctx.fillRect(0, y, w, bh);
  const cols = [TA.yellow, TA.green, TA.blue, TA.white, TA.pink, TA.teal];
  const tw = bh * 1.1;
  for (let i = 0, x = 0; x < w + tw; i++, x += tw) {
    ctx.beginPath();
    if (!flip) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + tw, y);
      ctx.lineTo(x + tw / 2, y + bh * 0.82);
    } else {
      ctx.moveTo(x, y + bh);
      ctx.lineTo(x + tw, y + bh);
      ctx.lineTo(x + tw / 2, y + bh * 0.18);
    }
    ctx.closePath();
    ctx.fillStyle = cols[i % cols.length];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = TA.ink;
    ctx.stroke();
  }
  const sy = flip ? y - 7 : y + bh;
  ctx.fillStyle = TA.yellow;
  ctx.fillRect(0, sy, w, 3.5);
  ctx.fillStyle = TA.green;
  ctx.fillRect(0, sy + 3.5, w, 3.5);
}

function buildTruckArt(w, h, dpr) {
  const c = layer(w * dpr, h * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mirrors = [];

  ctx.fillStyle = '#12183a';
  ctx.fillRect(0, 0, w, h);

  const S = Math.max(116, Math.min(176, Math.min(w, h) / 5.2));
  const cols = Math.ceil(w / S) + 1;
  const rows = Math.ceil(h / S) + 1;
  const ox = (w - (cols - 1) * S) / 2;
  const oy = (h - (rows - 1) * S) / 2;
  const fills = [TA.red, TA.yellow];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = ox + i * S;
      const cy = oy + j * S;
      const alt = (i + j) % 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy - S / 2);
      ctx.lineTo(cx + S / 2, cy);
      ctx.lineTo(cx, cy + S / 2);
      ctx.lineTo(cx - S / 2, cy);
      ctx.closePath();
      ctx.fillStyle = alt ? '#1d2a70' : '#3a1258';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = TA.yellow;
      ctx.stroke();

      ctx.beginPath();
      const k = 0.4;
      ctx.moveTo(cx, cy - S * k);
      ctx.lineTo(cx + S * k, cy);
      ctx.lineTo(cx, cy + S * k);
      ctx.lineTo(cx - S * k, cy);
      ctx.closePath();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = alt ? TA.pink : TA.teal;
      ctx.stroke();
      ctx.setLineDash([]);

      for (let d = 0; d < 16; d++) {
        const a = (d / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * S * 0.29, cy + Math.sin(a) * S * 0.29, S * 0.016, 0, Math.PI * 2);
        ctx.fillStyle = d % 2 ? TA.white : TA.yellow;
        ctx.fill();
      }

      for (let p = 0; p < 8; p++) {
        petal(ctx, cx, cy, (p / 8) * Math.PI * 2 + (alt ? 0 : Math.PI / 8), S * 0.165, S * 0.12, S * 0.055, fills[(p + alt) % 2]);
      }
      for (let p = 0; p < 8; p++) {
        petal(ctx, cx, cy, (p / 8) * Math.PI * 2 + Math.PI / 8 + (alt ? 0 : Math.PI / 8), S * 0.1, S * 0.065, S * 0.03, TA.green);
      }
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = alt ? TA.pink : TA.orange;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = TA.white;
      ctx.stroke();
      mirror(ctx, cx, cy, S * 0.032, mirrors);

      // corner flowers where diamonds meet
      const fx = cx + S / 2;
      const fy = cy;
      for (let p = 0; p < 4; p++) {
        petal(ctx, fx, fy, (p / 4) * Math.PI * 2 + Math.PI / 4, S * 0.05, S * 0.05, S * 0.026, TA.teal);
      }
      mirror(ctx, fx, fy, S * 0.02, mirrors);
    }
  }

  const bh = Math.max(26, Math.min(44, h * 0.05));
  chevronBand(ctx, w, 0, bh, false);
  chevronBand(ctx, w, h - bh, bh, true);

  // scalloped valance under the top band, mirror in each scallop
  const sw = bh * 1.1;
  for (let i = 0, x = sw / 2; x < w + sw; i++, x += sw) {
    ctx.beginPath();
    ctx.arc(x, bh + 7, sw / 2, 0, Math.PI);
    ctx.fillStyle = [TA.blue, TA.green, TA.pink, TA.orange][i % 4];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = TA.ink;
    ctx.stroke();
    mirror(ctx, x, bh + 7 + sw * 0.2, sw * 0.12, mirrors);
  }

  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
  vg.addColorStop(0, 'rgba(10, 12, 30, 0.12)');
  vg.addColorStop(1, 'rgba(10, 12, 30, 0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  const r = rng(77);
  mirrors.forEach((m) => { m.p = r() * 6.28; m.k = 0.6 + r() * 1.4; });
  return { canvas: c, mirrors };
}

function glint(ctx, x, y, size, a) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - size, y - size, size * 2, size * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.6, y);
  ctx.lineTo(x + size * 1.6, y);
  ctx.moveTo(x, y - size * 1.6);
  ctx.lineTo(x, y + size * 1.6);
  ctx.stroke();
  ctx.restore();
}

const truckart = {
  fps: 12,
  maxDpr: 2,
  draw({ ctx, w, h, t, cache, dpr }) {
    if (!cache.init) {
      Object.assign(cache, buildTruckArt(w, h, dpr));
      cache.init = true;
    }
    ctx.drawImage(cache.canvas, 0, 0, w, h);
    for (const m of cache.mirrors) {
      const s = Math.pow(Math.max(0, Math.sin(t * m.k + m.p)), 14);
      if (s > 0.02) glint(ctx, m.x, m.y, m.r * 2.2, s * 0.95);
    }
  },
};

/* ── Mughal — lapis khatam tiles, light running across the gold ────────── */

function starPath(ctx, cx, cy, a) {
  // 8-point khatam: union of two squares (one turned 45°)
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 ? a * 0.76 : a;
    pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function buildMughal(w, h, dpr) {
  const base = layer(w * dpr, h * dpr);
  const gold = layer(w * dpr, h * dpr);
  const b = base.getContext('2d');
  const g = gold.getContext('2d');
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bg = b.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b2150');
  bg.addColorStop(1, '#071637');
  b.fillStyle = bg;
  b.fillRect(0, 0, w, h);

  const S = Math.max(74, Math.min(118, Math.min(w, h) / 8));
  const cols = Math.ceil(w / S) + 2;
  const rows = Math.ceil(h / S) + 2;
  const ox = (w - (cols - 1) * S) / 2;
  const oy = (h - (rows - 1) * S) / 2;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = ox + i * S;
      const cy = oy + j * S;

      starPath(b, cx, cy, S * 0.5);
      b.fillStyle = (i + j) % 2 ? '#127e78' : '#0f6e86';
      b.fill();
      starPath(g, cx, cy, S * 0.5);
      g.lineWidth = 1.6;
      g.strokeStyle = '#d9b45a';
      g.stroke();

      starPath(b, cx, cy, S * 0.3);
      b.fillStyle = '#0a1f4d';
      b.fill();
      starPath(g, cx, cy, S * 0.3);
      g.lineWidth = 1.2;
      g.strokeStyle = '#e8c878';
      g.stroke();

      b.beginPath();
      b.arc(cx, cy, S * 0.085, 0, Math.PI * 2);
      b.fillStyle = '#efe4c8';
      b.fill();
      g.beginPath();
      g.arc(cx, cy, S * 0.085, 0, Math.PI * 2);
      g.lineWidth = 1.2;
      g.strokeStyle = '#d9b45a';
      g.stroke();

      // ivory cross-tile in the gap between four stars
      const qx = cx + S / 2;
      const qy = cy + S / 2;
      const q = S * 0.16;
      b.beginPath();
      b.moveTo(qx, qy - q);
      b.lineTo(qx + q, qy);
      b.lineTo(qx, qy + q);
      b.lineTo(qx - q, qy);
      b.closePath();
      b.fillStyle = '#e9dcbc';
      b.fill();
      g.beginPath();
      g.moveTo(qx, qy - q);
      g.lineTo(qx + q, qy);
      g.lineTo(qx, qy + q);
      g.lineTo(qx - q, qy);
      g.closePath();
      g.lineWidth = 1.2;
      g.strokeStyle = '#d9b45a';
      g.stroke();
    }
  }

  b.drawImage(gold, 0, 0, w, h);
  const vg = b.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.15, w / 2, h * 0.45, Math.max(w, h) * 0.78);
  vg.addColorStop(0, 'rgba(255, 240, 200, 0.06)');
  vg.addColorStop(1, 'rgba(2, 6, 20, 0.62)');
  b.fillStyle = vg;
  b.fillRect(0, 0, w, h);

  return { base, gold, sheen: layer(w * dpr, h * dpr) };
}

const mughal = {
  fps: 15,
  maxDpr: 1.25,
  draw({ ctx, w, h, t, cache, dpr, reduced }) {
    if (!cache.init) {
      Object.assign(cache, buildMughal(w, h, dpr));
      cache.init = true;
    }
    ctx.drawImage(cache.base, 0, 0, w, h);
    if (reduced) return;
    // a band of light sweeps across the gold lattice only
    const sc = cache.sheen.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, cache.sheen.width, cache.sheen.height);
    sc.drawImage(cache.gold, 0, 0);
    sc.globalCompositeOperation = 'source-in';
    const span = (w + h) * dpr;
    const p = ((t * 0.07) % 1.6 - 0.3) * span;
    const grad = sc.createLinearGradient(p - span * 0.18, 0, p + span * 0.18, span * 0.35);
    grad.addColorStop(0, 'rgba(255, 236, 170, 0)');
    grad.addColorStop(0.5, 'rgba(255, 246, 210, 0.95)');
    grad.addColorStop(1, 'rgba(255, 236, 170, 0)');
    sc.fillStyle = grad;
    sc.fillRect(0, 0, cache.sheen.width, cache.sheen.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(cache.sheen, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  },
};

/* ── Paper — newsprint fibre, halftone, a red ink stamp ────────────────── */

const paper = {
  fps: 0,
  maxDpr: 2,
  draw({ ctx, w, h }) {
    ctx.fillStyle = '#f3f0e8';
    ctx.fillRect(0, 0, w, h);
    const r = rng(3);
    ctx.lineWidth = 0.7;
    for (let i = 0; i < Math.min(5000, (w * h) / 300); i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI;
      const l = 2 + r() * 7;
      ctx.strokeStyle = `rgba(60, 50, 35, ${0.025 + r() * 0.03})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(17, 17, 17, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 4) * i, 0);
      ctx.lineTo((w / 4) * i, h);
      ctx.stroke();
    }

    const hx = w * 0.92;
    const hy = h * 0.88;
    const maxR = Math.min(w, h) * 0.55;
    const step = 9;
    ctx.fillStyle = 'rgba(17, 17, 17, 0.11)';
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const d = Math.hypot(x - hx, y - hy) / maxR;
        if (d >= 1) continue;
        ctx.beginPath();
        ctx.arc(x, y, (1 - d) * step * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const sx = w * 0.12;
    const sy = h * 0.8;
    const sr = Math.min(w, h) * 0.085;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.21);
    ctx.strokeStyle = 'rgba(179, 38, 30, 0.32)';
    ctx.fillStyle = 'rgba(179, 38, 30, 0.32)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, sr * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${sr * 0.24}px Georgia, serif`;
    ctx.fillText('ON DEVICE', 0, -sr * 0.2);
    ctx.font = `700 ${sr * 0.17}px Georgia, serif`;
    ctx.fillText('★ CAPRICORN ★', 0, sr * 0.16);
    ctx.font = `${sr * 0.13}px Georgia, serif`;
    ctx.fillText('NO CLOUD · NO ADS', 0, sr * 0.42);
    ctx.restore();
  },
};

/* ── Pixel 95 — dithered teal sky, chunky clouds drifting by ───────────── */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function buildPixelSky(w, h) {
  const px = 4;
  const lw = Math.ceil(w / px);
  const lh = Math.ceil(h / px);
  const c = layer(lw, lh);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(lw, lh);
  const top = [16, 132, 131];
  const bot = [8, 86, 96];
  for (let y = 0; y < lh; y++) {
    const f = y / lh;
    for (let x = 0; x < lw; x++) {
      const thr = BAYER[(y % 4) * 4 + (x % 4)] / 16;
      const pick = f > thr * 0.9 + 0.05 ? bot : top;
      const i = (y * lw + x) * 4;
      img.data[i] = pick[0];
      img.data[i + 1] = pick[1];
      img.data[i + 2] = pick[2];
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const CLOUD = [
  '....XXXX........',
  '..XXXXXXXX..XX..',
  '.XXXXXXXXXXXXXX.',
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  '.oooooooooooooo.',
];

const pixel = {
  fps: 10,
  maxDpr: 2,
  draw({ ctx, w, h, t, cache }) {
    if (!cache.init) {
      cache.sky = buildPixelSky(w, h);
      const r = rng(19);
      cache.clouds = Array.from({ length: 6 }, (_, i) => ({
        x: r() * w, y: (0.08 + r() * 0.62) * h, s: 6 + ((r() * 3) | 0) * 2, v: 4 + r() * 10, i,
      }));
      cache.init = true;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cache.sky, 0, 0, w, h);
    for (const cl of cache.clouds) {
      const cw = CLOUD[0].length * cl.s;
      const x = ((cl.x + t * cl.v) % (w + cw * 2)) - cw;
      const sx = Math.round(x / cl.s) * cl.s;
      const sy = Math.round(cl.y / cl.s) * cl.s;
      CLOUD.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const ch = row[rx];
          if (ch === '.') continue;
          ctx.fillStyle = ch === 'o' ? '#b9d4d6' : '#ffffff';
          ctx.fillRect(sx + rx * cl.s, sy + ry * cl.s, cl.s, cl.s);
        }
      });
    }
    ctx.imageSmoothingEnabled = true;
  },
};

/* ── Brutal — raw grid, a yellow block, type too big to fit ────────────── */

const brutal = {
  fps: 0,
  maxDpr: 2,
  draw({ ctx, w, h, surface }) {
    ctx.fillStyle = '#f1efe8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.lineWidth = 1;
    const g = w < 600 ? 48 : 96;
    for (let x = 0; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }

    const bx = w * 0.6;
    const by = h * 0.1;
    const bw = w * 0.32;
    const bhh = h * 0.36;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(bx + 12, by + 12, bw, bhh);
    ctx.fillStyle = '#ffe500';
    ctx.fillRect(bx, by, bw, bhh);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a0a0a';
    ctx.strokeRect(bx, by, bw, bhh);

    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(w * 0.16, h * 0.74, Math.min(w, h) * 0.13, 0, Math.PI * 2);
    ctx.fill();

    const fsz = Math.min(h * (surface === 'ios' ? 0.3 : 0.46), w * 0.42);
    ctx.font = `900 ${fsz}px "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0a0a0a';
    ctx.fillText('CAP', w * 1.02, h * 1.06);

    ctx.save();
    ctx.translate(18, h * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText('CAPRICORN OS — SOVEREIGN SOFTWARE — NO CLOUD — NO ADS', 0, 0);
    ctx.restore();
  },
};

const PAINTERS = {
  'capricorn-light': capricorn,
  'capricorn-dark': capricorn,
  aurora,
  synthwave,
  terminal,
  truckart,
  mughal,
  paper,
  pixel,
  brutal,
};

export function painterFor(skin) {
  return PAINTERS[skin] || capricorn;
}

/* ── engine ────────────────────────────────────────────────────────────── */

export function initWallpaper(canvas, { surface = 'desktop' } = {}) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const t0 = performance.now();
  let raf = 0;
  let last = 0;
  let mx = 0.5;
  let my = 0.4;
  let skin = getSkin();
  let painter = painterFor(skin);
  let cache = {};
  let dpr = 1;
  let dirty = true;
  let w = 0;
  let h = 0;
  // Perf governor: if the whole page renders slowly (wallpaper behind many
  // glass panels on a weak GPU), step resolution and frame rate down.
  let quality = 1;
  let frames = [];
  let lastTune = performance.now();

  const visible = () => !document.hidden && canvas.isConnected && canvas.getClientRects().length > 0;

  function resize(e) {
    w = window.innerWidth;
    h = window.innerHeight;
    const cap = (coarse ? Math.min(painter.maxDpr, 1.5) : painter.maxDpr) * quality;
    dpr = Math.max(0.4, Math.min(window.devicePixelRatio || 1, cap));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    cache = {};
    dirty = true;
    if (e && canvas.getClientRects().length) draw();
  }

  function draw(now = performance.now()) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const parx = (mx - 0.5) * (surface === 'ios' ? 22 : 30);
    const pary = (my - 0.5) * (surface === 'ios' ? 16 : 20);
    painter.draw({
      ctx, w, h, dpr, surface, reduced, cache, parx, pary,
      t: reduced ? 12 : (now - t0) / 1000,
      mode: getSkinDef(skin).mode,
    });
    dirty = false;
  }

  function govern(now) {
    frames.push(now);
    if (frames.length > 90) frames.shift();
    if (now - lastTune < 3000 || frames.length < 60 || quality <= 0.45) return;
    const avg = (frames[frames.length - 1] - frames[0]) / (frames.length - 1);
    if (avg > 45) {
      quality = Math.max(0.45, quality * 0.7);
      lastTune = now;
      frames = [];
      resize();
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible()) { frames = []; return; }
    const animated = painter.fps > 0 && !reduced;
    if (animated) govern(now);
    const fps = Math.max(6, painter.fps * (quality < 1 ? quality : 1));
    if (dirty || (animated && now - last >= 1000 / fps)) {
      last = now;
      draw(now);
    }
  }

  const onTheme = (e) => {
    const next = e.detail?.skin || getSkin();
    const prevDpr = painter.maxDpr;
    skin = next;
    painter = painterFor(next);
    quality = 1;
    frames = [];
    if (painter.maxDpr !== prevDpr) resize();
    cache = {};
    // synchronous so a View Transition snapshot captures the new wallpaper
    if (canvas.getClientRects().length) draw();
    else dirty = true;
  };

  const onPointer = (x, y) => {
    mx = x / window.innerWidth;
    my = y / window.innerHeight;
  };
  const onMouse = (e) => onPointer(e.clientX, e.clientY);
  const onTouch = (e) => {
    const p = e.touches[0];
    if (p) onPointer(p.clientX, p.clientY);
  };

  document.addEventListener('cap:theme', onTheme);
  window.addEventListener('mousemove', onMouse, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  window.addEventListener('resize', resize);

  resize();
  // first frame regardless of tab visibility (background tabs, previews)
  if (canvas.getClientRects().length) draw();
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('cap:theme', onTheme);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('touchmove', onTouch);
    window.removeEventListener('resize', resize);
  };
}

/** Paint one still frame of a skin into a small canvas (Appearance previews). */
export function paintPreview(canvas, skinId, { surface = 'desktop', t = 8 } = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  // Painters lay out for a full screen; render at a virtual screen size then scale.
  const vw = surface === 'ios' ? 390 : 1280;
  const vh = surface === 'ios' ? 844 : 800;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = Math.max(w / vw, h / vh) * dpr;
  ctx.setTransform(scale, 0, 0, scale, (w * dpr - vw * scale) / 2, (h * dpr - vh * scale) / 2);
  const def = getSkinDef(skinId);
  painterFor(skinId).draw({
    ctx, w: vw, h: vh, dpr: Math.max(1, scale), surface, reduced: true, cache: {}, parx: 0, pary: 0, t, mode: def.mode,
  });
}
