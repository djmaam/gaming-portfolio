# DESIGN_SPEC.md — exact visual spec

All values are lifted directly from `design-reference/dir-nes-epic.jsx`. When a number appears here, it's the real value used in the mock. Rebuild pixel-perfect.

The design frame is **900 px wide** (the screenshots are this width). Inner content padding is `22px 26px 30px`.

---

## 1. Design tokens

### Color palette
| Token | Hex | Use |
|---|---|---|
| `bg0` | `#070611` | deepest background, outer pixel border, text-shadow depth |
| `bg1` | `#120a2a` | top of the radial background glow |
| `panel` | `#171033` | panel fill |
| `panelHi` | `#1f1644` | raised inner cells (skill cards, active menu row, map nodes) |
| `ink` | `#eef0ff` | primary text |
| `dim` | `#8a86c4` | secondary text |
| `faint` | `#4a447e` | tertiary text, hairline outlines, dotted connectors |
| `red` | `#ff4d68` | HP bar, stats panel accent |
| `blue` | `#4d8bff` | Quest Log accent, LinkedIn |
| `green` | `#5fe08a` | 1UP, character panel, "NOW PLAYING", GitHub |
| `yellow` | `#ffd24d` | stars/coins, LV labels, active cursor, highlights |
| `purple` | `#b06bff` | logo shadow, Skill Tree accent, EPIC rarity |
| `cyan` | `#46e6e0` | XP bar, role text, Start-Menu accent, RARE rarity |
| `orange` | `#ff9442` | coin inner shadow |
| `pink` | `#ff7ad9` | accent stars, Website link |

Background of the whole screen:
```css
background: radial-gradient(120% 80% at 50% -10%, #120a2a 0%, #070611 60%);
```

### Typography
- **Press Start 2P** (`px`) — all headings, HUD, panel labels, LV chips, rarity tags, menu keys. Use sparingly at small sizes; it's chunky.
- **Silkscreen** (`body`) — all running text (bio, skill items, job descriptions, link values).
- Google Fonts import:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">
  ```
- Sizes (px): logo `40`; section panel labels `8`; HUD `9`; `PRESS START` `9`; job company `11`; bio `18`; "lately" line `16`; skill-item chips `12.5`; job role `15`; job tech/note `13`; link value `16`. Footer `7`. **Never render Press Start 2P below 6px.**

### The "pixel panel" treatment (core motif — reused everywhere)
Every panel is a flat fill wrapped in a layered hard box-shadow that fakes a chunky NES border:
```css
background: #171033;
padding: 16px 18px;
box-shadow:
  0 0 0 3px #070611,        /* inner dark gutter */
  0 0 0 6px <ACCENT>,       /* colored 3px frame */
  0 6px 0 6px rgba(0,0,0,.4); /* drop shelf */
```
`<ACCENT>` is the panel's themed color (see each panel below). **No border-radius anywhere — everything is hard-edged.** Raised inner cells use a `0 0 0 2px <accent>` ring and `inset -2px -2px 0 rgba(0,0,0,.3)` for a beveled-pixel look.

Panel **label** (the small header inside each panel):
```
Press Start 2P · 8px · color = accent · letter-spacing 1 · margin-bottom 14
prefixed by a 7×7px solid square of the accent color, gap 8
```

### Global keyframe animations
```css
@keyframes blink     { 0%,50%{opacity:1} 51%,100%{opacity:0} }      /* steps(1), ~1s — cursors, PRESS START */
@keyframes twinkle   { 0%,100%{opacity:.15} 50%{opacity:1} }        /* steps(2), 2–5s — stars */
@keyframes floaty    { 0%,100%{translateY(0)} 50%{translateY(-7px)} } /* 2.4s ease-in-out — hero sprite */
@keyframes barber    { to { background-position: 24px 0 } }          /* .6s linear — HP/XP bar stripes */
@keyframes pulseGlow { 0%,100%{drop-shadow 0} 50%{drop-shadow 0 0 7px rgba(95,224,138,.9)} } /* 1.8s — active map node */
```
Gate all of these behind `@media (prefers-reduced-motion: no-preference)`.

### Full-screen overlays (always on, `pointer-events:none`)
- **Scanlines:** `repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.18) 3px 4px)` over everything (z 9).
- **Vignette:** `box-shadow: inset 0 0 120px 24px rgba(0,0,0,.7)` (z 9).
- **Starfield** (z 0): 54 absolutely-positioned dots, random x/y%, size 2px (or 4px for ~22% "big" ones), color mostly `#fff` with every 7th `cyan` and every 5th `pink`, each twinkling with a random 0–3s delay.

