# Capricorn OS — capricorn-lab

The website **is** the device. Capricorn OS is the Capricorn Systems hub: a browser-native desktop (Mac-class screens), iPadOS-style home (tablets) and iOS-style home (phones) that hosts all fifteen Cap apps.

**Canonical source (D-13).** `npm run deploy:hub` builds and copies to [`shamikhahmed.github.io`](https://shamikhahmed.github.io/), which GitHub Pages serves at the root.

## What's inside

| | |
|---|---|
| **Three surfaces** | Desktop (fine pointer ≥ 900px) · Tablet (touch 600–1366px, or any 600–900px window) · Phone (< 600px). `?view=desktop\|tablet\|mobile` forces one. |
| **Ten themes** | Capricorn · Capricorn Night · Aurora · Synthwave · Terminal · Truck Art · Mughal · Paper · Pixel 95 · Brutal. Each restyles wallpaper (live canvas painter), glass, type, window chrome, lock screen, boot log and UI sounds. Circular reveal on switch. Share with `?theme=<id>`. |
| **Launch PWA** | Every live Cap runs inside its window (desktop) or a full sheet (phone/iPad) — the real PWA, same origin, its own storage. |
| **Live catalog** | Versions are read at runtime from each Cap's `VERSION.json`; `js/products.js` holds the offline fallback. |
| **Privacy Monitor** | Counts every request the page made (Resource Timing), by origin. Clock widget + lock screen show the measured line. |
| **Desktop extras** | Spotlight (⌘K: apps, themes, Privacy Monitor, lock), Control Center theme row, Mission Control (F3 / ⌃↑), right-click menu (Next Theme, Surprise Me), notification center, themed screensaver (75s idle), resizable windows (pointer events — touch works), `?tour=1`. |
| **Lock screen** | Three.js mark carousel (after idle, capable devices) with CSS fallback (`?three=0`). Skinned per theme. |

## Run

```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/capricorn-lab
npm install
npm run dev            # http://localhost:4321
```

| URL | |
|---|---|
| `/?nolock=1` | skip lock screen |
| `/?lock=1` | force lock screen |
| `/?theme=synthwave` | open in a theme (aliases: `crt`, `neon`, `truck`, `tile`, `eink`, `retro`, `brutalist`, `dark`) |
| `/?view=tablet` | force iPad layout |
| `/?tour=1` | 33-second self-driving demo |
| `/?boot=full` | full BIOS boot (desktop) |
| `/?three=0` | CSS lock carousel |

## Test

```bash
npm test                    # smoke gate: catalog, theme registry ↔ CSS ↔ painters, no third-party loads, honesty strings
npm run qa:matrix           # 10 themes × 7 devices × Chromium + WebKit (needs npm run dev)
npm run qa:flows            # drives the UI: windows, Launch PWA, Appearance, Spotlight, sheets, lock screens
```

QA scripts use `playwright-core`; set `PW_CORE=/path/to/node_modules/playwright-core` to match whichever browser builds are installed in `~/Library/Caches/ms-playwright`.

## Deploy

```bash
npm run deploy:hub          # build → ../shamikhahmed.github.io (index.html + hashed assets)
cd ../shamikhahmed.github.io && node scripts/check-links.mjs && git add -A && git commit && git push
```

Hub CI (`links` → `deploy-pages`) publishes an allowlisted `_site` on push to `main`.

## Key files

| File | Role |
|---|---|
| `js/theme.js` | Skin registry (`THEMES`), apply/persist, circular reveal, share links |
| `js/wallpaper.js` | Wallpaper engine + one painter per skin, perf governor, `paintPreview` |
| `css/themes.css` | Per-skin tokens (bare `[data-skin]`) + component overrides (`html[data-skin]`) |
| `js/appearance.js` · `css/appearance.css` | Theme gallery, Run-here, Privacy Monitor, iOS sheets styling |
| `js/live-catalog.js` | Runtime `VERSION.json` sync |
| `js/privacy-monitor.js` | Measured network proof |
| `js/mobile-ios.js` · `css/mobile.css` · `css/tablet.css` | Phone + iPad home, dock, sheets |
| `js/window-manager.js` | Desktop windows, Launch PWA, resize/drag |
| `js/products.js` | Catalog, tasks, system copy |

History: [CHANGELOG.md](./CHANGELOG.md) · Handoff: [HANDOVER.md](./HANDOVER.md) · Brain: `~/Capricorn-Brain/01 Projects/capricorn-lab.md`
