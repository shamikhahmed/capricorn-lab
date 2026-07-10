# LOCK FABLE PROMPT — Capricorn OS lock carousel

> Paste into **Claude Code (Fable)** or Cursor. Scope: **lock screen Three.js only**.  
> Do **not** deploy / push hub unless user says so.

---

## Role

Staff engineer + product designer. Fix and improve the lock-screen **U-menu** until it matches the laptop reference vibe: **Capricorn logo center, Cap app marks floating on a medium 3D ellipse, clean, no picture-frame, no borders on logos.**

User may use `/caveman` — reply terse; keep paths, APIs, flags exact.

---

## Context

**Repo:** `/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab`  
**Version:** `0.9.8`  
**Dev:** `npm run dev` → `http://localhost:4321`

| URL | Purpose |
|-----|---------|
| `/?view=desktop&lock=1` | Force lock, macOS |
| `/?view=mobile&lock=1` | Force lock, iOS |
| `/?three=0` | CSS orbit fallback (no WebGL) |
| `/?nolock=1` | Skip lock |

**Reference intent:** early-2000s OS picker (big center mark, apps on tilted/top-down ellipse). Center = Capricorn Systems logo (`SYSTEM.logo`). Orbit = Cap **marks** (`assets/marks/*.svg`), not old OS logos, not rounded app-icon PNG plates.

**Read first:**
- `HANDOVER.md`
- `js/lock-sphere.js` (Three.js)
- `js/lock-screen.js` (layout, import, whisper)
- `css/lock-screen.css` (`.lock-screen--three` bands)
- `js/products.js` (`APPS[].mark`, `SYSTEM.logo`)
- `CHANGELOG.md` § 0.9.7–0.9.8

**Brain (optional):** `~/Capricorn-Brain/01 Projects/capricorn-lab.md`

---

## What already works (do not break)

- Session-only unlock (no remember-device)
- Lock button (menubar / iOS / Apple menu)
- Three bands: time → stage → copy (no company name over logo)
- Dynamic `import('./lock-sphere.js')` code-split
- Canvas hidden (`opacity: 0`) until first good frame
- Full-bleed transparent canvas (no mid-screen white box)
- SoulCap + TravelCap marks exist
- `?three=0` CSS fallback
- Unlock bloom, sovereignty proof pulse
- **No** lock ambient drone (removed 0.10.1)

---

## Known defects / gaps (fix these)

1. **Depth still weak** — ellipse can read flat; front/back size+opacity must sell 3D harder (laptop U-menu depth).
2. **Light theme contrast** — cream wallpaper + thin mark strokes; some marks hard to see. Fix marks rendering and/or subtle soft shadow under sprites (not square borders).
3. **Spacing / medium size** — cluster must stay **medium**, centered in stage, **never** overlap Unlock / Capricorn Systems / Capricorn OS text. Re-check desktop 1440×900 and mobile 390×844.
4. **Mobile** — aspect scale must keep ring clear of copy; no icon pile.
5. **Motion** — auto-spin smooth; drag inertia; `prefers-reduced-motion` freezes spin (static ellipse OK).
6. **QA live** — open real browser / Playwright screenshot; do not ship blind. Iterate until satisfied.

---

## Hard constraints

- **No** Face ID / PIN
- **No** remember-device
- **No** rounded app-icon plates / bordered tiles on orbit logos
- **No** mid-screen opaque canvas “picture”
- **No** hub push / deploy unless asked
- Prefer `assets/marks/*.svg`; fallback `icon` only if mark missing
- Keep CSS fallback path when WebGL fails or `?three=0`

---

## Success criteria

Desktop `/?view=desktop&lock=1` and mobile `/?view=mobile&lock=1`:

- [ ] Capricorn logo clearly center
- [ ] All 10 Cap marks visible on ellipse
- [ ] Reads as 3D orbit (not flat icon row, not pile)
- [ ] Medium size — not edge-to-edge, not overlapping unlock/copy
- [ ] No white box / no logo borders / no glass chrome
- [ ] Drag rotates; tap mark shows whisper
- [ ] Light + dark both readable
- [ ] `?three=0` still works
- [ ] Update `CHANGELOG.md` + `HANDOVER.md` after ship

---

## Suggested approach

1. Screenshot current desktop + mobile lock (Playwright or Safari).
2. Tune `js/lock-sphere.js` camera / `RX`/`RZ` / scale / `fitRoot` until ellipse + clearance good.
3. Improve mark rasterization (stroke visibility on light theme) without adding plates.
4. Re-screenshot; compare to success criteria.
5. Doc bump; stop. No hub push.

---

## Out of scope

Full site audit, widget layout, dock magnify, hub deploy, new apps, Face ID.
