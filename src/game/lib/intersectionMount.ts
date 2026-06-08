// Mounts an IntersectionObserver over a set of targets with the project's
// standard escape hatches: empty target list → no-op, prefers-reduced-motion
// or missing IntersectionObserver → synchronous `fallback(targets)` call.
// Callers own the per-entry logic (stagger, dedup, reveal vs animate) — this
// only owns the IO lifecycle.
export interface IntersectionMountOpts {
  threshold?: number;
}

export function mountIntersection<T extends HTMLElement>(
  targets: T[],
  onIntersect: (entries: IntersectionObserverEntry[], io: IntersectionObserver) => void,
  fallback: (targets: T[]) => void,
  opts: IntersectionMountOpts = {},
): () => void {
  if (!targets.length) return () => {};

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced || typeof IntersectionObserver === 'undefined') {
    fallback(targets);
    return () => {};
  }

  const io = new IntersectionObserver(onIntersect, { threshold: opts.threshold ?? 0 });
  targets.forEach(t => io.observe(t));
  return () => io.disconnect();
}
