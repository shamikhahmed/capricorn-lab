Superseded on 2026-09-15 by Cap Fleet Finish Program / Website Tier 1 (CURSOR-MASTER-PROMPT.md).

# PLOT MASTER PROMPT — Capricorn Lab (Capricorn OS)

> **Copy everything below the line into Claude / Cursor** for full audit, rewrite, or iteration.  
> Quick handoff: [HANDOVER.md](./HANDOVER.md)

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
| Lock | Three.js U-menu (Capricorn + marks ellipse); CSS fallback `?three=0`; no remember-device; Lock button |
| Boot | Quick post-lock (~0.9s) or full BIOS via `?boot=full` |
| Desktop | Menubar, wallpaper, sidebar, widget grid, floating dock, windows |
| Mobile | iOS 3 pages (Today / Tasks+Apps / Social), dock, sheets |
| Windows | Per-app interior; genie from dock (down) or menubar (up) |
| Philosophy | Sovereignty — cloud/analytics off |

**10 Cap apps**, offline-first PWAs. Widget tap → toast → CTA opens app window with **real mobile screenshot** (8 live; Travel/Soul WIP).

**Not:** live hub swap, remove `noindex`, deploy without approval.

---

## REPO

```
/Users/shamikhahmed/Desktop/Cap-Apps/capricorn-lab
```

Brain: `~/Capricorn-Brain/01 Projects/capricorn-lab.md`  
GitHub: `github.com/shamikhahmed/capricorn-lab` (pushed v0.9.0; local may be ahead)

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
| `/?nolock=1` | Skip lock screen |
| `/?lock=1` | Force lock screen |
| `/?boot=full` | Full BIOS boot after lock (desktop) |

`PORT=4322 npm run dev` — vite reads `PORT` env.

---

## FILE MAP

```
index.html            lock, boot, #mobile, #desktop, dock, palette, windows, noscript SEO
js/products.js        APPS[10], SOCIAL, TASKS, SYSTEM.pitch, wip flags
js/lock-screen.js     lock UI, Three import, swipe, whisper, ambient
js/lock-sphere.js     Three.js U-menu ellipse (Capricorn + marks)
js/boot.js            quick boot (default) + full boot (?boot=full)
js/tasks.js           desktop + iOS Tasks (17 items)
js/widgets.js         widgets, teases, layoutWidgetHeights, os-live animations
js/window-manager.js  windows + real screenshot device frame
js/main.js            lock → boot → view mode, ambient tint
js/mobile-ios.js      iOS 3 pages, Today widgets, dock (10 apps)
js/dock.js            floating pill, tips above icons, arrow keys
js/wallpaper.js       parallax canvas (desktop + iOS + lock art)
js/sounds.js          sfx.unlock, sfx.boot, etc.
js/notifications.js   #notifyStackDesktop / #notifyStackMobile
css/lock-screen.css   lock + post-unlock os-live stagger
CHANGELOG.md          version history
HANDOVER.md           quick session handoff
```

---

## LOCK SCREEN CHECKLIST

- [ ] Fresh tab → lock shows (desktop + iOS)
- [ ] Parallax wallpaper + star/ring art
- [ ] 10 app icons orbit logo
- [ ] `SYSTEM.pitch` visible
- [ ] "0 bytes sent today" pill
- [ ] Remember device → skip lock on return
- [ ] `sfx.unlock()` on unlock (not boot chime)
- [ ] Desktop: Unlock → quick boot → desktop alive
- [ ] iOS: swipe up physics OR Enter button
- [ ] `?nolock=1` skips · `?lock=1` forces

---

## DESKTOP CHECKLIST

- [ ] Sidebar: Sovereignty, Founder, Ecosystem, Connect, Tips
- [ ] Menubar clock live
- [ ] Toasts visible (correct notify stack)
- [ ] Widget grid — all CTAs visible, no clip
- [ ] Tasks: 17 items (7 social + 10 app)
- [ ] Dock: tip **above** icon (overflow fix)
- [ ] Control Center: WiFi locked + funny toast, BT toggles
- [ ] Light + dark readable
- [ ] `?view=desktop` @ 600px — not blank
- [ ] Ambient tint on focused app window

---

## MOBILE CHECKLIST

- [ ] `?view=mobile` @ 390×844
- [ ] Page 1: Today — all 10 app widgets + clock
- [ ] Page 2: Tasks + app grid
- [ ] Page 3: social grid
- [ ] Dock: all 10 apps
- [ ] Lock swipe physics feels native-ish
- [ ] Coming-soon social → toast

---

## KNOWN WIP (do not "fix" without user)

1. **TravelCap / SoulCap** — `wip: true`, no screenshots until apps ship
2. **Deploy / push / hub swap** — forbidden until user approves
3. **noindex** — stays until swap approved
4. **No fake biometrics** — honest unlock button only

---

## RULES

**DO:** vanilla JS, CSS variables, sync version in package.json + CHANGELOG + HANDOVER + brain note, test both views.

**DO NOT:** deploy, replace shamikhahmed.github.io, commit/push unless asked, fake AI marketing.

---

## OUTPUT FORMAT

```markdown
## Audit summary
## Fixes shipped
## Verified
## Suggestions (prioritized)
## Brain note bullets
```

---

## VERSION

**0.10.0** — see [CHANGELOG.md](./CHANGELOG.md); last-10% batch shipped (mono type, live demos, context menu, notification center, Mission Control, screensaver, tour, certificate, OG image)

---

*Capricorn Systems — Your device. Your rules.*
