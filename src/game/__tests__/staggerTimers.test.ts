import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStaggerSet } from '../lib/staggerTimers';

afterEach(() => vi.useRealTimers());

describe('createStaggerSet', () => {
  it('fires scheduled fn after the given delay', () => {
    vi.useFakeTimers();
    const s = createStaggerSet();
    const fn = vi.fn();
    s.schedule(fn, 100);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires multiple scheduled fns at their own delays', () => {
    vi.useFakeTimers();
    const s = createStaggerSet();
    const a = vi.fn(); const b = vi.fn(); const c = vi.fn();
    s.schedule(a, 50);
    s.schedule(b, 100);
    s.schedule(c, 150);
    vi.advanceTimersByTime(50);  expect(a).toHaveBeenCalled(); expect(b).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);  expect(b).toHaveBeenCalled(); expect(c).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);  expect(c).toHaveBeenCalled();
  });

  it('clear() cancels pending fns', () => {
    vi.useFakeTimers();
    const s = createStaggerSet();
    const fn = vi.fn();
    s.schedule(fn, 100);
    s.clear();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it('clear() after some have fired only cancels those still pending', () => {
    vi.useFakeTimers();
    const s = createStaggerSet();
    const a = vi.fn(); const b = vi.fn();
    s.schedule(a, 50);
    s.schedule(b, 200);
    vi.advanceTimersByTime(50);
    expect(a).toHaveBeenCalled();
    s.clear();
    vi.advanceTimersByTime(500);
    expect(b).not.toHaveBeenCalled();
  });

  it('a fired timer is removed from the tracking set (clear() after fire is a no-op)', () => {
    vi.useFakeTimers();
    const s = createStaggerSet();
    const fn = vi.fn();
    s.schedule(fn, 100);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    s.clear();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
