export const REVEALED_CLASS = 'panel--revealed';
export const STAGGER_MS     = 60;
const THRESHOLD             = 0.12;

export function mount(): () => void {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.pixel-panel'));
  if (!panels.length) return () => {};

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    panels.forEach(p => p.classList.add(REVEALED_CLASS));
    return () => {};
  }

  let remaining = panels.length;
  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    visible.forEach((entry, i) => {
      const el = entry.target as HTMLElement;
      el.style.animationDelay = `${i * STAGGER_MS}ms`;
      el.classList.add(REVEALED_CLASS);
      io.unobserve(el);
      remaining--;
    });
    if (remaining <= 0) io.disconnect();
  }, { threshold: THRESHOLD });

  panels.forEach(p => io.observe(p));
  return () => io.disconnect();
}
