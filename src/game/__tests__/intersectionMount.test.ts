import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountIntersection } from '../lib/intersectionMount';
import { MockIntersectionObserver } from './setup';

function mkEl(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('mountIntersection — empty targets', () => {
  it('returns a no-op cleanup and creates no observer', () => {
    const cleanup = mountIntersection([], () => {}, () => {});
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });
});

describe('mountIntersection — reduced motion fallback', () => {
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

  it('calls fallback with all targets and does not create an observer', () => {
    const a = mkEl(); const b = mkEl();
    const fallback = vi.fn();
    mountIntersection([a, b], () => {}, fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback.mock.calls[0][0]).toEqual([a, b]);
    expect(MockIntersectionObserver.last).toBeNull();
  });
});

describe('mountIntersection — IntersectionObserver undefined', () => {
  it('calls fallback and bails without crashing', () => {
    const saved = window.IntersectionObserver;
    Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: undefined });
    try {
      const a = mkEl();
      const fallback = vi.fn();
      mountIntersection([a], () => {}, fallback);
      expect(fallback).toHaveBeenCalledWith([a]);
    } finally {
      Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: saved });
    }
  });
});

describe('mountIntersection — normal path', () => {
  it('observes every target and uses threshold 0 by default', () => {
    const a = mkEl(); const b = mkEl();
    mountIntersection([a, b], () => {}, () => {});
    const io = MockIntersectionObserver.last!;
    expect(io.observe).toHaveBeenCalledTimes(2);
    expect(io.observe).toHaveBeenCalledWith(a);
    expect(io.observe).toHaveBeenCalledWith(b);
    expect(io.options?.threshold).toBe(0);
  });

  it('passes a custom threshold through', () => {
    const a = mkEl();
    mountIntersection([a], () => {}, () => {}, { threshold: 0.5 });
    expect(MockIntersectionObserver.last!.options?.threshold).toBe(0.5);
  });

  it('routes IO entries to the onIntersect callback', () => {
    const a = mkEl();
    const onIntersect = vi.fn();
    mountIntersection([a], onIntersect, () => {});
    const io = MockIntersectionObserver.last!;
    io.trigger([{ target: a, isIntersecting: true } as unknown as IntersectionObserverEntry]);
    expect(onIntersect).toHaveBeenCalledTimes(1);
    expect((onIntersect.mock.calls[0][0] as IntersectionObserverEntry[])[0].target).toBe(a);
  });

  it('cleanup disconnects the observer', () => {
    const a = mkEl();
    const cleanup = mountIntersection([a], () => {}, () => {});
    const io = MockIntersectionObserver.last!;
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('passes the observer instance as the 2nd arg of onIntersect', () => {
    const a = mkEl();
    const onIntersect = vi.fn();
    mountIntersection([a], onIntersect, () => {});
    const io = MockIntersectionObserver.last!;
    io.trigger([{ target: a, isIntersecting: true } as unknown as IntersectionObserverEntry]);
    // Mock callback signature: (entries, observer)
    expect(onIntersect.mock.calls[0][1]).toBeDefined();
  });
});
