# ARCHITECTURE.md — Astro build, audio, contact form, deploy

Stack chosen by Marcos: **Astro** (he already uses it). Below is a proposed structure and the three systems that aren't in the static mock — **audio**, the **contact form**, and **deploy** to `marcosarrieta.ar`. Use Astro's own conventions; adapt freely.

---

## 1. Proposed project structure

```
src/
├── data/
│   └── portfolio.ts          # ported from portfolio-data.jsx — typed, single source of truth
├── styles/
│   └── tokens.css            # CSS custom props for every color/size in DESIGN_SPEC.md
├── components/
│   ├── HudBar.astro
│   ├── TitleBlock.astro
│   ├── CharacterCard.astro    # hero sprite (SP + cmap), class/home
│   ├── AbilityStats.astro     # segmented LV bars
│   ├── QuestLog.astro         # bio dialogue
│   ├── SkillTree.astro        # rarity inventory cards
│   ├── WorldMap.astro         # static node list (SSR) — base layer for the mini-game
│   ├── StartMenu.astro        # links + CONTACT row
│   ├── PixelPanel.astro       # shared panel wrapper (the layered box-shadow motif)
│   ├── HeroSprite.astro       # the 16×16 pixel grid, reused by card + game
│   └── ContactForm.astro
├── game/                      # client-only — the playable layer (GAME_SPEC.md)
│   ├── GameLayer.tsx          # <GameLayer client:idle> — owns the state machine
│   ├── useGameState.ts
│   ├── worldMap.ts            # hero movement, node proximity, dialog routing
│   ├── menuCursor.ts          # ►-cursor keyboard nav mirroring :focus
│   └── audio.ts               # SFX + music manager (see §3)
├── layouts/
│   └── Base.astro             # fonts, meta/OG, global overlays (scanlines, vignette, starfield)
├── pages/
│   ├── index.astro            # composes all panels in order; wraps with GameLayer
│   └── api/
│       └── contact.ts         # form POST handler (if using a server adapter — see §4)
public/
├── audio/                     # chiptune assets (see §3)
├── fonts/                     # optional self-hosted Press Start 2P / Silkscreen
└── og-image.png               # social card (use screenshots/01-epic.png as a base)
```

- Render all panels **server-side** so content is in the HTML for SEO/no-JS. The game is layered on as islands (`client:idle` / `client:visible`), never a prerequisite for content.
- `PixelPanel.astro` should take an `accent` prop and produce the exact `box-shadow` stack from `DESIGN_SPEC.md` → "pixel panel treatment". Every panel uses it.
- Put all tokens in `tokens.css` as `--c-green: #5fe08a;` etc. so they're reusable and themeable.

### Porting the data
`portfolio-data.jsx` exports a `PORTFOLIO` object onto `window`. In Astro, make it a typed module:
```ts
// src/data/portfolio.ts
export const portfolio = { /* …copy the object verbatim… */ } as const;
export type Experience = (typeof portfolio.experience)[number];
```
Keep field names identical (`about`, `aboutNow`, `skills`, `stats`, `experience`, `links`). Don't reword copy.

---

## 2. Fonts & rendering

- Load **Press Start 2P** + **Silkscreen** (Google Fonts link in `Base.astro`, or self-host in `public/fonts/` and `@font-face` them — self-hosting avoids a layout shift on this font-heavy page; prefer it).
- Add `image-rendering: pixelated` to any raster/sprite that scales. The CSS pixel-grid sprites stay crisp natively.
- `font-display: swap`. Preload the two font files.

---

## 3. Audio system (SFX + toggleable music)

Requirement: **8-bit SFX on hover/select + a looping chiptune track with a mute toggle.**

**Assets** (`public/audio/`) — small, looping, 8-bit:
- `move.wav` — cursor/step blip (very short, quiet)
- `select.wav` — confirm/enter
- `back.wav` — close/cancel
- `coin.wav` — collectible pickup
- `start.wav` — Press Start fanfare
- `bgm.ogg` (+ `.mp3` fallback) — short looping chiptune (~30–60s loop)

> You'll need to source/commission these (royalty-free chiptune packs, or generate with jsfxr/Bfxr for SFX and Bosca Ceoil/Beepbox for the loop). They are **not** in this bundle. List them as TODO assets.

