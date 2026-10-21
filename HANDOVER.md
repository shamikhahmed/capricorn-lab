# Capricorn OS (capricorn-lab) — HANDOVER

**Version 1.1.0** (2026-10-14) · canonical hub source (D-13) · live at https://shamikhahmed.github.io/
Path: `/Users/shamikhahmed/Projects/Cap/Cap-Apps/capricorn-lab` · Deploy: `npm run deploy:hub` → `../shamikhahmed.github.io`

Read with: `README.md`, `CHANGELOG.md`, `~/Capricorn-Brain/01 Projects/capricorn-lab.md`.

## State

- Three surfaces: desktop / tablet (iPadOS) / phone (iOS). Detection in `js/main.js` `autoViewMode()`.
- Ten skins (`js/theme.js` THEMES). Adding one = registry entry + painter in `js/wallpaper.js` PAINTERS + token block in `css/themes.css` + entry in the inline boot map in `index.html`. `npm test` fails if any of the four is missing.
- Catalog versions are live (runtime `VERSION.json`). AuraCap and CookCap don't publish `VERSION.json` yet → they show the `products.js` fallback (and a 404 in the console).
- Launch PWA: same-origin iframe; first-party PWAs keep their own IndexedDB/SW scope.
- Privacy Monitor + all "0 trackers" lines are **measured** (Resource Timing). Unmeasured claims ("0 bytes sent", "0 servers", "network disabled") were removed in 1.1.0 — LedgerCap prices, DeeFoodie sync and TravelCap flight lookups do use servers, so never bring those back.

## Gotchas

- `.ios:not([hidden])` guard in `css/mobile.css` is load-bearing (iOS layer bled behind lock/desktop when dropped).
- Token blocks in `themes.css` use bare `[data-skin]` so Appearance preview cards (which carry their own `data-skin`) get the right tokens; component overrides use `html[data-skin]` so previews don't inherit them. Keep that split.
- Wallpaper painters must stay cheap: soft painters render below 1× DPR on purpose; opaque skins disable backdrop blur. The governor in `initWallpaper` steps quality down if frames sag. Measure with a frame counter before adding per-frame work behind glass.
- Background tabs: `document.hidden` stalls rAF and CSS animations — screenshots from a hidden tab look "stuck mid-animation". Use the Playwright QA scripts for visual checks.
- Dock: never `overflow-x:auto` on the desktop dock (kills tip + magnify). Pixel 95 turns it into a taskbar — that skin is the exception.
- Embedded Caps log into the hub console (e.g. PulseCap's `navigator.vibrate` before user activation). Fix those in the Cap repo.

## Removed — don't bring back without asking

Lock ambient drone · remember-device checkbox · Face ID/PIN on lock · sticky notes · Future OS modules from os-next · "Living Mind Model" copy for SoulCap · wallpaper warm/cool/mono picker (replaced by themes).

## Verify before deploy

```bash
npm test && npm run build
npm run dev &               # then:
PW_CORE=… npm run qa:matrix && PW_CORE=… npm run qa:flows
```
