# Handoff: **D · 8-bit EPIC** — Marcos Arrieta's portfolio *as a playable game*

> A retro NES/arcade portfolio for **Marcos Arrieta** (`@djmaam`). The site is not just *styled* like a game — it ships with a small **playable layer**: a title screen with `PRESS START`, a pixel hero you walk around a **career world map**, panels that act like a menu, chiptune SFX + toggleable music, and a polished contact form. Target stack: **Astro**. Domain: **marcosarrieta.ar**.

---

## 📦 What's in this bundle

```
design_handoff_8bit_epic/
├── README.md            ← you are here — start here, read top to bottom
├── DESIGN_SPEC.md       ← exact colors, fonts, every panel/component, pixel values
├── GAME_SPEC.md         ← the playable layer: states, controls, world-map mini-game, physics
├── ARCHITECTURE.md      ← proposed Astro file tree, sound system, contact form, deploy
├── design-reference/
│   ├── EPIC-reference.html   ← OPEN THIS IN A BROWSER — renders the full design live
│   ├── dir-nes-epic.jsx      ← the React mock the screenshots came from (reference only)
│   └── portfolio-data.jsx    ← ALL real content (bio, skills, jobs, links) — reuse verbatim
└── screenshots/
    ├── 01-epic.png … 05-epic.png   ← top-to-bottom captures of the full screen
```

**Do this first:** open `design-reference/EPIC-reference.html` in any browser. That single file *is* the look-and-feel target. Everything else documents how to rebuild it for real.

---

## Overview

Marcos is a software engineer & AI orchestrator. This portfolio reframes his résumé as an 8-bit RPG character screen:

| Résumé concept | Game concept |
|---|---|
| Name / title | **Title screen** — big logotype, `PRESS START` |
| Bio | **Quest Log** dialogue box |
| Skill proficiency | **Ability Stats** — segmented LV bars |
| Tech stack | **Skill Tree / Inventory** — rarity-tagged item cards |
| Work history | **World Map** — career stages as map nodes (the walkable mini-game) |
| Contact | **Start Menu** + a real contact form |

---

## ⚠️ About the design files (read this)

The files in `design-reference/` are **design references created in HTML/React** — a prototype showing the intended *look and behavior*. **They are not production code to copy-paste.** `dir-nes-epic.jsx` was authored for a design-canvas tool; it renders one tall static screen with inline styles and a `window.PORTFOLIO` global.

Your job is to **recreate this design in a real Astro project** using Astro's component model, scoped styles/CSS or Tailwind, and proper client-side islands for the interactive/game bits. Treat the JSX as a faithful visual spec, **not** an architecture to mirror. Lift the **content** from `portfolio-data.jsx` verbatim — it's the single source of truth for copy.

---

## Fidelity: **HIGH**

The mock is pixel-level: final colors, typography, spacing, and animation timings are all real and intentional. Rebuild the visuals **pixel-perfectly**. Exact tokens and per-component measurements are in **`DESIGN_SPEC.md`**. The one area that is *additive* (not in the static mock) is the **interactive game layer** — fully specified in **`GAME_SPEC.md`**.

---

## What to build (scope checklist)

- [ ] **Astro project** scaffolded (see `ARCHITECTURE.md` for the proposed tree).
- [ ] **Pixel-perfect static layout** of all six panels, matching `DESIGN_SPEC.md`.
- [ ] **Boot / title state** — starfield + logo + blinking `PRESS START`; an "Insert Coin" boot transition.
- [ ] **Playable world-map layer** — arrow/WASD-controlled pixel hero that walks between career nodes; standing on a node opens that job's detail. Click/tap fallback for non-gamers. (`GAME_SPEC.md`)
- [ ] **Keyboard menu navigation** — arrows move a `►` cursor through Start-Menu items; Enter activates. Full a11y fallback (real links/buttons, focus rings, `prefers-reduced-motion`).
- [ ] **Chiptune audio** — select/move/confirm SFX + a looping track with a persistent mute toggle. Muted by default until first user gesture (autoplay policy). (`ARCHITECTURE.md`)
- [ ] **Contact form** — the "awesome" centerpiece, styled as a Start-Menu dialogue; real submission + validation. (`ARCHITECTURE.md`)
- [ ] **Responsive reflow** — panels collapse to a single column on narrow screens, pixel aesthetic preserved; world-map mini-game degrades to a tappable vertical node list on touch. (`DESIGN_SPEC.md` → Responsive)
- [ ] Real GitHub link → **https://github.com/djmaam**; website link → **marcosarrieta.ar**.
- [ ] Deploy config for **marcosarrieta.ar** (`ARCHITECTURE.md`).

---

## Content & links (source of truth = `portfolio-data.jsx`)

- **Name:** Marcos Arrieta · **Handle:** `@djmaam` · **Location:** Argentina
- **Title:** Software Engineer & AI Orchestrator
- **GitHub:** https://github.com/djmaam  *(confirmed real)*
- **LinkedIn:** linkedin.com/in/djmaam · **Web:** marcosarrieta.ar
- Bio, "lately" line, 6 skill groups, 5 ability stats, 5 jobs — all in `portfolio-data.jsx`. Don't retype; import it.

> Placeholders to resolve with Marcos before launch: job years show `20XX` and footer says `© 20XX`. Ask him for real years, or keep the stylized `20XX` deliberately. LinkedIn URL should be confirmed.

---

## Suggested build order

1. Scaffold Astro + fonts + design tokens (`DESIGN_SPEC.md` → Tokens).
2. Port `portfolio-data` to a typed `src/data/portfolio.ts`.
3. Build the six panels as static Astro components (pixel-perfect, no interactivity yet).
4. Add responsive reflow.
5. Layer in the title/boot state + menu cursor navigation (client island).
6. Build the world-map mini-game island (`GAME_SPEC.md`).
7. Add the audio system + mute toggle.
8. Build & wire the contact form.
9. A11y + reduced-motion pass, then deploy.

Read **`DESIGN_SPEC.md`**, **`GAME_SPEC.md`**, and **`ARCHITECTURE.md`** next — in that order.
