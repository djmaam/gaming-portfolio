# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest + Playwright test coverage for all existing game modules and append testing specifications to Linear issues GP-20 through GP-26.

**Architecture:** Vitest with `happy-dom` environment for unit/integration tests of all TypeScript/TSX game modules; Playwright (Chromium) for E2E boot flow and world map dialog; GitHub Actions runs both on every push/PR.

**Tech Stack:** Vitest, happy-dom, @testing-library/react, @testing-library/jest-dom, @playwright/test, GitHub Actions, bun

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `vitest.config.ts` | Create | Vitest config using `astro/config getViteConfig` |
| `src/game/__tests__/setup.ts` | Create | Global mocks: matchMedia, rAF, cancelAnimationFrame, document.fonts |
| `src/game/__tests__/useGameState.test.ts` | Create | State machine unit tests |
| `src/game/__tests__/menuCursor.test.ts` | Create | Cursor focus + Z-key integration tests |
| `src/game/__tests__/worldMap.test.ts` | Create | Proximity, dialog, cleanup integration tests |
| `src/game/__tests__/GameLayer.test.tsx` | Create | React component tests |
| `playwright.config.ts` | Create | Playwright config, Chromium only |
| `tests/e2e/boot-flow.spec.ts` | Create | Boot → Title → Explore E2E flow |
| `tests/e2e/worldmap-dialog.spec.ts` | Create | WorldMap node click → dialog E2E |
| `.github/workflows/test.yml` | Create | CI: vitest + playwright jobs |
| `package.json` | Modify | Add test scripts |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Vitest and friends**

```bash
bun add -D vitest @vitest/coverage-v8 happy-dom
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
bun add -D @playwright/test
```

Expected: no errors, packages appear in `package.json` devDependencies.

- [ ] **Step 2: Add test scripts to package.json**

Open `package.json`. In `"scripts"`, add after `"astro": "astro"`:

```json
"test":          "vitest run",
"test:watch":    "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e":      "playwright test"
```

- [ ] **Step 3: Install Playwright browser**

```bash
bunx playwright install --with-deps chromium
```

Expected: Chromium downloaded. Other browsers skipped.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: install vitest, playwright, and testing-library deps"
```

---

## Task 2: Write Vitest config + global test setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/game/__tests__/setup.ts`

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
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

`getViteConfig` pulls in Astro's Vite config (including the React plugin) — no need to add `@vitejs/plugin-react` separately.

- [ ] **Step 2: Write src/game/__tests__/setup.ts**

```ts
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// matchMedia — returns matches:false by default (desktop, motion allowed)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// rAF — stores the callback but does NOT call it automatically
// Individual tests call the captured callback to drive the loop
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(),
});

// document.fonts — worldMap.ts calls document.fonts.ready.then(...)
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: { ready: Promise.resolve() },
});

// performance.now — returns 0 at mount; loop uses the rAF `now` param, not this
vi.spyOn(performance, 'now').mockReturnValue(0);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  document.body.innerHTML = '';
  // Re-apply after clearAllMocks since matchMedia is a vi.fn()
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.mocked(window.requestAnimationFrame).mockImplementation(() => 0);
  vi.mocked(performance.now).mockReturnValue(0);
});
```

- [ ] **Step 3: Smoke-test setup compiles**

```bash
bun run test
```

Expected: "No test files found" (no tests yet) — NOT a compile error.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts src/game/__tests__/setup.ts
git commit -m "test: add vitest config and global test setup"
```

---

## Task 3: useGameState unit tests

**Files:**
- Create: `src/game/__tests__/useGameState.test.ts`
- Test target: `src/game/useGameState.ts`

- [ ] **Step 1: Write the test file**

```ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameState } from '../useGameState';

