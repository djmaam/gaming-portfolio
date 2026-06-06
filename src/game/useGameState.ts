import { useState, useEffect, useCallback } from 'react';

export type GameState = 'BOOT' | 'TITLE' | 'EXPLORE';

const BOOTED_KEY = 'gp-booted';

export function useGameState() {
  // Start EXPLORE so SSR HTML and initial hydration match (no overlay flash)
  const [state, setState] = useState<GameState>('EXPLORE');

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasBooted = sessionStorage.getItem(BOOTED_KEY) === '1';
    if (!prefersReduced && !hasBooted) {
      setState('BOOT');
    }
  }, []);

  const advance = useCallback((to: GameState) => {
    if (to === 'EXPLORE') {
      sessionStorage.setItem(BOOTED_KEY, '1');
    }
    setState(to);
  }, []);

  return { state, advance };
}
