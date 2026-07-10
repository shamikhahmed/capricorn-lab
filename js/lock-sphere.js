import * as THREE from 'three';
import { APPS, SYSTEM } from './products.js';

function loadTexture(url, fallbackColor = '#c9a227', fallbackUrl = null) {
  return new Promise((resolve) => {
    const finish = (img, src) => {
      const size = 512;
      const pad = 0.82; // leave room for the baked shadow
      const light = document.documentElement.dataset.theme !== 'dark';

      // Stage 1: draw the raw mark; punch out black plates on PNG fallbacks only
      // (SVG marks are already transparent — punching would eat baked shadows).
      const stage = document.createElement('canvas');
      stage.width = size;
      stage.height = size;
      const sctx = stage.getContext('2d');
      const scale = Math.min(size / img.width, size / img.height) * pad;
      const w = img.width * scale;
      const h = img.height * scale;
      sctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      if (src && /\.png$/i.test(src)) {
        const data = sctx.getImageData(0, 0, size, size);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
          if (lum < 22) px[i + 3] = 0;
        }
        sctx.putImageData(data, 0, 0);
      }

      // Stage 2: composite with a soft grounding shadow so thin strokes
      // stay legible on the cream light-theme wallpaper. No plates, no borders.
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      ctx.shadowColor = light ? 'rgba(20, 16, 8, 0.5)' : 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = light ? 26 : 18;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(stage, 0, 0);
      // second pass thickens hairline strokes slightly without a visible border
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(stage, 0, 0);
      ctx.globalAlpha = 1;

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      resolve(tex);
    };

    const failTile = () => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = fallbackColor;
      ctx.beginPath();
      ctx.arc(64, 64, 40, 0, Math.PI * 2);
      ctx.fill();
      resolve(new THREE.CanvasTexture(c));
    };

    const tryUrl = (src, next) => {
      if (!src) { next(); return; }
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => finish(img, src);
      img.onerror = next;
      img.src = src;
    };

    const chain = [];
    const push = (u) => {
      if (!u || chain.includes(u)) return;
      chain.push(u);
      if (u.endsWith('.svg')) chain.push(u.replace(/\.svg$/i, '.png'));
    };
    push(url);
    push(fallbackUrl);

    let i = 0;
    const next = () => {
      if (i >= chain.length) { failTile(); return; }
      tryUrl(chain[i++], next);
    };
    next();
  });
}

/**
 * Medium U-menu: top-down ellipse, Capricorn center, Cap marks orbit.
 * No floor mirrors. Aspect-aware scale.
 */
