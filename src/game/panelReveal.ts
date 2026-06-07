export const REVEALED_CLASS = 'panel--revealed';
export const STAGGER_MS     = 60;
export const ROW_TOLERANCE_PX = 16;
const THRESHOLD             = 0;

function revealAll(panels: HTMLElement[]): void {
  panels.forEach(p => p.classList.add(REVEALED_CLASS));
}

export function mount(): () => void {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.pixel-panel[data-reveal]'));
  if (!panels.length) return () => {};

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced || typeof IntersectionObserver === 'undefined') {
    revealAll(panels);
    return () => {};
  }

  const timers = new Set<ReturnType<typeof setTimeout>>();

  const io = new IntersectionObserver((entries) => {
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
        const tid = setTimeout(() => {
          timers.delete(tid);
          el.classList.add(REVEALED_CLASS);
        }, rowIdx * STAGGER_MS);
        timers.add(tid);
      }
    }
  }, { threshold: THRESHOLD });

  panels.forEach(p => io.observe(p));

  return () => {
    io.disconnect();
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
