# Changelog — Capricorn Lab

Experimental **Capricorn OS**. Sandbox only — see [PLOT_MASTER_PROMPT.md](./PLOT_MASTER_PROMPT.md) and [HANDOVER.md](./HANDOVER.md).

## 0.9.6 — 2026-07-10

- **Clock widget sovereignty proof** — the desktop clock tile's empty lower space now carries a live "● 0 bytes sent today · 0 servers" line (green dot), echoing the lock screen. Both themes readable.
- **Full perfection audit (verified, no defects):** light + dark across sidebar / tasks / widgets / Applications window; lock screen both variants + full checklist + reduced-motion orbit; widget CTAs 0-clipped at 643 / 900 / 1080 / 1290 / 1920; ambient tint subtle in both modes; WIP apps show "GitHub ↗" + badge, live apps "Launch PWA ↗"; 0 failed requests, 0 console errors/warnings; scroll fallback uses styled thin gold scrollbar.

## 0.9.5 — 2026-07-10

- **Widget CTA clip fix (all sizes)** — no widget hides its CTA anymore:
  - **Short heights (≤900px):** `layoutWidgetHeights()` measures each row group's true natural height at `min-content` and sizes rows to `max(budget, natural)`; grid scrolls when total exceeds budget. Dropped the redundant `+8` medium-row bonus that forced needless scroll at tall heights (1290px now fits with no scroll).
  - **Narrow widths (≤900px, 1–2 col reflow):** JS now defers to CSS when the grid isn't 4-col; and cells are un-flexed (`display:block`) so `height:auto` tiles size to content instead of collapsing under `flex:1; min-height:0` and clipping.
- **HANDOVER sync** — corrected drift: iOS dock is 10 apps (not 5), 3 pages, Tasks = 17; added `lock-screen.js` to key files; refreshed QA checklist + Future.

## 0.9.4 — 2026-07-10

Lock + boot completion pass:

- **Quick boot** after lock — 5-line fast sequence (~0.9s); full boot only via `?boot=full`
- **Lock art** — star field + gold rings + spoke lines on parallax canvas
- **Why Capricorn** — `SYSTEM.pitch` paragraph on lock screen
- **iOS swipe physics** — drag panel up, rubber-band, velocity unlock, swipe rail
- **SEO fallback** — richer meta + `<noscript>` article for crawlers (still `noindex`)
- **Remember device** — session default; optional `localStorage` via checkbox

## 0.9.3 — 2026-07-10

Lock screen polish:

- **Parallax wallpaper** — canvas blobs on lock; desktop theme-aware, iOS purple palette; mouse/touch parallax
- **Constellation** — 10 app icons orbit logo pre-unlock
- **Unlock sound** — `sfx.unlock()` distinct from boot chime
- **Remember device** — checkbox → `localStorage` skip on return visits
- **Social proof** — “0 bytes sent today” pill with live dot

## 0.9.2 — 2026-07-10

**Lock screen** — first layer before OS (desktop + iOS):

- Big logo, Capricorn Systems copy, ecosystem stats, founder line
- Desktop: **Unlock device** → boot sequence → desktop
- iOS: clock + date, **Enter Capricorn OS**, tap / swipe-up / Enter
- After unlock: `body.os-live` stagger on widgets + dock; welcome toast
- Session skip via `sessionStorage` (same tab session); `?nolock=1` / `?lock=1` for QA

## 0.9.0 — 2026-07-10

Full polish pass from audit:

- **WIP honesty** — TravelCap + SoulCap badge everywhere; GitHub launch copy for WIP.
- **Tasks** — toggle done state (localStorage), visible scrollbar, taller row.
- **iOS** — 3 pages (Today / Tasks+Apps / Social); all 10 apps in dock; theme toggle.
- **Desktop** — menubar clock; resize without reload; windows above dock.
- **Control Center** — Escape close, Wi‑Fi lock toasts, notify stack shifts when open.
- **QA** — `aria-hidden` on inactive view; backup hub before git push.

## 0.8.10 — 2026-07-10

- **Tasks** — 7 social tasks (GitHub, X, Instagram, LinkedIn, YouTube, TikTok, Threads) + 10 app tasks; 3-col desktop grid; taller system row.
- **Control Center** — volume label + slider aligned on one row; footer note readable; panel scrolls if short viewport.
- **Apple menu** — anchored under Capricorn button; solid background; no sidebar bleed-through.

## 0.8.9 — 2026-07-10

- **Unified widget typography** — `--w-font-*` tokens; Tasks labels/details/tags match app widget body scale (no more tiny task rows).
- **iOS Today — all 10 apps** — `IOS_WIDGET_SNAPSHOTS` in `widgets.js`; clock spans full width; every Cap app gets a Today tile.
- **Control Center** — proper toggle SVG in menubar; Wi‑Fi/Bluetooth icons on tiles; Wi‑Fi locked on with funny toast if user tries off; Bluetooth toggles freely.

## 0.8.8 — 2026-07-10

- **TASKS single source** — `products.js` → `tasks.js` renders desktop + iOS; same 11 tasks everywhere.
- iOS Today page gets Tasks strip (tap → open PWA or swipe to social).
- Help + sidebar copy say Tasks.

## 0.8.7 — 2026-07-10

- **Tasks widget** — shorter system row (148px), 2-column dense grid, each row: label + live detail + app tag (more info, less height).

## 0.8.6 — 2026-07-10

- Richer widget copy — small tiles get meta rows + detail lines; medium tiles get context lines back (Zakat, IPO, grails, flight, DNA, etc.).
- Default app row min 162px to fit added content.

## 0.8.5 — 2026-07-10

Widget grid redesign.

