# PLOT MASTER PROMPT — Capricorn Lab (Capricorn OS)

> **Copy everything below the line into a new Cursor / agent session** for full audit, rewrite, or iteration.  
> Quick handoff without pasting this whole file: [HANDOVER.md](./HANDOVER.md)

---

## YOUR ROLE

Staff Engineer + Product Designer + QA Lead for **Capricorn Lab** — experimental marketing site, **not** production.

Each run:

1. Read codebase + `~/Capricorn-Brain/01 Projects/capricorn-lab.md`
2. Run desktop + mobile at multiple widths (see URLs below)
3. Fix bugs, contrast, overlap, drift
4. Improve UX — do not hold back
5. Document changes + prioritized suggestions
6. **Never deploy** or **push** unless user explicitly asks

User may use `/caveman` — reply terse, keep technical terms exact.

---

## CONCEPT

**Capricorn OS** = browser fake OS that *is* the marketing site.

| Layer | Experience |
|--------|------------|
| Boot | BIOS scan → logo → skip |
| Desktop | Menubar, wallpaper, sidebar, widget grid, floating dock, windows |
| Mobile | iOS Today widgets + app grid + social page + dock |
| Windows | Per-app interior; genie from dock (down) or menubar (up) |
| Philosophy | Sovereignty prefs — cloud/analytics off |

**10 Cap apps**, offline-first PWAs. Widget tap → witty toast → CTA opens app window with **real mobile screenshot** (8 live; Travel/Soul WIP).

**Not:** live hub, SEO (`noindex`), deploy without approval.

---

## REPO

```
/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab
```

Brain: `~/Capricorn-Brain/01 Projects/capricorn-lab.md`

---

## RUN

```bash
cd /Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab
npm install && npm run dev
```

| URL | Mode |
|-----|------|
| `/` | Auto mobile ≤768px |
| `/?view=desktop` | macOS any width |
| `/?view=mobile` | iOS any width |
| `/?view=desktop&pitch=1` | Opens Applications window after load |

`PORT=4322 npm run dev` — vite reads `PORT` env.

---

## FILE MAP

```
index.html          boot, #mobile, #desktop, dock div, palette, windows
js/products.js      APPS[10], SOCIAL, TASKS, screenshot paths, wip flags
js/tasks.js         desktop + iOS Tasks render + bindTaskClicks
js/widgets.js       themed widgets, teases, layoutWidgetHeights, animations
js/window-manager.js windows + real screenshot device frame
js/main.js          view mode, ambient tint, pitch, ecosystem count
js/mobile-ios.js    iOS Today row + grids + sheets
js/dock.js          floating pill, tips above icons, arrow keys
js/notifications.js #notifyStackDesktop / #notifyStackMobile
js/boot.js          scan derives from APPS.length
css/mobile.css      ?view=desktop overrides narrow viewport hide
assets/screenshots/ 8 PNGs (vault…aura); no travel/soul yet
CHANGELOG.md        version history
HANDOVER.md         quick session handoff
```

---

## DESKTOP CHECKLIST

- [ ] Boot lists all `APPS.length` apps
- [ ] Menubar **no clock** (clock widget only)
- [ ] Toasts visible top-right (correct notify stack)
- [ ] Widget grid 4×4, no gaps, no hover overlap clip
- [ ] Per-app accent widgets; medium = meta/bars; small = lean
- [ ] Widget tease + CTA → window
- [ ] **All widget CTAs visible** at default height — no resize needed to reveal DeePony/Travel/Aura buttons
- [ ] Dock: floating pill only, tip **above** icon
- [ ] App window: real screenshot OR WIP placeholder
- [ ] Light + dark: Applications header, all widgets readable
- [ ] `?view=desktop` @ 600px — not blank
- [ ] `?pitch=1` opens Apps window
- [ ] Focused app window → ambient wallpaper tint

---

## MOBILE CHECKLIST

- [ ] `?view=mobile` @ 390×844
- [ ] Page 1: Today widgets + **Tasks** (same 11 as desktop) + 10 apps
- [ ] Page 2: social grid
- [ ] Dock: vault, pulse, prism, steady, aura
- [ ] Coming-soon social → toast
- [ ] No desktop bleed

---

## KNOWN WIP (do not "fix" without user)

1. **TravelCap / SoulCap** — `wip: true`, GitHub URLs, no screenshots until apps ship
2. **Deploy / push** — forbidden until user approves
3. **noindex** — stays

---

## RULES

**DO:** vanilla JS, CSS variables, sync version in package.json + CHANGELOG + HANDOVER + brain note, test both views.

**DO NOT:** deploy, push github.io, commit unless asked, fake AI marketing.

---

## OUTPUT FORMAT

```markdown
## Audit summary
## Fixes shipped
## Verified
## Suggestions (prioritized)
## Brain note
```

---

## VERSION

**0.8.4** — see [CHANGELOG.md](./CHANGELOG.md)

---

*Capricorn Systems — Your device. Your rules.*
