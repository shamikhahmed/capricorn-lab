export function initWallpaper(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;
  let raf = 0;
  let mx = 0.5;
  let my = 0.4;
  let theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  const palettes = {
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
    },
  };

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
    const parx = (mx - 0.5) * 30;
    const pary = (my - 0.5) * 20;
    const pal = palettes[theme];

    const base = ctx.createLinearGradient(0, 0, vw, vh);
    base.addColorStop(0, pal.base[0]);
    base.addColorStop(0.45, pal.base[1]);
    base.addColorStop(1, pal.base[2]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, vw, vh);

    pal.blobs.forEach((b, i) => {
      const ox = Math.sin(t * b.speed + i) * 0.04;
      const oy = Math.cos(t * b.speed * 0.8 + i * 1.3) * 0.03;
      const cx = (b.x + ox) * vw + parx * 0.3;
      const cy = (b.y + oy) * vh + pary * 0.3;
      const radius = b.r * Math.max(vw, vh);

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const [r, gr, bl] = b.color;
      g.addColorStop(0, `rgba(${r}, ${gr}, ${bl}, ${theme === 'dark' ? 0.65 : 0.55})`);
      g.addColorStop(0.55, `rgba(${r}, ${gr}, ${bl}, ${theme === 'dark' ? 0.22 : 0.18})`);
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
  }

  function loop() {
    if (!reduced) t += 0.004;
    draw();
    raf = requestAnimationFrame(loop);
  }

  document.addEventListener('cap:theme', (e) => {
    theme = e.detail.theme === 'dark' ? 'dark' : 'light';
    draw();
  });

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  });

  resize();
  draw();
  if (!reduced) loop();
  window.addEventListener('resize', resize);

  return () => cancelAnimationFrame(raf);
}
