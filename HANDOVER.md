# Capricorn OS (capricorn-lab) — HANDOVER

**Canonical hub source (D-13).** Version **1.0.0**. Deploy: `npm run deploy:hub` → `../shamikhahmed.github.io`.

Live: https://shamikhahmed.github.io/


# Capricorn Lab — Handover

**Repo:** `/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab`  
**Version:** `0.10.1`  
**Status:** **Live on hub** — [shamikhahmed.github.io](https://shamikhahmed.github.io/) = Capricorn OS v0.10.1 (deployed 2026-07-10).

---

## What this is

Capricorn OS = browser fake macOS desktop + iOS home. Site **is** the device. Ten Cap apps, sovereignty story, widgets, dock, draggable windows.

---

## Run

```bash
cd /Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab
npm install && npm run dev
# → http://localhost:4321 (or PORT=4322 npm run dev)
```

| URL | Mode |
|-----|------|
| `/` | Auto: ≤768px = iOS |
| `/?view=desktop` | macOS at **any** width |
| `/?view=mobile` | iOS at any width |
| `/?view=desktop&pitch=1` | Desktop + Applications window on load |
| `/?nolock=1` | Skip lock screen (dev/QA) |
| `/?lock=1` | Force lock screen even if session unlocked |
| `/?boot=full` | Full BIOS boot after lock (desktop) |
| `/?three=0` | Disable Three.js lock carousel (CSS orbit fallback) |

Safari: `open -a Safari 'http://localhost:4321/?view=desktop&lock=1'`

---

## Lock screen (current — v0.10.1)

**Flow:** lock → unlock → OS (desktop: quick boot; iOS: home). Session skip via `sessionStorage` only — **no** “Remember this device”.

**Layout (three bands):**
1. Time / date (top)
2. Stage — Capricorn logo + 10 Cap **marks** orbiting (Three.js)
3. Copy — Capricorn Systems / Capricorn OS / tagline / 0-bytes proof / Unlock

**Three.js (`js/lock-sphere.js`, dep `three`):**
- Dynamic import (code-split chunk)
- Full-bleed transparent canvas (no mid-screen white “picture box”)
- Top-down ellipse: Capricorn center, marks on `RX`/`RZ` ring, drag + auto spin
- Tap mark → whisper (name + hook)
- Canvas opacity 0 until first good frame
- Aspect-aware scale (mobile smaller / higher)
- `?three=0` → hide WebGL, show CSS 3D carousel fallback
- Marks: `assets/marks/*.svg` (incl. SoulCap + TravelCap)

**Also:** sovereignty proof pulse, unlock bloom, menubar + iOS **Lock** buttons + Apple menu “Lock Screen…”  
**No lock ambient drone** — constant Web Audio hum removed (0.10.1). Unlock SFX only.

**Removed (do not bring back without ask):** remember-device checkbox, Face ID/PIN, screenshot glass, SVG constellation lines, pitch/stats/founder on lock, app-icon plates/borders on orbit marks, lock ambient drone.

Files: `js/lock-screen.js`, `js/lock-sphere.js`, `css/lock-screen.css`, `js/sounds.js`, `#lockScreen` in `index.html`.

---

## What shipped (through v0.10.1)

| Area | Done |
|------|------|
| **Lock** | Three.js U-menu (depth, hover+tap whisper, mobile fit) + CSS fallback; session-only unlock; `?nolock` / `?lock` / `?three=0` / `?boot=full` |
| **10 apps** | Dock, widgets, iOS grid; marks for all 10 |
| **Widgets** | Hero + CTA; layout heights; clock sovereignty proof |
| **Tasks** | 17 tasks; desktop + iOS |
| **Dock** | Floating pill; tip above; magnify |
| **Windows** | Real PNG screenshots (8); Travel/Soul WIP; **live demos** (Vault count-up, Pulse ring, Prism playable) |
| **Desktop extras** | Right-click menu · notification center (clock) · wallpaper picker (CC) · Mission Control (F3/⌃↑) · screensaver (75s) · `sovereignty` egg · `?tour=1` · certificate download |
| **Type** | JetBrains Mono (local) for terminal/numbers |
| **Mobile** | iOS 3 pages; dock 10 apps |
| **Theme** | Light/dark · OG/social meta (`assets/og.png`) |

Full history: [CHANGELOG.md](./CHANGELOG.md)

---

## Key files

| File | Role |
|------|------|
| `js/products.js` | `APPS`, `SOCIAL`, `TASKS`, `SYSTEM`, marks/icons |
| `js/desktop-extras.js` | Context menu, notify center, screensaver, Mission Control, tour, egg |
| `js/app-demos.js` | Live window demos (Vault / Pulse / Prism game) |
| `js/lock-screen.js` | Lock HTML/layout, swipe, whisper, Three import |
| `js/lock-sphere.js` | Three.js carousel (U-menu) |
| `js/main.js` | Bootstrap, relock, view mode |
| `js/sounds.js` | SFX (click / unlock / etc.) — no lock drone |
| `js/widgets.js` | Widgets + layout |
| `js/dock.js` | Dock magnify |
| `css/lock-screen.css` | Lock + `lock-screen--three` bands |
| `assets/marks/*.svg` | Borderless Cap marks for orbit |

---

## Agent prompts

| Prompt | Use |
|--------|-----|
| [PLOT_MASTER_PROMPT.md](./PLOT_MASTER_PROMPT.md) | Full site audit |
| [LOCK_FABLE_PROMPT.md](./LOCK_FABLE_PROMPT.md) | **Claude Code / Fable** — lock Three.js fix + polish only |

Brain: `~/Capricorn-Brain/01 Projects/capricorn-lab.md`

---

## QA checklist

Last lock visual pass **2026-07-10 (v0.9.9)** — Fable polish shipped; success criteria met.

- [x] Fresh tab → lock → unlock → OS (desktop + iOS)
- [x] No remember-device; Lock button returns to lock
- [x] Three.js: Capricorn center + 10 marks; no white canvas box
- [x] **Depth reads as 3D** — front mark full size/bright, back recedes (dynamic near/far)
- [x] **Light theme** — marks legible on cream (baked soft shadow, no plates)
- [x] **Mobile 390×844** — ring inside viewport, clear of copy, no icon pile
- [x] **Drag rotates · tap mark → whisper** (travel-gated tap fix)
- [x] `?three=0` → CSS orbit fallback **with** tilt + whisper
- [x] No iOS status bleed over lock (`.ios:not([hidden])` restored)
- [x] Widget CTAs 0-clipped desktop 1440×900 · console 0 errors

---

## Still WIP (by design)

- TravelCap / SoulCap: `wip: true`, no screenshots
- Hub deploy of 0.10.1 — **done** 2026-07-10 (`762520d`); backup `backup/pre-capricorn-os-live-2026-07-10-v0101`

---

## Do not

- Push hub / force-push main without ask
- Re-add remember-device or Face ID/PIN
- Put rounded app-icon plates back on orbit marks
- Mid-screen opaque canvas “picture frame”