describe('useGameState', () => {
  // setup.ts clears sessionStorage and vi.clearAllMocks() before each test

  it('defaults to EXPLORE state', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.state).toBe('EXPLORE');
  });

  it('advance("TITLE") sets gp-booted in sessionStorage', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.advance('TITLE'); });
    expect(sessionStorage.getItem('gp-booted')).toBe('1');
  });

  it('advance("EXPLORE") sets gp-booted in sessionStorage', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.advance('EXPLORE'); });
    expect(sessionStorage.getItem('gp-booted')).toBe('1');
  });

  it('stays EXPLORE when prefers-reduced-motion: reduce', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useGameState());
    // renderHook wraps in act — useEffect has run
    expect(result.current.state).toBe('EXPLORE');
  });

  it('stays EXPLORE when already booted', () => {
    sessionStorage.setItem('gp-booted', '1');
    const { result } = renderHook(() => useGameState());
    expect(result.current.state).toBe('EXPLORE');
  });

  it('transitions to BOOT when motion allowed and not yet booted', () => {
    // matchMedia default mock returns matches:false (no reduced motion)
    // sessionStorage is clear (setup.ts beforeEach)
    const { result } = renderHook(() => useGameState());
    expect(result.current.state).toBe('BOOT');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/game/__tests__/useGameState.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/game/__tests__/useGameState.test.ts
git commit -m "test: add useGameState unit tests"
```

---

## Task 4: menuCursor integration tests

**Files:**
- Create: `src/game/__tests__/menuCursor.test.ts`
- Test target: `src/game/menuCursor.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '../menuCursor';

function buildDOM() {
  document.body.innerHTML = `
    <ul id="start-menu-list">
      <li class="menu-row"><a href="#">GitHub</a></li>
      <li class="menu-row"><a href="#">LinkedIn</a></li>
    </ul>
  `;
}

describe('menuCursor', () => {
  it('returns no-op cleanup when #start-menu-list missing', () => {
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
  });

  it('mount returns a function', () => {
    buildDOM();
    const cleanup = mount();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('focusin on .menu-row child adds menu-row--selected to that row', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    const link = rows[0].querySelector('a')!;
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(true);
    expect(rows[1].classList.contains('menu-row--selected')).toBe(false);
  });

  it('focusin switches selection away from previous row', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    rows[1].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(false);
    expect(rows[1].classList.contains('menu-row--selected')).toBe(true);
  });

  it('Z key clicks the anchor inside selected row when focus is inside the list', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    // Simulate focus inside the list
    Object.defineProperty(document, 'activeElement', { value: link, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('Z key is no-op when focused element is outside the list', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    Object.defineProperty(document, 'activeElement', { value: outside, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('Z key is no-op when an INPUT is focused inside the list', () => {
    buildDOM();
    mount();
    const list = document.getElementById('start-menu-list')!;
    const input = document.createElement('input');
    list.appendChild(input);
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { value: input, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('cleanup removes the keydown listener', () => {
    buildDOM();
    const cleanup = mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { value: link, configurable: true });
    cleanup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('cleanup removes the focusin listener', () => {
    buildDOM();
    const cleanup = mount();
    cleanup();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/game/__tests__/menuCursor.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/game/__tests__/menuCursor.test.ts
git commit -m "test: add menuCursor integration tests"
```

---

## Task 5: worldMap integration tests

**Files:**
- Create: `src/game/__tests__/worldMap.test.ts`
- Test target: `src/game/worldMap.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '../worldMap';
import { portfolio } from '../../data/portfolio';

// Capture the rAF callback so tests can drive the loop manually
let rafCallback: FrameRequestCallback | null = null;

beforeEach(() => {
  rafCallback = null;
  vi.mocked(window.requestAnimationFrame).mockImplementation((cb) => {
    rafCallback = cb;
    return 1;
  });
});

function buildDOM(nodeCount = 2) {
  document.body.innerHTML = '<div id="world-map-timeline"></div>';
  const timeline = document.getElementById('world-map-timeline')!;

  timeline.getBoundingClientRect = vi.fn().mockReturnValue({
    top: 0, bottom: 500, left: 0, right: 200, width: 200, height: 500, x: 0, y: 0,
    toJSON: vi.fn(),
  });

  for (let i = 0; i < nodeCount; i++) {
    const btn = document.createElement('button');
    btn.className = 'wm-node';
    btn.setAttribute('type', 'button');
    btn.textContent = `Node ${i}`;
    // node 0 center Y = 110, node 1 center Y = 210
    btn.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100 + i * 100, bottom: 120 + i * 100,
      left: 40, right: 60, width: 20, height: 20,
      x: 40, y: 100 + i * 100, toJSON: vi.fn(),
    });
    timeline.appendChild(btn);
  }

  return {
    timeline,
    nodes: Array.from(timeline.querySelectorAll<HTMLElement>('.wm-node')),
  };
}

function tick(now: number) {
  rafCallback!(now);
}

describe('worldMap — mount guards', () => {
  it('returns no-op cleanup when #world-map-timeline missing', () => {
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });

  it('returns cleanup without crashing when no .wm-node buttons exist', () => {
    document.body.innerHTML = '<div id="world-map-timeline"></div>';
    const timeline = document.getElementById('world-map-timeline')!;
    timeline.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0, bottom: 500, left: 0, right: 200, width: 200, height: 500, x: 0, y: 0,
      toJSON: vi.fn(),
    });
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });
});

describe('worldMap — touch mode (pointer: coarse)', () => {
  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('does not create hero canvas on touch device', () => {
    buildDOM();
    mount();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });

  it('node button click opens dialog with correct job data', () => {
    buildDOM();
    mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    const panel = document.querySelector('.wm-dialog-panel');
    expect(panel).not.toBeNull();
    expect(panel?.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[0].company);
    expect(panel?.querySelector('.wm-dialog__role')?.textContent)
      .toContain(portfolio.experience[0].role);
  });

  it('cleanup removes node click listeners and closes dialog', () => {
    buildDOM();
    const cleanup = mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
    cleanup();
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
    // After cleanup, clicking again should not reopen
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });
});

describe('worldMap — desktop mode', () => {
  it('injects hero canvas into timeline', () => {
    buildDOM();
    mount();
    expect(document.querySelector('.wm-hero-canvas')).not.toBeNull();
  });

  it('node button click opens dialog in desktop mode', () => {
    buildDOM();
    mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
  });

  it('cleanup removes canvas and restores timeline position', () => {
    const { timeline } = buildDOM();
    const cleanup = mount();
    expect(timeline.querySelector('.wm-hero-layer')).not.toBeNull();
    cleanup();
    expect(timeline.querySelector('.wm-hero-layer')).toBeNull();
    expect(timeline.style.position).toBe('');
  });

  it('cleanup closes any open dialog', () => {
    buildDOM();
    const cleanup = mount();
    document.querySelector<HTMLElement>('.wm-node')!.click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
    cleanup();
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });
});

describe('worldMap — proximity detection (rAF loop)', () => {
  it('prompt is visible when hero starts at node 0 Y', () => {
    buildDOM(2);
    mount();
    // hero starts at minY = 110 (node 0 center), no movement, run one frame
    tick(0); // dt = (0 - 0) / 1000 = 0, no movement
    const prompt = document.querySelector<HTMLElement>('.wm-enter-prompt')!;
    expect(prompt.hidden).toBe(false);
  });

  it('prompt is hidden when hero is far from all nodes', () => {
    buildDOM(2);
    mount();
    // Move hero toward node 1 (Y=210) so it sits at Y≈160, >24px from both
    // At 120px/s with dt=0.05 (capped), each tick = 6px. Need ~8 ticks to reach 160.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    let t = 0;
    for (let i = 0; i < 9; i++) { t += 50; tick(t); }
    // heroY ≈ 110 + 9*6 = 164, dist to node 0 (110) = 54 > 24, dist to node 1 (210) = 46 > 24
    const prompt = document.querySelector<HTMLElement>('.wm-enter-prompt')!;
    expect(prompt.hidden).toBe(true);
  });

  it('node 1 gets wm-node--active when hero is within PROX of it', () => {
    buildDOM(2);
    mount();
    // Move hero all the way to node 1 (Y=210): need (210-110)/6 ≈ 17 ticks
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    let t = 0;
    for (let i = 0; i < 20; i++) { t += 50; tick(t); }
    // heroY capped at maxY = 210 (node 1 center), dist = 0 ≤ 24
    const nodes = document.querySelectorAll('.wm-node');
    expect(nodes[1].classList.contains('wm-node--active')).toBe(true);
  });
});

describe('worldMap — dialog keyboard navigation', () => {
  beforeEach(() => {
    buildDOM(portfolio.experience.length);
    mount();
    document.querySelector<HTMLElement>('.wm-node')!.click();
  });

  it('Escape closes dialog', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });

  it('ArrowRight navigates to next job', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[1].company);
  });

  it('ArrowLeft is no-op at first job (index 0)', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(document.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[0].company);
  });

  it('PREV button is disabled at first job', () => {
    const prev = document.querySelector<HTMLButtonElement>('.wm-dialog__btn:first-child');
    expect(prev?.disabled).toBe(true);
  });

  it('NEXT button is disabled at last job', () => {
    // Navigate to last job
    const lastIdx = portfolio.experience.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    }
    const next = document.querySelector<HTMLButtonElement>('.wm-dialog__btn:last-child');
    expect(next?.disabled).toBe(true);
  });

  it('dialog shows NOW PLAYING for index 0', () => {
    expect(document.querySelector('.wm-dialog__status')?.textContent)
      .toContain('NOW PLAYING');
  });

  it('dialog shows CLEARED for non-zero index', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.querySelector('.wm-dialog__status')?.textContent)
      .toContain('CLEARED');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/game/__tests__/worldMap.test.ts
```

Expected: all tests pass. If proximity tests fail, check that `rafCallback` is being captured — log it after `mount()` to confirm `requestAnimationFrame` was called.

- [ ] **Step 3: Commit**

```bash
git add src/game/__tests__/worldMap.test.ts
git commit -m "test: add worldMap integration tests"
```

---

## Task 6: GameLayer component tests

**Files:**
- Create: `src/game/__tests__/GameLayer.test.tsx`
- Test target: `src/game/GameLayer.tsx`

- [ ] **Step 1: Write the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock game modules before importing GameLayer
vi.mock('../menuCursor', () => ({ mount: vi.fn() }));
vi.mock('../worldMap', () => ({ mount: vi.fn() }));
vi.mock('../useGameState', () => ({ useGameState: vi.fn() }));

import GameLayer from '../GameLayer';
import { mount as mountCursor } from '../menuCursor';
import { mount as mountWorldMap } from '../worldMap';
import { useGameState } from '../useGameState';

const mockAdvance = vi.fn();

function setGameState(state: 'BOOT' | 'TITLE' | 'EXPLORE') {
  vi.mocked(useGameState).mockReturnValue({ state, advance: mockAdvance });
}

describe('GameLayer', () => {
  beforeEach(() => {
    vi.mocked(mountCursor).mockReturnValue(vi.fn());
    vi.mocked(mountWorldMap).mockReturnValue(vi.fn());
  });

  it('renders null in EXPLORE state', () => {
    setGameState('EXPLORE');
    const { container } = render(<GameLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders BootOverlay (.gp-boot) in BOOT state', () => {
    setGameState('BOOT');
    const { container } = render(<GameLayer />);
    expect(container.querySelector('.gp-boot')).not.toBeNull();
  });

  it('renders TitleOverlay (.gp-title) in TITLE state', () => {
    setGameState('TITLE');
    const { container } = render(<GameLayer />);
    expect(container.querySelector('.gp-title')).not.toBeNull();
  });

  it('calls mountCursor when state is EXPLORE', () => {
    setGameState('EXPLORE');
    render(<GameLayer />);
    expect(mountCursor).toHaveBeenCalledOnce();
  });

  it('calls mountWorldMap when state is EXPLORE', () => {
    setGameState('EXPLORE');
    render(<GameLayer />);
    expect(mountWorldMap).toHaveBeenCalledOnce();
  });

  it('does not call mountCursor in BOOT state', () => {
    setGameState('BOOT');
    render(<GameLayer />);
    expect(mountCursor).not.toHaveBeenCalled();
  });

  it('calls cleanup functions on unmount', () => {
    const cursorCleanup = vi.fn();
    const worldMapCleanup = vi.fn();
    vi.mocked(mountCursor).mockReturnValue(cursorCleanup);
    vi.mocked(mountWorldMap).mockReturnValue(worldMapCleanup);
    setGameState('EXPLORE');
    const { unmount } = render(<GameLayer />);
    unmount();
    expect(cursorCleanup).toHaveBeenCalledOnce();
    expect(worldMapCleanup).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun run test src/game/__tests__/GameLayer.test.tsx
```

Expected: 8 tests pass.

- [ ] **Step 3: Run all Vitest tests together**

```bash
bun run test
```

Expected: all tests pass (useGameState + menuCursor + worldMap + GameLayer).

- [ ] **Step 4: Commit**

```bash
git add src/game/__tests__/GameLayer.test.tsx
git commit -m "test: add GameLayer component tests"
```

---

## Task 7: Check coverage threshold

**Files:** (none — verification only)

- [ ] **Step 1: Run with coverage**

```bash
bun run test:coverage
```

Expected: coverage report printed. Lines ≥ 80%, Functions ≥ 80% across `src/game/`. If below threshold, Vitest exits non-zero — check which functions are uncovered and add targeted tests.

- [ ] **Step 2: Commit if no new files needed**

If coverage passes, nothing to commit. If you added tests to hit the threshold:

```bash
git add src/game/__tests__/
git commit -m "test: add coverage for uncovered branches"
```

---

## Task 8: Write Playwright config

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Write playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'bun run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

Note: E2E tests run against `bun run preview` (production build). **You must run `bun run build` before `bun run test:e2e`** locally (CI does this automatically in `test.yml`).

- [ ] **Step 2: Create tests/e2e directory**

```bash
mkdir -p tests/e2e
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "test: add playwright config"
```

---

## Task 9: Write boot-flow E2E spec

**Files:**
- Create: `tests/e2e/boot-flow.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

// Helper: navigate with clean session (triggers BOOT)
async function freshVisit(page: Parameters<typeof test>[1]['page']) {
  await page.addInitScript(() => sessionStorage.clear());
  await page.goto('/');
}

// Helper: skip boot for tests that don't care about it
async function skipBoot(page: Parameters<typeof test>[1]['page']) {
  await page.addInitScript(() => sessionStorage.setItem('gp-booted', '1'));
  await page.goto('/');
}

test.describe('Boot flow', () => {
  test('shows BOOT overlay (.gp-boot) on fresh session', async ({ page }) => {
    await freshVisit(page);
    await expect(page.locator('.gp-boot')).toBeVisible();
  });

  test('click BOOT overlay transitions to TITLE screen', async ({ page }) => {
    await freshVisit(page);
    await page.locator('.gp-boot').click();
    await expect(page.locator('.gp-title')).toBeVisible();
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('press Enter on TITLE screen transitions to EXPLORE', async ({ page }) => {
    await freshVisit(page);
    await page.locator('.gp-boot').click();
    await expect(page.locator('.gp-title')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.gp-title')).not.toBeVisible();
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('second visit in same session skips BOOT', async ({ page }) => {
    await freshVisit(page);
    // First visit: boot through
    await page.locator('.gp-boot').click();
    await page.keyboard.press('Enter');
    // Reload (sessionStorage persists within same Playwright context)
    await page.reload();
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('prefers-reduced-motion: reduce skips BOOT', async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.clear());
    await page.goto('/');
    await expect(page.locator('.gp-boot')).not.toBeVisible();
    await ctx.close();
  });
});
```

- [ ] **Step 2: Build and run**

```bash
bun run build && bun run test:e2e tests/e2e/boot-flow.spec.ts
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/boot-flow.spec.ts
git commit -m "test(e2e): add boot flow Playwright spec"
```

---

## Task 10: Write worldmap-dialog E2E spec

**Files:**
- Create: `tests/e2e/worldmap-dialog.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Skip boot/title so we land directly in EXPLORE with world map active
  await page.addInitScript(() => sessionStorage.setItem('gp-booted', '1'));
  await page.goto('/');
});

test.describe('WorldMap dialog', () => {
  test('world map timeline is visible', async ({ page }) => {
    await expect(page.locator('#world-map-timeline')).toBeVisible();
  });

  test('ArrowDown moves hero canvas top position', async ({ page }) => {
    const canvas = page.locator('.wm-hero-canvas');
    await expect(canvas).toBeVisible();
    const initialTop = await canvas.evaluate((el: HTMLElement) => el.style.top);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150); // allow 2-3 rAF ticks at 60fps
    const movedTop = await canvas.evaluate((el: HTMLElement) => el.style.top);
    expect(movedTop).not.toBe(initialTop);
  });

  test('node button click opens dialog with correct company name', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible();
    await expect(page.locator('.wm-dialog__company')).toContainText('Nera');
  });

  test('Escape key closes open dialog', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.wm-dialog-panel')).not.toBeVisible();
  });

  test('CLOSE button closes dialog', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible();
    await page.locator('.wm-dialog__btn--close').click();
    await expect(page.locator('.wm-dialog-panel')).not.toBeVisible();
  });

  test('touch device: node tap opens dialog directly (no hero canvas)', async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem('gp-booted', '1'));
    await page.goto('/');
    // On touch device, hero canvas is not rendered
    await expect(page.locator('.wm-hero-canvas')).not.toBeVisible();
    // Tapping node directly opens dialog
    await page.locator('.wm-node').first().tap();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible();
    await ctx.close();
  });
});
```

- [ ] **Step 2: Run**

```bash
bun run test:e2e tests/e2e/worldmap-dialog.spec.ts
```

Expected: 6 tests pass (build was run in Task 9, `reuseExistingServer` keeps preview alive).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/worldmap-dialog.spec.ts
git commit -m "test(e2e): add worldmap dialog Playwright spec"
```

---

## Task 11: Write GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create directory and write workflow**

```bash
mkdir -p .github/workflows
```

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  unit:
    name: Vitest unit/integration
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Run Vitest
        run: bun run test

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium
      - name: Build site
        run: bun run build
      - name: Run Playwright
        run: bun run test:e2e
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add GitHub Actions workflow for vitest and playwright"
```

- [ ] **Step 3: Push and verify CI**

```bash
git push
```

Expected: both `unit` and `e2e` jobs green in the Actions tab. If E2E fails in CI but passes locally, check that `bun run preview` is starting correctly (the webServer config).

---

## Task 12: Update Linear GP-20 through GP-26 with test specs

**Files:** (none — Linear API calls)

For each issue below, use the `mcp__plugin_linear_linear__save_issue` tool to append `## Testing Specification` to the description. Fetch the current description first with `get_issue` to avoid overwriting it.

Do them in order. If an issue has no description, create one with just the testing section.

---

**GP-20 — panelReveal.ts (IntersectionObserver)**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom):**
- `mount()` returns a cleanup function
- IntersectionObserver callback fires on observed element → `.panel--revealed` class added
- `prefers-reduced-motion: reduce` → `.panel--revealed` added immediately without waiting for observer
- Cleanup calls `observer.disconnect()` on all observed panels

**E2E (Playwright — scroll-triggered):**
- Panel below fold has no `.panel--revealed` class on load
- Scroll panel into view → `.panel--revealed` class added within 500ms
- `prefers-reduced-motion: reduce` context → all panels have `.panel--revealed` on load
```

**GP-21 — AbilityStats animated bars**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom):**
- Bars start at `width: 0%` before viewport entry
- After IntersectionObserver fires → bars animate toward target width
- `prefers-reduced-motion: reduce` → bars jump immediately to target width (no rAF loop)
- LVL counter starts at 0, counts up to `stat.lvl` value
- Cleanup cancels pending rAF and removes observer

**E2E (Playwright):**
- Scroll AbilityStats panel into view → bar fill animation plays (width > 0 after 1s)
- `prefers-reduced-motion: reduce` → bars are at full width immediately
```

**GP-22 — WorldMap progressive disclosure**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom):**
- Unvisited `.wm-card` renders `??? ENCRYPTED` for role, gear, quest
- After `markVisited(index)` → card shows real job data
- `gp-visited-nodes` in sessionStorage persists visited set across `mount()` calls
- Node 0 (current job) is never hidden (always visible as "NOW PLAYING")

**E2E (Playwright):**
- On fresh session: job cards 1-4 show `??? ENCRYPTED` content
- Walk hero to node 1, press Z → dialog opens AND card content reveals
- Reload page → card 1 still shows real content (sessionStorage persisted)
```

**GP-23 — QuestLog typewriter**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom + fake timers):**
- On IntersectionObserver fire: quest entry 0 visible immediately
- Entry 1 visible after 120ms, entry 2 after 240ms (stagger)
- Typewriter appends one char per ~30ms to the note text
- `prefers-reduced-motion: reduce` → all entries appear instantly, full text shown
- Cleanup clears all pending `setTimeout` handles

**E2E (Playwright):**
- Scroll QuestLog into view → entries cascade in (count changes over 600ms)
- `prefers-reduced-motion: reduce` context → all entries visible immediately
```

**GP-24 — SkillTree collect**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom):**
- Uncollected chip: `opacity` style = "0.25", filter contains "grayscale"
- Click chip → collected: opacity = "1", filter = "none" (or empty)
- Z key on focused chip inside SkillTree → collects it
- `gp-collected-skills` sessionStorage updated after collect
- Collected set persists across `mount()` calls (re-read from sessionStorage)
- After collect, `gp:stat-update` CustomEvent dispatched with `{ skills: N }`

**E2E (Playwright):**
- Chip starts visually dim on page load
- Click chip → chip brightens, counter in HUD increments
- Reload → collected chips remain bright
```

**GP-25 — HUD live stats**

Append to description:
```
## Testing Specification

**Vitest (unit):**
- `dispatchEvent(new CustomEvent('gp:stat-update', { detail: { nodes: 2, skills: 8 } }))` →
  HUD shows "NODES 2/5" and "SKILLS 8/27"
- Level formula: 0 nodes + 0 skills = LV.1; all nodes + all skills = LV.10
- Level boundary: correct LV at each threshold (verify at least 3 boundary values)
- `mount()` returns cleanup; cleanup removes the `gp:stat-update` listener

**E2E (Playwright):**
- Explore node → NODES counter in HUD increments by 1
- Collect skill → SKILLS counter increments by 1
- Level display updates after reaching a new threshold
```

**GP-26 — CRT effects**

Append to description:
```
## Testing Specification

**Vitest (integration, happy-dom):**
- After `mount()`: scanline overlay element present in `document.body`
- `mouseenter` on `.pixel-panel` → glitch CSS class added
- `mouseleave` on `.pixel-panel` → glitch CSS class removed
- `prefers-reduced-motion: reduce` → no glitch class added on hover
- Cleanup removes overlay element from DOM and removes all listeners

**E2E (Playwright):**
- Scanline overlay element exists and is visible on page load
- Hover `.pixel-panel` → glitch animation class present for ~200ms then removed
- `prefers-reduced-motion: reduce` context → no glitch on hover
```

- [ ] **Step 1: Fetch and update GP-20**

Use `mcp__plugin_linear_linear__get_issue` with `id: "GP-20"`, then `mcp__plugin_linear_linear__save_issue` with the existing description + the new testing section appended.

- [ ] **Step 2: Repeat for GP-21 through GP-26**

Same pattern for each: get → append → save.

- [ ] **Step 3: Verify in Linear UI**

Open each issue and confirm the `## Testing Specification` section is present.

---

## Task 13: Final integration check + commit

**Files:** (verification only)

- [ ] **Step 1: Run all Vitest tests with coverage**

```bash
bun run test:coverage
```

Expected: all pass, lines ≥ 80%, functions ≥ 80%.

- [ ] **Step 2: Run all Playwright tests**

```bash
bun run build && bun run test:e2e
```

Expected: 11 tests pass (5 boot-flow + 6 worldmap-dialog).

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "test: complete test suite — vitest + playwright + CI"
```

- [ ] **Step 4: Push**

```bash
git push
```

Expected: both CI jobs green.

---

## Self-Review Notes

- All `portfolio.experience[0].company` references use `"Nera"` — verified against `src/data/portfolio.ts:26`
- `PROX = 24` constant verified at `src/game/worldMap.ts:5`
- `GameLayer.tsx:65` — `if (state === 'EXPLORE') return null` — confirms `renders null in EXPLORE` test
- `rafCallback` capture pattern used consistently across Task 5 — loop is driven identically in all proximity tests
- `getViteConfig` from `astro/config` eliminates need for `@vitejs/plugin-react` — keeps deps minimal
- Spec requirement "Linear issues have test specs" → Task 12 covers GP-20 through GP-26 (7 issues)
- Spec requirement "CI green" → Task 11 covers both unit and e2e jobs
- `--frozen-lockfile` in CI prevents accidental dep drift
