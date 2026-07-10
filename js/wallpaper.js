const DESKTOP_PALETTES = {
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
};

const IOS_PALETTE = {
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
};

export function initWallpaper(canvas, { surface = 'desktop', art = false } = {}) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;
  let raf = 0;
  let mx = 0.5;
  let my = 0.4;
  let theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  const stars = art ? Array.from({ length: 120 }, (_, i) => ({
    x: ((i * 47) % 100) / 100,
    y: ((i * 83) % 100) / 100,
    r: 0.6 + (i % 5) * 0.35,
    a: 0.15 + (i % 7) * 0.08,
    tw: 0.4 + (i % 11) * 0.15,
  })) : [];

  function palette() {
    if (surface === 'ios') return IOS_PALETTE;
    return DESKTOP_PALETTES[theme];
  }

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function draw() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const parx = (mx - 0.5) * (surface === 'ios' ? 22 : 30);
    const pary = (my - 0.5) * (surface === 'ios' ? 16 : 20);
    const pal = palette();
    const blobDark = pal.darkBlobs ?? theme === 'dark';

    const base = ctx.createLinearGradient(0, 0, vw, vh);
    base.addColorStop(0, pal.base[0]);
    base.addColorStop(0.45, pal.base[1]);
    base.addColorStop(1, pal.base[2]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, vw, vh);

    pal.blobs.forEach((b, i) => {
      const ox = Math.sin(t * b.speed + i) * 0.04;
      const oy = Math.cos(t * b.speed * 0.8 + i * 1.3) * 0.03;
      const cx = (b.x + ox) * vw + parx * 0.35;
      const cy = (b.y + oy) * vh + pary * 0.35;
      const radius = b.r * Math.max(vw, vh);

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const [r, gr, bl] = b.color;
      g.addColorStop(0, `rgba(${r}, ${gr}, ${bl}, ${blobDark ? 0.65 : 0.55})`);
      g.addColorStop(0.55, `rgba(${r}, ${gr}, ${bl}, ${blobDark ? 0.22 : 0.18})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);
    });

    if (!reduced) {
      const mesh = ctx.createLinearGradient(0, vh * 0.6, vw, vh);
      mesh.addColorStop(0, `rgba(${pal.mesh[0]}, ${pal.mesh[1]}, ${pal.mesh[2]}, 0)`);
      mesh.addColorStop(1, `rgba(${pal.mesh[0]}, ${pal.mesh[1]}, ${pal.mesh[2]}, ${pal.mesh[3]})`);
      ctx.fillStyle = mesh;
      ctx.fillRect(0, 0, vw, vh);

      ctx.strokeStyle = pal.lines;
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = (vh / 12) * i + Math.sin(t + i) * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(vw, y);
        ctx.stroke();
      }
    }

    const vignette = ctx.createRadialGradient(vw / 2, vh / 2, vh * 0.2, vw / 2, vh / 2, vh * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, `rgba(${pal.vignette[0]}, ${pal.vignette[1]}, ${pal.vignette[2]}, ${pal.vignette[3]})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, vw, vh);

    if (art) drawLockArt(vw, vh, parx, pary);
  }

  function drawLockArt(vw, vh, parx, pary) {
    const cx = vw / 2 + parx * 0.5;
    const cy = vh * 0.38 + pary * 0.5;
    const gold = theme === 'dark' || surface === 'ios' ? [201, 162, 39] : [150, 120, 30];

    stars.forEach((s, i) => {
      const sx = s.x * vw + parx * (0.2 + (i % 3) * 0.1);
      const sy = s.y * vh + pary * (0.2 + (i % 4) * 0.08);
      const pulse = reduced ? 1 : 0.7 + Math.sin(t * s.tw + i) * 0.3;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 252, 240, ${s.a * pulse})`;
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = `rgba(${gold[0]}, ${gold[1]}, ${gold[2]}, 0.12)`;
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 3; ring++) {
      const radius = ring * Math.min(vw, vh) * 0.14 + Math.sin(t + ring) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(${gold[0]}, ${gold[1]}, ${gold[2]}, 0.08)`;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + t * 0.15;
      const r1 = Math.min(vw, vh) * 0.08;
      const r2 = Math.min(vw, vh) * 0.22;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
  }

  function loop() {
    if (!reduced) t += 0.004;
    draw();
    raf = requestAnimationFrame(loop);
  }

  const onTheme = (e) => {
    if (surface === 'ios') return;
    theme = e.detail.theme === 'dark' ? 'dark' : 'light';
    draw();
  };
  document.addEventListener('cap:theme', onTheme);

  const onPointer = (x, y) => {
    mx = x / window.innerWidth;
    my = y / window.innerHeight;
  };

  const onMouse = (e) => onPointer(e.clientX, e.clientY);
  const onTouch = (e) => {
    const t0 = e.touches[0];
    if (t0) onPointer(t0.clientX, t0.clientY);
  };

  window.addEventListener('mousemove', onMouse);
  window.addEventListener('touchmove', onTouch, { passive: true });

  resize();
  draw();
  if (!reduced) loop();
  window.addEventListener('resize', resize);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('cap:theme', onTheme);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('touchmove', onTouch);
  };
}
