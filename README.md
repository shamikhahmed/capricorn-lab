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

- Boot → desktop or iOS home
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

## Status

**v0.9.0** — WIP badges, tasks toggle, iOS 3-page layout, full audit polish.

**v0.8.5** — widget redesign: Tasks tile, cleaner hero/CTA cards, bigger rows.

**v0.8.4** — widget grid per-row sizing fix; no clipped CTAs; scroll fallback on short viewports.

**v0.8.3** — real PWA screenshots (8 apps), iOS Today widgets, menubar clock removed, `?pitch=1`, ambient tint, widget animations, overlap fix, handover docs.

TravelCap + SoulCap: WIP placeholders until apps ship.

`noindex` — lab experiment only.
