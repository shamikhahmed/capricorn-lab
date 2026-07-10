# Capricorn Lab

Experimental **Capricorn OS** — sandbox only. **Do not deploy** without explicit approval.

Live hub: [shamikhahmed.github.io](https://shamikhahmed.github.io/)

## Docs

| File | Purpose |
|------|---------|
| [HANDOVER.md](./HANDOVER.md) | Quick session handoff — start here |
| [PLOT_MASTER_PROMPT.md](./PLOT_MASTER_PROMPT.md) | Full agent audit prompt (paste into Cursor) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

## Concept

Website *is* fake macOS + iOS — not a landing page about one.

- Boot → **lock screen** → desktop or iOS home
- 10 Cap apps: widgets, dock, windows with **real mobile screenshots**
- Tap widget → toast; CTA → app window
- Sovereignty prefs = cloud off
- `⌘K` palette

## Run

```bash
cd /Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab
npm install && npm run dev
```

| URL | Experience |
|-----|------------|
| `/` | Auto: ≤768px = iOS |
| `/?view=desktop` | macOS (any width) |
| `/?view=mobile` | iOS (any width) |
| `/?view=desktop&pitch=1` | Desktop + Applications window |
| `/?nolock=1` | Skip lock screen |
| `/?lock=1` | Force lock screen |
| `/?boot=full` | Full BIOS boot (desktop) |

## Status

**v0.10.1** — Removed lock ambient drone (constant hum). Unlock SFX only.

**v0.10.0** — "Last 10%" batch: JetBrains Mono, live window demos (Prism playable), right-click menu, notification center, wallpaper picker, Mission Control, screensaver, `sovereignty` egg, `?tour=1`, sovereignty certificate, OG image, lock hover-whisper. Local; hub not pushed.

**v0.9.9** — Lock Three.js polish: real depth (dynamic near/far), light-theme mark shadows, mobile ring fit, tap→whisper fix, `?three=0` fallback interactivity; fixed `.ios[hidden]` bleed regression. Local; hub not pushed.

**v0.9.8** — Lock Three.js U-menu ellipse (marks, no picture frame); Fable prompt in `LOCK_FABLE_PROMPT.md`. Local; hub not pushed.

**v0.9.5** — Widget CTA clip fix at short viewport heights (natural-height row sizing); HANDOVER sync.

**v0.9.4** — Quick boot after lock, lock art, pitch copy, iOS swipe physics, SEO fallback.

**v0.8.5** — widget redesign: Tasks tile, cleaner hero/CTA cards, bigger rows.

**v0.8.4** — widget grid per-row sizing fix; no clipped CTAs; scroll fallback on short viewports.

**v0.8.3** — real PWA screenshots (8 apps), iOS Today widgets, menubar clock removed, `?pitch=1`, ambient tint, widget animations, overlap fix, handover docs.

TravelCap + SoulCap: WIP placeholders until apps ship.

`noindex` — lab experiment only.
