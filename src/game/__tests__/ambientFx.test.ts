import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  mount,
  OVERLAY_ID,
  GLITCH_CLASS,
  GLITCH_HOLD_MS,
  GLITCH_COOLDOWN_MS,
} from '../ambientFx';

function buildPanel(): HTMLElement {
  const panel = document.createElement('section');
  panel.className = 'pixel-panel';
  document.body.appendChild(panel);
  return panel;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ambientFx — overlay creation', () => {
  it('creates the CRT overlay element on the body after mount', () => {
    mount();
    const overlay = document.getElementById(OVERLAY_ID);
    expect(overlay).not.toBeNull();
    expect(overlay!.parentElement).toBe(document.body);
    expect(overlay!.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not duplicate the overlay across re-mounts', () => {
    const c1 = mount();
    const c2 = mount();
    expect(document.querySelectorAll(`#${OVERLAY_ID}`).length).toBe(1);
    c1();
    c2();
  });
});

describe('ambientFx — panel glitch on hover', () => {
  it('mouseenter on a .pixel-panel adds the glitch class', () => {
    const panel = buildPanel();
    mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
  });

  it('the glitch class is auto-removed after GLITCH_HOLD_MS', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    vi.advanceTimersByTime(GLITCH_HOLD_MS);
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
  });

  it('mouseleave immediately removes the glitch class', () => {
    const panel = buildPanel();
    mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
  });

  it('re-entering before the cooldown elapses does NOT re-fire the glitch', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    vi.advanceTimersByTime(GLITCH_COOLDOWN_MS);
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
  });

  it('attaches handlers to every .pixel-panel present at mount time', () => {
    const a = buildPanel();
    const b = buildPanel();
    mount();
    a.dispatchEvent(new MouseEvent('mouseenter'));
    b.dispatchEvent(new MouseEvent('mouseenter'));
    expect(a.classList.contains(GLITCH_CLASS)).toBe(true);
    expect(b.classList.contains(GLITCH_CLASS)).toBe(true);
  });
});

describe('ambientFx — reduced motion', () => {
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

  it('no overlay element created when reduced-motion is requested', () => {
    mount();
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
  });

  it('no glitch class added on hover under reduced motion', () => {
    const panel = buildPanel();
    mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
  });
});

describe('ambientFx — cleanup', () => {
  it('removes the overlay element and detaches mouse listeners', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    expect(document.getElementById(OVERLAY_ID)).not.toBeNull();
    cleanup();
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
  });

  it('clears any pending glitch removal timer so it cannot fire after cleanup', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    cleanup();
    panel.classList.add(GLITCH_CLASS);
    vi.advanceTimersByTime(GLITCH_HOLD_MS * 5);
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
  });
});
