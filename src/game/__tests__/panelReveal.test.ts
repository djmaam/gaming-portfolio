import { describe, it, expect, vi } from 'vitest';
import { mount } from '../panelReveal';
import { MockIntersectionObserver } from './setup';

function buildPanels(count: number, variants: string[] = []): HTMLElement[] {
  document.body.innerHTML = '';
  const panels: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'pixel-panel';
    if (variants[i]) el.setAttribute('data-reveal', variants[i]);
    document.body.appendChild(el);
    panels.push(el);
  }
  return panels;
}

function makeEntry(target: Element, isIntersecting: boolean, top = 0) {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top } as DOMRectReadOnly,
  };
}

describe('panelReveal — mount API', () => {
  it('returns a cleanup function', () => {
    buildPanels(1);
    const cleanup = mount();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('no-ops cleanly when no .pixel-panel elements exist', () => {
    document.body.innerHTML = '';
    const cleanup = mount();
    expect(MockIntersectionObserver.last).toBeNull();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});

describe('panelReveal — observer setup', () => {
  it('instantiates IntersectionObserver with threshold 0.12', () => {
    buildPanels(3);
    mount();
    expect(MockIntersectionObserver.last).not.toBeNull();
    expect(MockIntersectionObserver.last!.options?.threshold).toBe(0.12);
  });

  it('observes every .pixel-panel in the document', () => {
    const panels = buildPanels(4);
    mount();
    const io = MockIntersectionObserver.last!;
    expect(io.observe).toHaveBeenCalledTimes(4);
    panels.forEach(p => expect(io.observed.has(p)).toBe(true));
  });
});

describe('panelReveal — reveal behavior', () => {
  it('adds .panel--revealed when an entry intersects', () => {
    const [a, b] = buildPanels(2);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    expect(a.classList.contains('panel--revealed')).toBe(true);
    expect(b.classList.contains('panel--revealed')).toBe(false);
  });

  it('does NOT reveal non-intersecting entries', () => {
    const [a] = buildPanels(1);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, false, 0)]);
    expect(a.classList.contains('panel--revealed')).toBe(false);
  });

  it('unobserves each panel after it is revealed', () => {
    const [a, b] = buildPanels(2);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    expect(io.unobserve).toHaveBeenCalledWith(a);
    expect(io.unobserve).not.toHaveBeenCalledWith(b);
  });

  it('disconnects observer once every panel has been revealed', () => {
    const [a, b] = buildPanels(2);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    expect(io.disconnect).not.toHaveBeenCalled();
    io.trigger([makeEntry(b, true, 0)]);
    expect(io.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('panelReveal — stagger', () => {
  it('assigns animation-delay 0/60/120ms to a batch sorted by top position', () => {
    const [a, b, c] = buildPanels(3);
    mount();
    const io = MockIntersectionObserver.last!;
    // Pass entries OUT of DOM order to verify sorting by boundingClientRect.top
    io.trigger([
      makeEntry(c, true, 240),
      makeEntry(a, true, 0),
      makeEntry(b, true, 120),
    ]);
    expect(a.style.animationDelay).toBe('0ms');
    expect(b.style.animationDelay).toBe('60ms');
    expect(c.style.animationDelay).toBe('120ms');
  });

  it('resets stagger index per batch (later single reveal gets 0ms delay)', () => {
    const [a, b] = buildPanels(2);
    mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(a, true, 0)]);
    io.trigger([makeEntry(b, true, 200)]);
    expect(b.style.animationDelay).toBe('0ms');
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
    const panels = buildPanels(3);
    const cleanup = mount();
    panels.forEach(p => expect(p.classList.contains('panel--revealed')).toBe(true));
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });
});

describe('panelReveal — cleanup', () => {
  it('cleanup disconnects the active observer', () => {
    buildPanels(2);
    const cleanup = mount();
    const io = MockIntersectionObserver.last!;
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
  });
});
