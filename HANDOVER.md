# Capricorn Lab — Handover

**Repo:** `/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab`  
**Version:** `0.9.6`  
**Status:** Experiment only — **do not deploy** or replace [shamikhahmed.github.io](https://shamikhahmed.github.io/) without explicit approval.

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

Safari phone: `open -a Safari 'http://localhost:4322/?view=mobile'`

---

## Lock screen (v0.9.2)

First visit per **browser session**: lock → unlock → OS.

| View | Unlock copy | Then |
|------|-------------|------|
| Desktop | Unlock device | Boot terminal → macOS |
| iOS | Enter Capricorn OS | Home (no boot) |

Files: `js/lock-screen.js`, `css/lock-screen.css`, `#lockScreen` in `index.html`.

After unlock: `body.os-live` + widget/dock stagger + welcome toast.

**v0.9.3 extras:** parallax lock wallpaper, orbiting app constellation, unlock chime, “Remember this device”, “0 bytes sent today” proof.

**v0.9.4:** quick post-lock boot, lock star art, pitch paragraph, iOS swipe physics, SEO noscript, `?boot=full`.

---

## What shipped (through v0.9.4)

| Area | Done |
|------|------|
| **Lock** | Constellation lock → unlock → quick boot → OS; parallax art; remember-device; `?nolock` / `?lock` / `?boot=full` |
| **10 apps** | All in dock, widgets, iOS grid; boot scan from `APPS.length` |
| **Widgets** | Hero + CTA cards; per-app accent; medium = meta/bars, small = lean |
| **Tasks** | **17 tasks** (7 social + 10 app); toggle done (localStorage); desktop + iOS |
| **Dock** | Floating pill only (`<div class="dock">`); tip **above** icon; arrow keys |
| **Windows** | Real PNG screenshots (8 apps); WIP placeholder for Travel/Soul |
| **Toasts** | `#notifyStackDesktop` / `#notifyStackMobile` — no dup id bug |
| **Mobile** | iOS **3 pages** — Today (clock + all 10 app widgets) / Tasks + Apps / Connect; dock **all 10 apps** |
| **Theme** | Light/dark; Applications header fixed; ambient tint on focus |
| **Social** | Sidebar Connect grid; coming-soon toast on disabled icons |

Full history: [CHANGELOG.md](./CHANGELOG.md)

---

## Key files

| File | Role |
|------|------|
| `js/products.js` | `APPS`, `SOCIAL`, `TASKS`, `SYSTEM.pitch`, screenshots, `wip` flags |
| `js/lock-screen.js` | Lock UI, constellation, swipe physics, remember device |
| `js/widgets.js` | Widget renderers, teases, `IOS_WIDGET_SNAPSHOTS`, layout |
| `js/tasks.js` | Desktop + iOS Tasks from `TASKS` |
| `js/control-center.js` | CC panel; Wi‑Fi lock + Bluetooth toggle |
| `js/window-manager.js` | Windows + device screenshot frame |
| `js/main.js` | View mode, boot, ambient, pitch, ecosystem count |
| `js/mobile-ios.js` | iOS home, Today widgets, sheets |
| `js/dock.js` | Dock + tips + keyboard |
| `js/notifications.js` | Toasts → active view stack |
| `css/mobile.css` | `?view=desktop` wins over narrow viewport |
| `assets/screenshots/*.png` | 8 live app shots (no travel/soul yet) |

---

## Agent full audit

Paste **[PLOT_MASTER_PROMPT.md](./PLOT_MASTER_PROMPT.md)** into new Cursor chat.

Brain: `~/Capricorn-Brain/01 Projects/capricorn-lab.md`

---

## QA checklist (5 min)

Last full audit **2026-07-10 (v0.9.6)** — all below verified, 0 defects.

- [x] Fresh tab → lock screen → unlock → OS (desktop + iOS)
- [x] Lock: remember-device persists · `?lock=1` forces · `?nolock=1` skips · reduced-motion orbit freezes
- [x] Desktop light + dark readable (sidebar, Tasks, widgets, Applications header)
- [x] Widget CTAs never clipped: 643 / 900 / 1080 / 1290 / 1920
- [x] Open app window → real screenshot (8 apps) · Travel/Soul → "Screenshot coming soon" + WIP badge
- [x] Apps window: live = "Launch PWA ↗", WIP = "GitHub ↗" + badge
- [x] Dock hover → label above icon · arrow-key nav · WIP badges
- [x] Ambient tint on focused app window (subtle in both themes)
- [x] `/?view=desktop` @ 600px — not blank
- [x] `/?view=mobile` — 3 pages: Today (clock + 10 widgets) / Tasks + Apps / Connect; dock 10 apps
- [x] 0 failed requests · 0 console errors/warnings

---

## Still WIP (by design)

- **TravelCap / SoulCap** — apps under development; GitHub URLs, no live PWA screenshots yet.
- **Deploy / GitHub push** — wait for Shamikh approval.
- **noindex** — stays until swap approved.

---

## Future (only if asked)

- Travel/Soul screenshots when those PWAs ship
- Live-hub swap (replace shamikhahmed.github.io) — needs explicit approval
- Service worker / lab PWA (out of scope today)

*Capricorn Systems — Your device. Your rules.*
