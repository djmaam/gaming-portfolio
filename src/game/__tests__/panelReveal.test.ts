import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, STAGGER_MS, REVEALED_CLASS } from '../panelReveal';
import { MockIntersectionObserver } from './setup';

function buildPanels(tops: number[], variants?: string[]): HTMLElement[] {
  document.body.innerHTML = '';
  return tops.map((top, i) => {
    const el = document.createElement('div');
    el.className = 'pixel-panel';
    el.setAttribute('data-reveal', variants?.[i] ?? 'slide-up');
    el.getBoundingClientRect = () =>
      ({ top, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(el);
    return el;
  });
}

function makeEntry(target: Element, isIntersecting: boolean, top = 0) {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top } as DOMRectReadOnly,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('panelReveal — opt-in via [data-reveal]', () => {
  it('ignores .pixel-panel without data-reveal attribute', () => {
    document.body.innerHTML = '<div class="pixel-panel"></div>';
    const cleanup = mount();
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });

  it('observes only panels with data-reveal', () => {
    buildPanels([0, 100]);
    document.body.appendChild(Object.assign(document.createElement('div'), { className: 'pixel-panel' }));
    mount();
    expect(MockIntersectionObserver.last!.observe).toHaveBeenCalledTimes(2);
  });
});

describe('panelReveal — observer setup', () => {
  it('uses threshold 0 so tall panels on short viewports still fire', () => {
    buildPanels([0]);
    mount();
    expect(MockIntersectionObserver.last!.options?.threshold).toBe(0);
  });
});

describe('panelReveal — JS-timed stagger', () => {
  it('first row reveals immediately, later rows via setTimeout at i * STAGGER_MS', () => {
    vi.useFakeTimers();
    const [row0, row1, row2] = buildPanels([0, 200, 400]);
    mount();
    MockIntersectionObserver.last!.trigger([
      makeEntry(row0, true, 0),
      makeEntry(row1, true, 200),
      makeEntry(row2, true, 400),
    ]);
    expect(row0.classList.contains(REVEALED_CLASS)).toBe(true);
    expect(row1.classList.contains(REVEALED_CLASS)).toBe(false);
    expect(row2.classList.contains(REVEALED_CLASS)).toBe(false);

    vi.advanceTimersByTime(STAGGER_MS);
    expect(row1.classList.contains(REVEALED_CLASS)).toBe(true);
    expect(row2.classList.contains(REVEALED_CLASS)).toBe(false);

    vi.advanceTimersByTime(STAGGER_MS);
    expect(row2.classList.contains(REVEALED_CLASS)).toBe(true);
  });

  it('row-grouping: side-by-side panels (same top within tolerance) share stagger index', () => {
    vi.useFakeTimers();
    // Two panels at top 100 (same row), one at 300 (next row)
    const [a, b, c] = buildPanels([100, 100, 300]);
    mount();
    MockIntersectionObserver.last!.trigger([
      makeEntry(a, true, 100),
      makeEntry(b, true, 100),
      makeEntry(c, true, 300),
    ]);
    // a and b are the first row → immediate reveal
    expect(a.classList.contains(REVEALED_CLASS)).toBe(true);
    expect(b.classList.contains(REVEALED_CLASS)).toBe(true);
    // c is the second row → wait STAGGER_MS
    expect(c.classList.contains(REVEALED_CLASS)).toBe(false);
    vi.advanceTimersByTime(STAGGER_MS);
    expect(c.classList.contains(REVEALED_CLASS)).toBe(true);
  });

  it('does not set inline animationDelay style (stagger is JS-timed)', () => {
    const [a] = buildPanels([0]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(a, true, 0)]);
    expect(a.style.animationDelay).toBe('');
  });
});

describe('panelReveal — reveal behavior', () => {
  it('unobserves each panel after it intersects', () => {
    const [a, b] = buildPanels([0, 100]);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    expect(io.unobserve).toHaveBeenCalledWith(a);
    expect(io.unobserve).not.toHaveBeenCalledWith(b);
  });

  it('skips entries that already carry .panel--revealed (re-mount safety)', () => {
    const [a] = buildPanels([0]);
    a.classList.add(REVEALED_CLASS);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    // unobserve should not be called since the entry was filtered out
    expect(io.unobserve).not.toHaveBeenCalled();
  });
});

describe('panelReveal — reduced motion', () => {
  it('reveals every panel immediately and does NOT create an observer', () => {
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
    const panels = buildPanels([0, 100, 200]);
    const cleanup = mount();
    panels.forEach(p => expect(p.classList.contains(REVEALED_CLASS)).toBe(true));
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });
});

describe('panelReveal — IntersectionObserver missing', () => {
  it('reveals every panel and bails when IntersectionObserver is undefined', () => {
    const saved = window.IntersectionObserver;
    Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: undefined });
    try {
      const panels = buildPanels([0, 100]);
      const cleanup = mount();
      panels.forEach(p => expect(p.classList.contains(REVEALED_CLASS)).toBe(true));
      cleanup();
    } finally {
      Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: saved });
    }
  });
});

describe('panelReveal — cleanup', () => {
  it('cleanup disconnects the active observer', () => {
    buildPanels([0]);
    const cleanup = mount();
    const io = MockIntersectionObserver.last!;
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('cleanup clears pending stagger timers (no late class adds)', () => {
    vi.useFakeTimers();
    const [a, b] = buildPanels([0, 200]);
    const cleanup = mount();
    MockIntersectionObserver.last!.trigger([
      makeEntry(a, true, 0),
      makeEntry(b, true, 200),
    ]);
    // a revealed immediately, b is queued at STAGGER_MS
    expect(b.classList.contains(REVEALED_CLASS)).toBe(false);
    cleanup();
    vi.advanceTimersByTime(STAGGER_MS * 5);
    // b should NEVER get the class — its timer was cleared
    expect(b.classList.contains(REVEALED_CLASS)).toBe(false);
  });
});
