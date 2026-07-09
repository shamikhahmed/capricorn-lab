# Capricorn Lab — Handover

**Repo:** `/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab`  
**Version:** `0.9.0`  
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

Safari phone: `open -a Safari 'http://localhost:4322/?view=mobile'`

---

## What shipped (v0.8.0 → v0.8.3)

| Area | Done |
|------|------|
| **10 apps** | All in dock, widgets, iOS grid; boot scan from `APPS` |
| **Widgets** | Hero + CTA cards; **Tasks** (not Reminders) wide tile; per-app accent |
| **Dock** | Floating pill only (`<div class="dock">`); tip **above** icon; arrow keys |
| **Windows** | Real PNG screenshots (8 apps); WIP placeholder for Travel/Soul |
| **Toasts** | `#notifyStackDesktop` / `#notifyStackMobile` — no dup id bug |
| **Mobile** | iOS Today: clock + **all 10 app widgets** + Tasks strip; social page 2 + dock 5 |
| **Theme** | Light/dark; Applications header fixed; ambient tint on focus |
| **Social** | Sidebar Connect grid; coming-soon toast on disabled icons |

Full history: [CHANGELOG.md](./CHANGELOG.md)

---

## Key files

| File | Role |
|------|------|
| `js/products.js` | `APPS`, `SOCIAL`, screenshots, `wip` flags |
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

- [ ] Desktop light + dark @ 1440×900
- [ ] All widget CTAs visible at default Safari size (DeePony, Travel, Aura, Ledger…)
- [ ] Resize window — no content pop-in from hidden state
- [ ] Open app window → real screenshot in phone frame
- [ ] Dock hover → label above icon
- [ ] `/?view=desktop` @ 600px width — not blank
- [ ] `/?view=mobile` — Today widgets + 10 apps + page 2 social
- [ ] Travel/Soul window → "Screenshot coming soon"
- [ ] Console: no errors

---

## Still WIP (by design)

- **TravelCap / SoulCap** — apps under development; GitHub URLs, no live PWA screenshots yet.
- **Deploy / GitHub push** — wait for Shamikh approval.
- **noindex** — stays until swap approved.

---

## Future (only if asked)

- Travel/Soul screenshots when PWAs ship
- Optional `?pitch=1` polish (skip boot, etc.)
- Service worker / lab PWA (out of scope today)

*Capricorn Systems — Your device. Your rules.*