---

## 2. Screens / panels (top → bottom)

### A. Top HUD bar
Single flex row, `gap 14`, Press Start 2P `9px`, margin-bottom 22.
- `1UP` (green) · `HP` (red) label → **HP bar**: 120px wide × 12px tall, track `#231a44` with `0 0 0 2px faint` ring, fill 92% width using animated barber-pole stripes `repeating-linear-gradient(90deg, #ff4d68 0 8px, #d83b54 8px 12px)`.
- `XP` (cyan) → **XP bar**: flex-1 wide × 12px, same treatment, 78% fill, cyan stripes `#46e6e0 / #2bb8b2`.
- `★99` (yellow).
- **Coin**: 12px yellow circle with `inset -2px -2px 0 #ff9442`, then `x∞` (ink).

> In the real build these are decorative but should still feel alive: keep the barber-pole animation; optionally have XP tick up slightly on scroll/section-visit.

### B. Title block
Centered, margin-bottom 26.
- `★ ★ ★` row — Press Start 2P 11px, cyan, letter-spacing 3, margin-bottom 16.
- **Logo** `<h1>`: Press Start 2P **40px**, line-height 1.15, letter-spacing 2, color `ink`, two lines `MARCOS` / `ARRIETA`, text-shadow `4px 4px 0 #b06bff, 8px 8px 0 #070611` (purple offset + dark depth).
- Subtitle: Press Start 2P 9px, **green**, margin-top 18, line-height 1.6 — `SOFTWARE ENGINEER & AI ORCHESTRATOR`.
- **`▶ PRESS START ◀`**: Press Start 2P 9px, **yellow**, blinking (`blink 1.1s steps(1) infinite`). *This is the entry point to the game state — see GAME_SPEC.md.*

### C. Character + Stats (2-col grid, `300px 1fr`, gap 20)
**Character card** (accent = green, flex column, centered, gap 14):
- `▶ PLAYER 1` label (Press Start 2P 8px green, left-aligned).
- **Hero sprite**: a 16×16 pixel grid rendered at **12px per cell** (192×192 total), floating via `floaty 2.4s`. The sprite map (`SP`) and color map (`cmap`) are in the JSX — **reuse the exact arrays**. Colors: skin `#f0c89a`, hair/hat `#6b3fb0`, outline `#100a24`, red trim `#ff4d68`, yellow chest `#ffd24d`, etc.
- Soft shadow ellipse under sprite (`radial-gradient`).
- `@djmaam` (Press Start 2P 10px ink) · `CLASS · FULL-STACK MAGE` (15px yellow) · `HOME · ARGENTINA` (14px dim).

**Ability Stats card** (accent = red, label `ABILITY STATS`, flex column gap 13). For each of the 5 stats:
- Row: stat label (14px ink) left, `LV<n>` chip right (Press Start 2P 8px yellow) where `n = round(lvl/5)`.
- **Segmented bar**: 10 cells, gap 3, each 14px tall. `filled = round(lvl/10)` cells. Fill color ramps: cells 0–5 **green**, 6–7 **yellow**, 8–9 **red**; empty cells `#241b46`. Filled cells carry `inset -2px -2px 0 rgba(0,0,0,.3)`.
- Stats (from data): FRONTEND 95, BACKEND 85, MOBILE 92, AI ORCHESTRATION 88, CLOUD/DEVOPS 80.

### D. Quest Log — "Who am I" (accent = blue, label `QUEST LOG · WHO AM I`, margin-bottom 20)
Flex row, gap 16. A big blue `‹›` glyph (Press Start 2P 22px) on the left, then a column:
- Bio paragraph — 18px ink, line-height 1.55 (`P.about`).
- "Lately" line — 16px **yellow**, prefixed `► `, with a blinking `▼` at the end (`P.aboutNow`).