**Manager** (`src/game/audio.ts`):
- Wrap SFX in a tiny pool (preload `Audio` elements or use WebAudio buffers for low latency; WebAudio is better for rapid blips).
- **Autoplay policy:** browsers block audio before a user gesture. Start **muted**; unlock the AudioContext on the first interaction (the Press Start tap is the natural unlock point). The `start.wav` fanfare on Press Start doubles as the unlock.
- **Mute toggle:** a small pixel speaker icon in the HUD (top-right). Persist the choice in `localStorage` (`audioMuted`). Music respects it too.
- **Default music:** off/low. Don't blast a track on load — let the visitor opt in via the mute toggle, and keep BGM at a low gain (~0.3). Some folks hate auto-music; make it obviously toggleable.
- Debounce hover SFX (don't fire on every pixel of mousemove) and never play SFX if `audioMuted` or `prefers-reduced-motion` (treat reduced-motion users as likely wanting calm — still allow manual opt-in).

---

## 4. Contact form (the "awesome" centerpiece)

Marcos wants this to shine. Style it as a **Start-Menu dialogue box** (cyan accent, pixel panel), opened from the `► CONTACT` menu row (DIALOG state).

**Fields**
- `NAME` (required)
- `EMAIL` (required, validated)
- `MESSAGE` (required, textarea)
- honeypot hidden field + simple timing check for spam.

**Pixel-RPG form styling**
- Inputs are flat `#0f0a26` fills with a `0 0 0 2px faint` ring; on `:focus` the ring becomes cyan + a blinking caret feel. Labels in Press Start 2P 8px (themed). Body text in Silkscreen.
- The submit button is a chunky pixel button: `► SEND` with the layered box-shadow; pressed state shifts it down 2px (remove the drop shelf) like a real NES button. Plays `select.wav`.
- **Validation as dialogue:** errors render as an RPG dialogue line, e.g. `! HERO NEEDS AN EMAIL TO REPLY.` in red, with the blinking `▼`. Keep it charming but clear; also wire real `aria-invalid`/`aria-describedby` so it's accessible.
- **States:** idle → sending (`… TRANSMITTING …` with an animated 3-dot or a tiny loading bar reusing the HUD barber-pole) → success (`✓ MESSAGE SENT! +50 XP` + bump the XP bar + `coin.wav`) → error (`✕ TRANSMISSION FAILED — TRY AGAIN`). Make success genuinely delightful — this is the moment to reward the visitor.

**Submission backend (pick one):**
- **Serverless email service (simplest):** Formspree / Web3Forms / Resend via a form action — no backend to host. Good with a static Astro build.
- **Astro endpoint** (`src/pages/api/contact.ts`) if deploying with a server adapter (Node/Vercel/Netlify/Cloudflare). POST → validate → send mail (Resend/SendGrid) → JSON `{ ok }`. The form island fetches it and drives the state machine above.
- Always validate server-side too; never trust client validation. Rate-limit.

> Decide the backend based on Marcos's host. If he wants zero backend, use Web3Forms/Formspree and keep the output a fully static site. If he's already on Vercel/Netlify/Cloudflare, an Astro API route + Resend is clean.

---

## 5. SEO, meta, social

- `<title>Marcos Arrieta — Software Engineer & AI Orchestrator</title>`, meta description from the bio.
- OG/Twitter card image: derive from `screenshots/01-epic.png` (the title+character view) → `public/og-image.png`.
- Real content is server-rendered (see §1) so it indexes despite the game overlay.
- `lang="en"` (copy is English). Favicon: a tiny version of the hero sprite or a pixel coin.

---

## 6. Deploy → marcosarrieta.ar

- Static build (`astro build`) works if the contact form uses a serverless form service → host on **Netlify / Vercel / Cloudflare Pages / GitHub Pages**. Point the apex `marcosarrieta.ar` (and `www`) at the host; enable HTTPS.
- If using an Astro API route for contact, add the matching adapter (`@astrojs/vercel`, `@astrojs/netlify`, or `@astrojs/cloudflare`) and deploy as SSR/hybrid.
- Set canonical URL to `https://marcosarrieta.ar`. Add `sitemap` + `robots.txt` (`@astrojs/sitemap`).
- Cache-bust fonts/audio with hashed filenames (Astro does this for bundled assets; for `public/` assets set long cache headers).

---

## 7. Definition of done

- [ ] All six panels pixel-match `DESIGN_SPEC.md` at 900px, and reflow cleanly to one column on mobile with the pixel aesthetic intact.
- [ ] Boot → Title → Explore flow works; content is fully present without JS / for crawlers.
- [ ] Hero walks the world map; nodes open job dialogues; keyboard + touch + screen-reader fallbacks all work.
- [ ] Menu cursor navigates Start Menu + links; `CONTACT` opens the form.
- [ ] Audio: SFX + toggleable BGM, muted-by-default, choice persisted, reduced-motion respected.
- [ ] Contact form validates, submits for real, and celebrates success.
- [ ] GitHub → https://github.com/djmaam; site canonical → https://marcosarrieta.ar.
- [ ] Lighthouse: good a11y + SEO; `prefers-reduced-motion` honored throughout.
