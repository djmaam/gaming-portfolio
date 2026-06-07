import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameState } from '../useGameState';

describe('useGameState', () => {
  // setup.ts clears sessionStorage and vi.clearAllMocks() before each test

  it('defaults to EXPLORE state (SSR default; stays EXPLORE when prefers-reduced-motion)', () => {
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
