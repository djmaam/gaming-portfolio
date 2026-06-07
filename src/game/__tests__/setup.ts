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
  let _rafId = 0;
  vi.mocked(window.requestAnimationFrame).mockImplementation(() => ++_rafId);
  vi.mocked(performance.now).mockReturnValue(0);
});
