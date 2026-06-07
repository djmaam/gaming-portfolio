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

// document.visibilityState — worldMap.ts pauses rAF loop when 'hidden'
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

// IntersectionObserver — happy-dom does not implement it. Mock captures the
// most-recently-constructed instance + exposes a trigger() helper so tests can
// drive the callback. panelReveal.ts only ever uses one observer at a time.
type IOEntryLike = Partial<IntersectionObserverEntry> & { target: Element; isIntersecting: boolean };
class MockIntersectionObserver {
  static last: MockIntersectionObserver | null = null;
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed = new Set<Element>();
  observe = vi.fn((el: Element) => { this.observed.add(el); });
  unobserve = vi.fn((el: Element) => { this.observed.delete(el); });
  disconnect = vi.fn(() => { this.observed.clear(); });
  constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
    this.callback = cb;
    this.options = opts;
    MockIntersectionObserver.last = this;
  }
  trigger(entries: IOEntryLike[]): void {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
export { MockIntersectionObserver };

// Canvas 2D context — happy-dom does not implement the Canvas API; stub it out
// so worldMap.ts can call drawSprite() without crashing.
const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  get fillStyle() { return ''; },
  set fillStyle(_v: string) {},
};
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as never;

// performance.now — returns 0 at mount; loop uses the rAF `now` param, not this
vi.spyOn(performance, 'now').mockReturnValue(0);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  document.body.innerHTML = '';
  MockIntersectionObserver.last = null;
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
  let _rafId = 0;
  vi.mocked(window.requestAnimationFrame).mockImplementation(() => ++_rafId);
  vi.mocked(performance.now).mockReturnValue(0);
});
