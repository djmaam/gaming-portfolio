import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mount, ANIM_MS, STAGGER_MS, FILLED_CLASS } from '../abilityStats';
import { MockIntersectionObserver } from './setup';

interface BuildRow { lvl: number; }

function buildPanel(rows: BuildRow[]): { panel: HTMLElement; rows: HTMLElement[]; cellsOf: (r: HTMLElement) => HTMLElement[]; lvOf: (r: HTMLElement) => HTMLElement } {
  document.body.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'pixel-panel ability-stats';
  panel.setAttribute('data-reveal', 'slide-up');

  const list = document.createElement('div');
  list.className = 'stats-list';

  const rowEls = rows.map((r, idx) => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.setAttribute('data-lvl', String(r.lvl));
    row.setAttribute('data-stat-index', String(idx));

    const header = document.createElement('div');
    header.className = 'stat-row__header';
    const lv = document.createElement('span');
    lv.className = 'stat-row__lv';
    lv.textContent = `LV${r.lvl}`;
    header.appendChild(lv);

    const bar = document.createElement('div');
    bar.className = 'stat-row__bar';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('div');
      cell.className = i < r.lvl ? `stat-cell ${FILLED_CLASS}` : 'stat-cell';
      if (i < r.lvl) cell.style.background = 'var(--c-green)';
      bar.appendChild(cell);
    }

    row.appendChild(header);
    row.appendChild(bar);
    list.appendChild(row);
    return row;
  });

  panel.appendChild(list);
  document.body.appendChild(panel);

  return {
    panel,
    rows: rowEls,
    cellsOf: r => Array.from(r.querySelectorAll<HTMLElement>('.stat-cell')),
    lvOf:    r => r.querySelector<HTMLElement>('.stat-row__lv')!,
  };
}

function makeEntry(target: Element, isIntersecting: boolean) {
  return { target, isIntersecting } as IntersectionObserverEntry;
}

// Drive rAF: capture last callback installed via the setup.ts mock, invoke
// with controlled time so animations can be stepped deterministically.
function captureRaf(): (now: number) => void {
  const calls = vi.mocked(window.requestAnimationFrame).mock.calls;
  const cb = calls[calls.length - 1][0] as (now: number) => void;
  return cb;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('abilityStats — initial reset on mount', () => {
  it('no panel present → no-op (no observer)', () => {
    document.body.innerHTML = '';
    const cleanup = mount();
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });

  it('clears every cell and zeroes LV text before any reveal', () => {
    const { rows, cellsOf, lvOf } = buildPanel([{ lvl: 9 }, { lvl: 5 }]);
    mount();
    rows.forEach(row => {
      cellsOf(row).forEach(cell => {
        expect(cell.classList.contains(FILLED_CLASS)).toBe(false);
        expect(cell.style.background).toBe('');
      });
      expect(lvOf(row).textContent).toBe('LV0');
    });
  });
});

describe('abilityStats — observer setup', () => {
  it('observes the .ability-stats panel itself (not individual rows)', () => {
    const { panel } = buildPanel([{ lvl: 9 }]);
    mount();
    const io = MockIntersectionObserver.last!;
    expect(io.observe).toHaveBeenCalledTimes(1);
    expect(io.observe).toHaveBeenCalledWith(panel);
  });
});

describe('abilityStats — staggered reveal', () => {
  it('first row animates immediately on intersect; later rows wait STAGGER_MS', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, rows, cellsOf, lvOf } = buildPanel([{ lvl: 8 }, { lvl: 6 }]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);

    // Row 0 should have started — its rAF was scheduled, drive to completion
    let cb = captureRaf();
    cb(ANIM_MS);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(8);
    expect(lvOf(rows[0]).textContent).toBe('LV8');
    // Row 1 still pending stagger
    expect(cellsOf(rows[1]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(0);
    expect(lvOf(rows[1]).textContent).toBe('LV0');

    vi.advanceTimersByTime(STAGGER_MS);
    cb = captureRaf();
    cb(ANIM_MS);
    expect(cellsOf(rows[1]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(6);
    expect(lvOf(rows[1]).textContent).toBe('LV6');
  });
});

describe('abilityStats — count-up progression', () => {
  it('fills cells progressively as rAF time advances', () => {
    const { panel, rows, cellsOf, lvOf } = buildPanel([{ lvl: 10 }]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    const cb = captureRaf();

    cb(0);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(0);
    expect(lvOf(rows[0]).textContent).toBe('LV0');

    cb(ANIM_MS / 2);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(5);
    expect(lvOf(rows[0]).textContent).toBe('LV5');

    cb(ANIM_MS);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(10);
    expect(lvOf(rows[0]).textContent).toBe('LV10');
  });

  it('clamps to target at progress >= 1', () => {
    const { panel, rows, cellsOf, lvOf } = buildPanel([{ lvl: 7 }]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    const cb = captureRaf();
    cb(ANIM_MS * 5);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(7);
    expect(lvOf(rows[0]).textContent).toBe('LV7');
  });
});

describe('abilityStats — re-entry safety', () => {
  it('subsequent intersects after a row has played are ignored', () => {
    const { panel, rows, cellsOf, lvOf } = buildPanel([{ lvl: 9 }]);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(panel, true)]);
    captureRaf()(ANIM_MS);
    expect(lvOf(rows[0]).textContent).toBe('LV9');
    const rafCount = vi.mocked(window.requestAnimationFrame).mock.calls.length;
    io.trigger([makeEntry(panel, true)]);
    // No new rAF scheduled; cells unchanged
    expect(vi.mocked(window.requestAnimationFrame).mock.calls.length).toBe(rafCount);
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(9);
  });
});

describe('abilityStats — reduced motion', () => {
  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders final state instantly, no observer, no rAF', () => {
    const { rows, cellsOf, lvOf } = buildPanel([{ lvl: 9 }, { lvl: 5 }]);
    mount();
    expect(MockIntersectionObserver.last).toBeNull();
    expect(vi.mocked(window.requestAnimationFrame)).not.toHaveBeenCalled();
    expect(cellsOf(rows[0]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(9);
    expect(lvOf(rows[0]).textContent).toBe('LV9');
    expect(cellsOf(rows[1]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(5);
    expect(lvOf(rows[1]).textContent).toBe('LV5');
  });
});

describe('abilityStats — cleanup', () => {
  it('disconnects observer and clears pending stagger timers', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, rows, cellsOf, lvOf } = buildPanel([{ lvl: 8 }, { lvl: 6 }]);
    const cleanup = mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(panel, true)]);
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
    vi.advanceTimersByTime(STAGGER_MS * 5);
    // Row 1 staggered start should never fire after cleanup
    expect(cellsOf(rows[1]).filter(c => c.classList.contains(FILLED_CLASS))).toHaveLength(0);
    expect(lvOf(rows[1]).textContent).toBe('LV0');
  });

  it('cancels rAF on cleanup', () => {
    const { panel } = buildPanel([{ lvl: 8 }]);
    const cleanup = mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    cleanup();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
