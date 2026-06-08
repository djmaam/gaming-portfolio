import { createStaggerSet } from './lib/staggerTimers';
import { mountIntersection } from './lib/intersectionMount';

export const REVEALED_CLASS = 'panel--revealed';
export const STAGGER_MS     = 60;
export const ROW_TOLERANCE_PX = 16;

function revealAll(panels: HTMLElement[]): void {
  panels.forEach(p => p.classList.add(REVEALED_CLASS));
}

export function mount(): () => void {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.pixel-panel[data-reveal]'));
  const timers = createStaggerSet();

  const cleanupIO = mountIntersection(panels, (entries, io) => {
    const visible = entries
      .filter(e => e.isIntersecting && !e.target.classList.contains(REVEALED_CLASS))
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!visible.length) return;

    // Row-grouping: panels sharing a horizontal row (top within tolerance)
    // get the SAME stagger index so side-by-side grid cells animate together
    // instead of stuttering 60ms apart.
    let lastTop = -Infinity;
    let rowIdx = -1;
    for (const entry of visible) {
      const top = entry.boundingClientRect.top;
      if (top - lastTop > ROW_TOLERANCE_PX) rowIdx++;
      lastTop = top;
      const el = entry.target as HTMLElement;
      io.unobserve(el);
      if (rowIdx === 0) {
        el.classList.add(REVEALED_CLASS);
      } else {
        timers.schedule(() => el.classList.add(REVEALED_CLASS), rowIdx * STAGGER_MS);
      }
    }
  }, revealAll);

  return () => {
    cleanupIO();
    timers.clear();
  };
}
