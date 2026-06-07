# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 8-Bit Portfolio: Spec-Driven Development (SDD) Workflow

This project strictly follows an SDD methodology managed via Linear, CodeGraph, and the Superpowers plugin. Never write implementation code without a failing test and a linked Linear ticket.

## 1. Project Context
- Use `codegraph_explore` via MCP to traverse the project's Abstract Syntax Tree (AST) before proposing or modifying architecture. Do not blind-read files.

## 2. Planning Phase
When the user asks to brainstorm or plan a feature:
- Use `/superpowers:brainstorm` to clarify game logic and mechanics.
- Use `/superpowers:write-plan` and the Linear MCP tools (`create_issue`) to generate tickets in the project.
- YOU MUST include a strict testing specification in the description of every created Linear issue.

## 3. Execution Phase
When the user asks to implement a ticket:
- Use Linear tools to fetch the assigned issue.
- Identify the Linear Issue ID (e.g., `PORT-12`).
- YOU MUST name the git branch starting with the Issue ID (format: `PORT-12-feature-name`).
- YOU MUST include the Issue ID at the beginning of the Pull Request title to trigger GitHub-Linear auto-linking.
- Use `/superpowers:execute-plan` to spawn a subagent that will write the test, implement the code to pass it, and open the PR.

## Package Manager

Always use `bun`. Never `npm` or `yarn`.

## Commands

```bash
bun run dev       # dev server (localhost:4321)
bun run build     # production build → dist/
bun run preview   # serve dist/ locally
```

No test suite exists yet. Type-check via `bunx astro check`.

## Architecture

**Astro 6 static site** (`output: 'static'`). Single page at `src/pages/index.astro`. No routing beyond index.

### Rendering model

- All panels are **Astro components** (SSR → static HTML). No client-side data fetching.
- `GameLayer` (`src/game/GameLayer.tsx`) is the **only React island** (`client:idle`). It owns all game state and mounts/unmounts game modules based on `GameState`.
- Game modules (`src/game/*.ts`) are plain TypeScript that manipulate the already-rendered Astro DOM. Each exports `mount(): () => void` — returns a cleanup function.

### Game state machine

`useGameState.ts` manages: `BOOT → TITLE → EXPLORE`

- Starts as `EXPLORE` (SSR default; prevents hydration flash)
- On client hydration, checks `sessionStorage['gp-booted']` and `prefers-reduced-motion` — if first visit with motion enabled, transitions to `BOOT`
- `EXPLORE` state triggers `mountCursor()` + `mountWorldMap()` (and future game modules)

### Game module pattern

Every game module in `src/game/` must follow this pattern:

```ts
export function mount(): () => void {
  // — query DOM elements the Astro component already rendered
  // — set up event listeners / rAF loops
  // — all state local to this closure (no module-level singletons)
  return () => { /* full cleanup */ };
}
```

Key conventions:
- `rAF loop`: `dt = Math.min((now - last) / 1000, 0.05)`, pause when `document.visibilityState === 'hidden'`
- `document.fonts.ready.then(...)` to re-measure DOM positions after Google Fonts swap reflow
- Touch vs pointer: `window.matchMedia('(pointer: coarse)').matches` at mount time
- All animations gated on `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
- `sessionStorage` keys: `gp-booted`, `gp-visited-nodes`, `gp-collected-skills`
- Cross-module key conflict guard: check `menuList?.contains(document.activeElement)` before firing Z/Enter actions in worldMap

### Data layer

`src/data/portfolio.ts` is the single source of truth — `const portfolio` object plus `SP` (16×16 hero sprite pixel map) and `cmap` (color map). All components and game modules import from here. Update real job years here (GP-19).

### Styling

`src/styles/tokens.css` defines all CSS custom properties (`--c-*` colors, `--fs-*` font sizes, layout vars). Imported globally in `Base.astro`. All animations are in `@media (prefers-reduced-motion: no-preference)` blocks.

Shared CSS classes (defined in `tokens.css`):
- `.pixel-panel` + `.pixel-panel--{color}` — the double-border pixel-art panel frame
- `.panel-label` + `.panel-label--{color}` — 8px "Press Start 2P" section headers
- `.raised-cell` — inset background for skill chips, active rows, map nodes
- `.blink` — 1.1s step blink animation utility

### WorldMap mini-game (`src/game/worldMap.ts`)

Hero sprite moves at 120px/s along `#world-map-timeline`. Proximity detection (24px radius) to `.wm-node` elements triggers `wm-node--active` class and ENTER prompt. Z/Enter opens job dialog. Touch devices (`pointer: coarse`) skip the hero and wire nodes directly to dialog. Dialog is full DOM construction (no `innerHTML`) for XSS safety.

## Planned features (Linear backlog)

Issues GP-20 through GP-26 define the "play to discover" interaction overhaul:
- **GP-22** (Urgent): WorldMap progressive disclosure — job cards hidden until hero visits
- **GP-25** (Medium): HUD live stats via `CustomEvent 'gp:stat-update'` event bus in `src/game/gameStats.ts`
- **GP-20** (High): Scroll entrance animations via IntersectionObserver in `src/game/panelReveal.ts`
- **GP-21/23/24**: Animated ability bars, QuestLog typewriter, SkillTree collect mechanic
- **GP-26** (Low): CRT ambient effects in `src/game/ambientFx.ts`

Build order: GP-22 → GP-25 → GP-20 → GP-21 → GP-23 → GP-24 → GP-26