- **Cleaner card layout** — hero stat + optional meta/bars + footer CTA; dropped cram lines and ring widget.
- **Reminders → Tasks** — wider system tile (58% width), taller row (184px), shorter labels, `task__*` styles.
- **Clock** — compact left column (42%).
- **Bigger tiles** — default app row 156px+, medium rows +8px; gap/pad/radius bumped.
- **Simpler layout engine** — fixed comfortable mins instead of over-compressed measure loop.

## 0.8.4 — 2026-07-10

Widget grid clipping fix.

- **`layoutWidgetHeights()` rewrite** — old math divided by 5 rows but app grid is 4 rows → row height too small, `overflow:hidden` clipped CTAs (DeePonyCap "Open stable", TravelCap "Open trip", AuraCap "Run DNA scan", etc.). Now measures natural height per grid row and sets `grid-template-rows` per row.
- **Scroll fallback** — if viewport too short, `.widget-grid--scroll` enables thin scrollbar instead of hiding content.
- **Density modes** — `data-widget-density` (`compact` / `cozy` / `comfortable`) tightens padding/fonts when row height is tight.
- Re-layout after mount animations (950ms) so post-count-up heights stay correct.

## 0.8.3 — 2026-07-10

Polish pass — real screenshots, mobile widget parity, no duplicate chrome.

### App windows (screenshots)
- **Real mobile PWA screenshots** from `assets/screenshots/` (8 live apps — copied from hub). Phone frame shows actual app UI, not faux placeholder chips.
- **TravelCap + SoulCap** marked `wip: true` in `products.js` — graceful "Screenshot coming soon" placeholder until PWAs ship.
- Device frame: dynamic island + `object-fit: cover` shot fill.

### Desktop UX
- **Menubar clock removed** — time only in clock widget + iOS status bar (no duplicate).
- **`?pitch=1`** opens Applications window on load (investor path).
- **Ambient accent tint** — wallpaper picks up focused app window accent (`cap:window-focus` → `.ambient-tint`).
- **Widget micro-motion** — count-up numbers + progress-bar fill on mount; gated by `prefers-reduced-motion`.
- **Hover overlap fix** — widget tiles lift with `z-index: 2` on hover; no clip/stack fights.
- **Ecosystem sidebar count** derives from `APPS.length` at runtime.

### Mobile (iOS)
- **"Today" widget row** on page 1 — clock + VaultCap / PulseCap / LedgerCap accent widgets before app grid (desktop story parity).
- Page labels: Today → Apps → (page 2) Connect.

### Dock
- **Arrow-key nav** across dock items (Left/Right).

### Docs
- `HANDOVER.md` — quick session handoff.
- `PLOT_MASTER_PROMPT.md` synced to current behaviour + checklists.

## 0.8.2 — 2026-07-10

Visual redesign pass.

### Widgets
- **Per-app theming** — every app widget is tinted by its own accent (`--w-accent`): radial glow, accent border, accent-coloured header + stat. Derives generically, so all 10 (and any future app) theme automatically.
- **Size-based content** — medium (wide) tiles now earn their space with a mini-stat meta row or labelled progress bars; small tiles stay lean (head → one stat → one line → CTA).
  - VaultCap: Cash / Markets / Gold breakdown.
  - LedgerCap: ENGRO / HBL / OGDC ticker with up/down colour.
  - SteadyCap: Habits / Meds / Mood meta.
  - DeePonyCap: G4 shelf progress bar.
  - TravelCap: Readiness + Packing bars.
  - AuraCap: Modules progress bar.
- **Accent hover** — tiles lift and cast an accent-coloured glow on hover.
- New shared renderers (`wHead`, `wCta`, `wMeta`, `wBar`) — less duplication.

### Dock
- **Hover label pops up ABOVE the hovered icon** (macOS style), replacing the mis-anchored floating hint that appeared off to the side. Per-icon `.dock-tip` bubble with arrow; keyboard-focus shows it too.
- **Cleaner floating pill** — removed `overflow-x:auto` (it was clipping the magnification lift), softened radius, deeper shadow.

### App windows
- **Fixed Applications window in dark mode** — header was a hardcoded light gradient → white-on-white text. Now uses theme tokens; readable in both themes.
- **Polished device mockup** ("the screenshot") — faux status bar (9:41 + signal), app name, hook, chip stack, home indicator, accent screen-glow. Reads as an intentional device screen, not a broken placeholder.
- Card hover uses theme surface token.

### Cleanup
- Removed dead code: `initMobile` (dock.js, no `#mobileGrid`), `renderSocialLink` (social.js, never called).

## 0.8.1 — 2026-07-09

Audit bug-fix pass.

- **Desktop toasts fixed** — duplicate `id="notifyStack"` (mobile + desktop) meant `getElementById` returned the hidden mobile stack, so every desktop toast was invisible (widget teases, welcome, social). Split into `#notifyStackDesktop` / `#notifyStackMobile`; `notify()` targets the visible view.
- **`?view=desktop` no longer blanks below 768px** — the width media query hid `.desktop` regardless of forced view. Scoped to `html:not([data-view="desktop"])`.
- **Boot scan derives all 10 apps** from `APPS` (was hardcoded 8).
- **Coming-soon socials give feedback** — `bindSocialClicks` used a wrong selector (`.is-soon`) and was never called; fixed selector, wired on desktop sidebar + iOS grid, added keyboard support.
- `vite.config` reads `PORT` env (default 4321) for preview tooling.

## 0.8.0 — 2026-07-09

- 10 apps, widget layout engine, device-preview in app windows, sidebar social, `?view=` override, PLOT_MASTER_PROMPT.md.