export function initLockSphere(canvas, {
  reduced = false,
  onSelectApp = null,
} = {}) {
  // Returns a cleanup fn, or null when WebGL is unavailable / disabled —
  // callers use null to fall back to the CSS carousel with full interactivity.
  if (!canvas) return null;

  const params = new URLSearchParams(location.search);
  if (params.get('three') === '0') {
    canvas.hidden = true;
    return null;
  }

  canvas.hidden = false;
  canvas.style.opacity = '0';
  canvas.style.background = 'transparent';
  canvas.style.border = 'none';
  canvas.style.outline = 'none';
  canvas.style.boxShadow = 'none';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    canvas.hidden = true;
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  // High + slightly forward → clear ellipse (not flat icon row)
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 4.4, 2.6);
  camera.lookAt(0, 0, 0);

  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const ring = new THREE.Group();
  root.add(ring);

  // Medium ellipse on XZ
  const RX = 1.3;
  const RZ = 1.0;
  const ICON = 0.3;
  const LOGO = 0.86;
  const sprites = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const _wp = new THREE.Vector3();

  let dead = false;
  let raf = 0;
  let spin = 0.2;
  let spinVel = reduced ? 0 : 0.3;
  let dragging = false;
  let lastX = 0;
  let selected = -1;
  let lastFrame = performance.now();
  const lockEl = canvas.closest('.lock-screen');

  const fitRoot = (w, h) => {
    const aspect = w / Math.max(1, h);
    // Scale the whole cluster so the ring's widest projection stays inside
    // the viewport with margin — narrow phones would otherwise clip the
    // left/right marks (front-of-ring sprites project wider than RX).
    const fitScale = THREE.MathUtils.clamp((aspect - 0.3) * 0.62, 0.42, 0.7);
    const mobile = aspect < 0.75;
    root.scale.setScalar(mobile ? Math.min(fitScale, 0.52) : fitScale);
    root.position.set(0, mobile ? 0.95 : 0.85, 0);
  };

  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    if (w < 2 || h < 2) return false;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitRoot(w, h);
    return true;
  };

  const setSelected = (i, fromTap = false) => {
    selected = i;
    if (i >= 0) onSelectApp?.(APPS[i], i, fromTap);
    else onSelectApp?.(null, -1, fromTap);
  };

  const pick = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(sprites, false)[0]?.object ?? null;
  };

  let downX = 0;
  let downY = 0;
  const onPointerDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    downX = e.clientX;
    downY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  let hoverAt = 0;
  const onPointerMove = (e) => {
    if (!dragging) {
      // Hover-pick (throttled) — whisper without needing a tap on desktop
      const now = performance.now();
      if (now - hoverAt > 120) {
        hoverAt = now;
        const hit = pick(e.clientX, e.clientY);
        canvas.style.cursor = hit ? 'pointer' : '';
        const i = hit ? hit.userData.appI : -1;
        if (i !== selected) setSelected(i);
      }
      return;
    }
    spinVel = (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
    spin += spinVel;
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    // Tap = barely any pointer travel (spinVel is nonzero even at rest
    // because of the auto-spin cruise, so it can't gate taps).
    const travel = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (travel < 6) {
      const hit = pick(e.clientX, e.clientY);
      if (hit) {
        const i = hit.userData.appI;
        setSelected(selected === i ? -1 : i, true);
      }
    }
    if (!reduced) spinVel = THREE.MathUtils.clamp(spinVel, -0.65, 0.65);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  const tick = () => {
    if (dead) return;
    if (!resize()) {
      raf = requestAnimationFrame(tick);
      return;
    }
    const nowMs = performance.now();
    const dt = Math.min(0.05, (nowMs - lastFrame) / 1000);
    lastFrame = nowMs;
    if (!reduced) {
      if (!dragging) {
        spinVel += (0.24 - spinVel) * 0.03;
        spin += spinVel * dt;
      } else spinVel *= 0.88;
    }
    ring.rotation.y = spin;

    // Perspective depth: normalize against the ring's actual near/far each
    // frame so the front mark always hits full size and the back one always
    // recedes — this is what sells the U-menu as 3D at any scale/aspect.
    const camPos = camera.position;
    let dMin = Infinity;
    let dMax = -Infinity;
    sprites.forEach((s) => {
      const d = s.getWorldPosition(_wp).distanceTo(camPos);
      s.userData.dist = d;
      if (d < dMin) dMin = d;
      if (d > dMax) dMax = d;
    });
    const span = Math.max(0.001, dMax - dMin);
    sprites.forEach((s) => {
      const t = 1 - (s.userData.dist - dMin) / span; // 1 = front, 0 = back
      const base = s.userData.appI === selected ? ICON * 1.35 : ICON;
      s.scale.setScalar(base * (0.52 + t * 0.78));
      s.material.opacity = 0.3 + t * 0.7;
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  Promise.all([
    loadTexture(SYSTEM.logo, '#c9a227'),
    ...APPS.map((a) => loadTexture(a.mark || a.icon, a.accent, a.icon)),
  ]).then(([logoTex, ...appTex]) => {
    if (dead) {
      logoTex.dispose();
      appTex.forEach((t) => t.dispose());
      return;
    }

    const logo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: logoTex,
      transparent: true,
      depthWrite: false,
    }));
    logo.scale.set(LOGO, LOGO, 1);
    logo.position.set(0, 0.02, 0);
    root.add(logo);

    APPS.forEach((app, i) => {
      const angle = (i / APPS.length) * Math.PI * 2 - Math.PI / 2;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: appTex[i],
        transparent: true,
        depthWrite: false,
      }));
      sprite.position.set(
        Math.cos(angle) * RX,
        0.02,
        Math.sin(angle) * RZ,
      );
      sprite.scale.setScalar(ICON);
      sprite.userData.appI = i;
      sprite.userData.app = app;
      ring.add(sprite);
      sprites.push(sprite);
    });

    // Reveal here (not in tick): rAF is throttled on hidden tabs, and the
    // canvas must not stay invisible when the tab becomes visible again.
    if (resize()) renderer.render(scene, camera);
    canvas.style.transition = 'opacity 0.45s ease';
    canvas.style.opacity = '1';
    lockEl?.classList.add('lock-screen--three');
    raf = requestAnimationFrame(tick);
  }).catch(() => {
    canvas.hidden = true;
    lockEl?.classList.remove('lock-screen--three');
  });

  raf = requestAnimationFrame(tick);

  return () => {
    dead = true;
    cancelAnimationFrame(raf);
    lockEl?.classList.remove('lock-screen--three');
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
      }
    });
    renderer.dispose();
  };
}
