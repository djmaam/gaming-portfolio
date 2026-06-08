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

  it('does not duplicate the overlay across re-mounts, and a fresh mount restores exactly one', () => {
    const c1 = mount();
    const c2 = mount();
    expect(document.querySelectorAll(`#${OVERLAY_ID}`).length).toBe(1);
    c1();
    c2();
    // Both cleanups complete → overlay must be fully gone, not just hidden.
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
    const c3 = mount();
    expect(document.querySelectorAll(`#${OVERLAY_ID}`).length).toBe(1);
    c3();
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
  });

  it('a second mount() does NOT attach duplicate mouseenter listeners to a wired panel', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const c1 = mount();
    const c2 = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    // Single fire → exactly one removeTimer + one cooldownTimer (2 pending).
    // If a duplicate listener were attached, the same mouseenter would also
    // fire the second ctx's onEnter (which sees inCooldown=false on its own
    // ctx and would schedule a second pair of timers — 4 total).
    expect(vi.getTimerCount()).toBe(2);
    c1();
    c2();
  });
});

describe('ambientFx — panel glitch on hover', () => {
  it('mouseenter on a .pixel-panel adds the glitch class', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    cleanup();
  });

  it('the glitch class is auto-removed after GLITCH_HOLD_MS', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    vi.advanceTimersByTime(GLITCH_HOLD_MS);
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    cleanup();
  });

  it('mouseleave inside the GLITCH_HOLD_MS window removes the class BEFORE the auto-remove timer would fire', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    // Class is gone immediately on leave, not just after the timer.
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    // Advancing past GLITCH_HOLD_MS must not re-add or toggle anything.
    vi.advanceTimersByTime(GLITCH_HOLD_MS * 2);
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    cleanup();
  });

  it('re-entering before the cooldown elapses does NOT re-fire the glitch', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    panel.dispatchEvent(new MouseEvent('mouseleave'));
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    vi.advanceTimersByTime(GLITCH_COOLDOWN_MS);
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    cleanup();
  });

  it('attaches handlers to every .pixel-panel present at mount time', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const a = buildPanel();
    const b = buildPanel();
    const cleanup = mount();
    a.dispatchEvent(new MouseEvent('mouseenter'));
    b.dispatchEvent(new MouseEvent('mouseenter'));
    expect(a.classList.contains(GLITCH_CLASS)).toBe(true);
    expect(b.classList.contains(GLITCH_CLASS)).toBe(true);
    cleanup();
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

  it('strips the glitch class from any mid-glitch panel so it does not stay stuck after unmount', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(true);
    cleanup();
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
    // Pending removeTimer + cooldownTimer must be cancelled — advancing
    // well past both windows must not toggle anything.
    vi.advanceTimersByTime(GLITCH_COOLDOWN_MS * 2);
    expect(panel.classList.contains(GLITCH_CLASS)).toBe(false);
  });

  it('cancels both removeTimer and cooldownTimer on cleanup', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const panel = buildPanel();
    const cleanup = mount();
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    expect(vi.getTimerCount()).toBe(2);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });
});