> Treat as a classic JRPG dialogue box. Nice-to-have: type-on text reveal when it scrolls into view (respect reduced-motion).

### E. Skill Tree · Inventory (accent = purple, label `SKILL TREE · INVENTORY`, margin-bottom 20)
3-column grid, gap 12, one card per skill group. Each card = `panelHi` fill with a `0 0 0 2px <rarityColor>` ring:
- Header row: `◆ <GROUP>` (14px, rarity color) left, rarity **tag** (Press Start 2P 6px) right.
- Items: wrapped flex of chips — each `Silkscreen 12.5px ink`, bg `#0f0a26`, padding `2px 6px`, `0 0 0 1px faint` ring.
- Rarity assignment by group index: `[LEGENDARY(yellow), EPIC(purple), EPIC(purple), RARE(cyan), RARE(cyan), COMMON(green)]` → maps to LANGUAGES, FRONTEND, BACKEND, AI/AGENTS, CLOUD/OPS, DATA.

> Nice-to-have: hover lifts a card (`translateY(-3px)`) + plays the select SFX.

### F. World Map · Career Stages (accent = yellow, label `WORLD MAP · CAREER STAGES`, margin-bottom 20)
A vertical timeline of the 5 jobs, newest first. Each row = flex, gap 16:
- **Left rail (54px wide):** a 40×40 node — `box-shadow 0 0 0 3px bg0, 0 0 0 5px <ring>`. The first/current node is **green-filled & glows** (`pulseGlow`), number text `bg0`; others are `panelHi` fill, `faint` ring, `dim` number. Node number = `experience.length - i` (so newest = highest number, "level 5"). Below the node, a **dotted connector** (4px wide, `repeating-linear-gradient(faint 0 5px, transparent 5px 10px)`) to the next node.
- **Card:** company (Press Start 2P 11px ink) + status tag right — first row reads `▶ NOW PLAYING` (green), others `✓ CLEARED · <year>` (yellow, 7px). Then role (15px cyan), tech (13px dim), note (13px faint).

> **This panel is the spine of the mini-game.** In the playable layer the nodes become physical points the hero walks between. See `GAME_SPEC.md` → World Map.

### G. Start Menu · Get in Touch (accent = cyan, label `START MENU · GET IN TOUCH`)
Flex column, gap 9. Three rows (GitHub / LinkedIn / Website). The first row is "selected": `panelHi` fill + `0 0 0 2px <color>` ring + a blinking yellow `►` cursor. Each row: key (Press Start 2P 9px, themed color, min-width 110) + value (Silkscreen 16px ink).
- GitHub → green → **https://github.com/djmaam**
- LinkedIn → blue → linkedin.com/in/djmaam
- Website → pink → marcosarrieta.ar

> In the real build, the `►` cursor is driven by keyboard menu navigation (see GAME_SPEC.md), and a **CONTACT** entry is added here that opens the contact-form dialogue (ARCHITECTURE.md).

### Footer
Centered, Press Start 2P 7px, `faint`, letter-spacing 1: `© 20XX MARCOS ARRIETA · INSERT COIN TO CONTINUE`.

---

## 3. Responsive behavior (chosen: **reflow to single column, keep pixel aesthetic**)

- **≤ ~680px:** the `300px 1fr` Character/Stats grid → 1 column (sprite card on top). The 3-col Skill Tree → 1 column. The 900px frame becomes fluid `width:100%` with reduced side padding (e.g. `16px`). Scale the logo down (clamp ~28–40px) and the bio/text a notch.
- Keep all pixel borders, scanlines, starfield, and the hard-edged look at every width — **do not** switch to a "soft mobile" theme.
- HUD bar: allow it to wrap or hide the `★99`/coin on the narrowest widths; keep HP/XP.
- **World-map mini-game on touch:** don't ship a tiny D-pad. Detect coarse pointer → render the map as the tappable vertical node list (each node opens its job detail). The walkable hero layer is a progressive enhancement for keyboard/desktop.
- Respect `prefers-reduced-motion`: freeze starfield/floaty/pulse, disable the type-on reveal, keep content fully visible.
