# GAME_SPEC.md — the playable layer

This is the part that makes it *a game*, not just a game-themed page. It's **additive** to the static design in `DESIGN_SPEC.md`. Build the static site first; layer this on as client-side islands. Everything here must have a **non-game fallback** (real links, scroll, focus order) so the site is fully usable with the game turned off, with reduced-motion, on touch, and for screen readers.

---

## 1. Game states (a tiny state machine)

```
BOOT ──▶ TITLE ──(Press Start / any key / tap)──▶ EXPLORE ⇄ DIALOG
                                                      │
                                              (mute, menu nav live throughout)
```

| State | What's on screen | Enter via | Exit via |
|---|---|---|---|
| `BOOT` | Black → "INSERT COIN" flash → quick CRT power-on (scanline sweep + brief screen-on flash). ~1.2s, skippable. | page load | auto / any key |
| `TITLE` | Just the Title block centered on the starfield; `▶ PRESS START ◀` blinking; faint "↑↓←→ move · Z select · M mute" hint at the bottom. | after BOOT | Press Start, Enter, Space, click, or tap |
| `EXPLORE` | The full portfolio (all panels). The **hero sprite is now controllable** and the **menu cursor** is live. Normal scrolling still works. | from TITLE | — |
| `DIALOG` | A focused modal "dialogue box" overlay (a job detail, or the contact form). Background dims; game input pauses. | walk onto a map node, or select a Start-Menu item | Z/Esc/Enter on `CLOSE`, or click backdrop |

Persist "has booted" in `sessionStorage` so refreshes during a session skip straight to EXPLORE (don't force the boot every time). Honor `prefers-reduced-motion`: skip the CRT animation, show TITLE instantly.

**Important:** if JS is off, or the game island hasn't hydrated, the page must already show the full EXPLORE layout (SSR). TITLE/BOOT are an enhancement painted on top, not a gate to content. No "click to start" should ever hide real content from crawlers or no-JS users.

---

## 2. Controls

| Input | Keyboard | Touch | Action |
|---|---|---|---|
| Move hero | ← ↑ → ↓ / WASD | tap a node (no free-walk on touch) | walk the sprite around the world-map play area |
| Select / Confirm | Z / Enter / Space | tap | activate focused menu item / enter a node / advance dialogue |
| Back / Close | X / Esc | tap backdrop or `CLOSE` | close DIALOG |
| Menu up/down | ↑ ↓ (when focus is in a menu) | tap | move the `►` cursor through Start-Menu / link rows |
| Mute | M | tap speaker icon | toggle all audio |

- Capture game keys only when EXPLORE/DIALOG is active **and** focus isn't in a text field (so the contact form types normally). Never hijack Tab — keep native focus order intact.
- Show a small, dismissible controls hint the first time (store dismissal in `localStorage`).

---

## 3. The World-Map mini-game (the centerpiece interaction)

Reframe Panel F (Career Stages) as a small **walkable scene**.

**Layout.** Keep the vertical timeline of 5 nodes from the design. The left-rail nodes (the 40×40 numbered tiles) become **physical waypoints** on a path. The dotted connectors become the **walkable track** between them. The hero sprite (the same 16×16 character, 12px cells) starts at the bottom node (job #1 / oldest) — or at the glowing "NOW PLAYING" node — and can walk up/down the path.

**Movement & feel.**
- Grid-free but snappy: move the hero along the track at a constant ~120 px/s; clamp to the path bounds. 8-bit *step* feel — no easing, optional 2-frame walk bob.
- When the hero's center is within ~24px of a node, that node becomes **active**: it does the `pulseGlow`, plays a soft "blip", and a small `▲ ENTER` prompt appears under it.
- Pressing Z/Enter (or tapping the node on touch) opens that job's **DIALOG** (see below). The currently-current job ("NOW PLAYING") node always glows regardless of hero position.
- Optional flourish: a few collectible **coins** floating along the track; walking through one plays the coin SFX and ticks the HUD `★` / coin counter. Pure delight, no score gate.

**Job DIALOG (per node).** A dialogue-box overlay styled like Quest Log (blue accent), containing the full job record from `portfolio-data`:
```
<COMPANY>                         [▶ NOW PLAYING | ✓ CLEARED · <year>]
ROLE:  <role>            (cyan)
GEAR:  <tech>            (dim)   ← stack used, framed as "equipment"
QUEST: <note>            (faint) ← what was accomplished
                                   [ ◀ PREV ]   [ CLOSE ]   [ NEXT ▶ ]
```
PREV/NEXT walk through jobs without returning to the map. Animate the box in with a quick 2–3 step scale/!pop (reduced-motion: none).

**Touch / no-walk fallback.** On coarse pointers, skip free-walk: render the same node list, each node a large tap target (≥44px) that opens its DIALOG. The path/track can still render as decoration.

**A11y fallback.** Each node is also a real `<button>` in the DOM with an accessible label ("Career stage 5 — Nera, Mobile & Web Engineer, currently playing"). Keyboard Tab + Enter opens the same DIALOG. The walking layer is an enhancement over this real, focusable list.

---

## 4. Menu cursor navigation (Start Menu + links)

The `►` cursor in Panel G (Start Menu) is real and movable:
- ↑/↓ moves the blinking yellow `►` between rows; the focused row gets the `panelHi` fill + 2px accent ring (matching the "selected" styling already in the design).
- Z/Enter on a link row → open the URL (GitHub/LinkedIn/Website) in a new tab + confirm SFX.
- Add a **`► CONTACT`** row that opens the contact-form DIALOG (see ARCHITECTURE.md).
- Under the hood every row is a native `<a>`/`<button>`; the cursor just mirrors `:focus`. So keyboard Tab, screen readers, and mouse all work without the game logic.

---

## 5. HUD as a live readout (optional polish)

The top HUD (HP/XP/★) is decorative in the mock. Cheap ways to make it feel reactive:
- **XP bar** fills a little as the visitor scrolls / visits each panel (cap at 100%).
- **★ / coin** counter increments when collecting world-map coins.
- **HP** stays full and just keeps its barber-pole shimmer.
Keep this subtle — it should never distract from content or block reading.

---

## 6. Engineering notes

- One small island owns game state (e.g. a single `<GameLayer client:idle>` React/Preact/Solid island, or a vanilla TS controller). Don't make every panel interactive — only the title overlay, world-map play area, menu cursor, and HUD subscribe to it.
- Use `requestAnimationFrame` with a fixed-timestep accumulator for hero movement; pause the loop in DIALOG and when the tab is hidden (`visibilitychange`).
- Render the hero and map sprites with CSS pixel grids (as the mock does) **or** an `image-rendering: pixelated` canvas — either is fine; CSS grid keeps it crisp and DOM-inspectable.
- Reuse the exact `SP` sprite array + `cmap` from `dir-nes-epic.jsx` for the hero. If you add a walk frame, make a second 16×16 array that shifts the legs by one pixel.
- Keep all game timings behind `prefers-reduced-motion`; provide a visible **"Game mode: On/Off"** toggle (persisted) so anyone can opt out and just read a clean retro page.
