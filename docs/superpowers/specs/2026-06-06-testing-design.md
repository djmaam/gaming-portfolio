# Testing Architecture Design
**Date:** 2026-06-06  
**Status:** Approved  
**Scope:** Add Vitest + Playwright test suite to all existing game modules; append test specs to Linear GP-20 through GP-26

---

## Context

No test suite exists. CLAUDE.md requires every Linear issue to include a strict testing specification. GP-20 through GP-26 were created without one. This design establishes the full testing architecture for current and future game modules.

---

## Stack

| Layer | Tool | Environment |
|-------|------|-------------|
| Unit / Integration | Vitest + happy-dom | In-process, fast |
| Component | React Testing Library | happy-dom |
| E2E | Playwright (Chromium only) | Real browser |
| CI | GitHub Actions | Ubuntu, per-job |

---

## File Layout

```
src/
  game/
    __tests__/
      setup.ts                    # global mocks: matchMedia, rAF, performance.now
      useGameState.test.ts
      menuCursor.test.ts
      worldMap.test.ts
      GameLayer.test.tsx
tests/
  e2e/
    boot-flow.spec.ts
    worldmap-dialog.spec.ts
vitest.config.ts
playwright.config.ts
.github/
  workflows/
    test.yml
```

---

## Config

### vitest.config.ts
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['src/game/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
```

### setup.ts — global mocks
- `window.matchMedia` → configurable mock (default: `matches: false`)
- `window.requestAnimationFrame` → `vi.fn()` (prevents rAF loop from running in tests)
- `window.cancelAnimationFrame` → `vi.fn()`
- `performance.now` → `vi.fn()` returning controllable time

### playwright.config.ts
```ts
projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]
webServer: { command: 'bun run preview', port: 4321, reuseExistingServer: true }
testDir: 'tests/e2e'
```
E2E runs against production build (`bun run build` first).

### package.json scripts
```json
"test":          "vitest run",
"test:watch":    "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e":      "playwright test"
```

---

## Dependencies

```bash
bun add -D vitest @vitest/coverage-v8 happy-dom
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
bun add -D @playwright/test
```

---

## Vitest Test Specs

### useGameState.test.ts
- Default state is `EXPLORE`
- `advance('TITLE')` writes `gp-booted=1` to sessionStorage
- `advance('EXPLORE')` writes `gp-booted=1` to sessionStorage
- `prefers-reduced-motion: reduce` → stays `EXPLORE` on hydration
- Already booted (`gp-booted=1`) → stays `EXPLORE` on hydration
- No motion + not booted → transitions to `BOOT`

### menuCursor.test.ts
- `mount()` returns a cleanup function
- Cleanup removes all event listeners (no leaks)
- `focusin` on `.menu-row` → adds `menu-row--selected`, removes from siblings
- Z key on focused row inside `#start-menu-list` → clicks `.menu-row--selected a/button`
- Z key when focused element is outside list → no-op
- Z key when INPUT is focused → no-op (guard)

### worldMap.test.ts
- `mount()` with missing `#world-map-timeline` → returns no-op cleanup, no crash
- Empty `.wm-node` list → early return, no canvas injected
- Touch device (`pointer: coarse`) → no canvas created; node buttons wired to `openDialog`
- Desktop: hero within 24px of node → node gets `wm-node--active`, prompt shown
- Desktop: hero beyond 24px → `activeNode = -1`, prompt hidden
- `openDialog(i)` → dialog DOM contains correct `job.company`, `job.role`, `job.tech`, `job.note`
- Dialog Escape → closes (backdrop and panel removed from DOM)
- Dialog ArrowLeft → navigates to prev job; disabled at index 0
- Dialog ArrowRight → navigates to next job; disabled at last index
- Cleanup: canvas removed, `timeline.style.position` restored, dialog closed, all listeners removed

### GameLayer.test.tsx
- Renders `null` when state = `EXPLORE`
- Renders `BootOverlay` when state = `BOOT`
- Renders `TitleOverlay` when state = `TITLE`
- `mountCursor` called when state = `EXPLORE`
- `mountWorldMap` called when state = `EXPLORE`
- Cleanup functions called on unmount

---

## Playwright E2E Specs

### boot-flow.spec.ts
- Fresh session (no sessionStorage) → `.gp-boot` overlay visible
- Click overlay → `.gp-title` overlay visible
- Press Enter → EXPLORE state, no overlay present
- Second visit (same session) → skips BOOT, no `.gp-boot`

### worldmap-dialog.spec.ts
- World map section visible on page load
- Press ArrowDown → hero canvas `top` style changes
- Hero near node → `.wm-enter-prompt` visible
- Press Z → `.wm-dialog-panel` visible, company name correct
- Press Escape → dialog closes
- Mobile viewport: tap `.wm-node` button → dialog opens directly

---

## GitHub Actions CI

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install --with-deps chromium
      - run: bun run build
      - run: bun run test:e2e
```

---

## Linear Issue Test Specs (to append to GP-20 through GP-26)

### GP-20 — panelReveal.ts
- IntersectionObserver fires on panel → `.panel--revealed` class added
- `prefers-reduced-motion: reduce` → class added immediately without transition
- Cleanup removes observer

### GP-21 — abilityStats animation
- Bar width animates from `0%` to target value
- LVL counter counts up from 0 to target
- `prefers-reduced-motion: reduce` → instant fill, no rAF loop
- Cleanup cancels rAF

### GP-22 — progressive disclosure
- Unvisited card shows `??? ENCRYPTED` content
- Visited card (after hero enters node) shows real data
- `gp-visited-nodes` sessionStorage key persists visited state across re-mounts

### GP-23 — QuestLog typewriter
- Entries appear with 120ms stagger delay
- Typewriter appends characters at ~30ms/char
- `prefers-reduced-motion: reduce` → all entries revealed instantly
- Cleanup cancels pending timers

### GP-24 — SkillTree collect
- Chip starts at `opacity: 0.25` + `filter: grayscale(1)`
- Click on chip → collected state (`opacity: 1`, grayscale removed)
- Z key on focused chip → collects
- `gp-collected-skills` sessionStorage persists collected set
- Collected counter in HUD updates via `gp:stat-update` event

### GP-25 — HUD stats
- `gp:stat-update` event with `{ nodes, skills }` → HUD counters update
- Level calculation: correct LV at boundary values (e.g., 0 nodes/skills = LV.1, all = LV.10)
- HUD renders correct `NODES X/5` and `SKILLS X/27` format

### GP-26 — CRT effects
- Scanline overlay element present in DOM after mount
- Glitch CSS class added on panel `mouseenter`
- `prefers-reduced-motion: reduce` → no glitch class, no parallax

---

## Execution Order

1. Install deps
2. Write config files (`vitest.config.ts`, `playwright.config.ts`, `setup.ts`)
3. Write 4 Vitest test files
4. Write 2 Playwright E2E files
5. Write `.github/workflows/test.yml`
6. Update `package.json` scripts
7. `bun run test` → all green, coverage ≥ 80%
8. `bun run build && bun run test:e2e` → Playwright passes
9. Commit all
10. Update GP-20 through GP-26 in Linear

---

## Verification

- `bun run test` passes with coverage ≥ 80%
- `bun run build && bun run test:e2e` passes locally
- CI green on push
- Each GP-20..26 Linear issue has `## Testing Specification` section
