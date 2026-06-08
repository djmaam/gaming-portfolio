// Tracks a set of setTimeout handles so they can be collectively cleared on
// cleanup. Self-purges fired timers from the set so `clear()` after a normal
// completion is a no-op. Used by reveal-style modules where one IO entry
// schedules a fan of staggered actions and the mount cleanup needs to cancel
// any that didn't fire yet.
export interface StaggerSet {
  schedule(fn: () => void, ms: number): void;
  clear(): void;
}

export function createStaggerSet(): StaggerSet {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  return {
    schedule(fn, ms) {
      const tid = setTimeout(() => {
        timers.delete(tid);
        fn();
      }, ms);
      timers.add(tid);
    },
    clear() {
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
}
