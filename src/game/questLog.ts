import { REVEALED_CLASS as PANEL_REVEALED_CLASS } from './panelReveal';
import { createStaggerSet } from './lib/staggerTimers';
import { mountIntersection } from './lib/intersectionMount';

export const STAGGER_MS     = 120;
export const TYPEWRITER_MS  = 30;
export const VISIBLE_CLASS  = 'quest-entry--visible';
export const EXPANDED_CLASS = 'quest-entry--expanded';

interface EntryCtx {
  el: HTMLElement;
  note: HTMLElement | null;
  noteText: string;
  active: boolean;
  index: number;
  onClick: () => void;
}

function readEntries(panel: HTMLElement): EntryCtx[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('.quest-entry')).map((el, fallbackIdx) => {
    const raw = parseInt(el.getAttribute('data-quest-index') ?? '', 10);
    const note = el.querySelector<HTMLElement>('.quest-entry__note');
    return {
      el,
      note,
      noteText: note?.textContent ?? '',
      active:   el.getAttribute('data-quest-active') === 'true',
      index:    Number.isFinite(raw) ? raw : fallbackIdx,
      onClick:  () => el.classList.toggle(EXPANDED_CLASS),
    };
  });
}

// Active quest first, then by data-quest-index ascending. Sorting is stable
// in modern V8 so equal-priority entries keep their DOM order.
function sortForReveal(entries: EntryCtx[]): EntryCtx[] {
  return [...entries].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.index - b.index;
  });
}

export function mount(): () => void {
  const panel = document.querySelector<HTMLElement>('.quest-log');
  if (!panel) return () => {};

  const entries = readEntries(panel);
  const timers  = createStaggerSet();
  let armed = false;
  let revealMO: MutationObserver | null = null;
  let usedFallback = false;

  entries.forEach(ctx => ctx.el.addEventListener('click', ctx.onClick));

  function typeOut(ctx: EntryCtx, i: number): void {
    if (!ctx.note) return;
    if (i > ctx.noteText.length) return;
    ctx.note.textContent = ctx.noteText.slice(0, i);
    if (i === ctx.noteText.length) return;
    timers.schedule(() => typeOut(ctx, i + 1), TYPEWRITER_MS);
  }

  function revealEntry(ctx: EntryCtx): void {
    ctx.el.classList.add(VISIBLE_CLASS);
    typeOut(ctx, 0);
  }

  function scheduleAll(): void {
    sortForReveal(entries).forEach((ctx, sortedIdx) => {
      if (sortedIdx === 0) revealEntry(ctx);
      else timers.schedule(() => revealEntry(ctx), sortedIdx * STAGGER_MS);
    });
  }

  // Same gate as abilityStats: panel uses reveal="slide-left" so panelReveal
  // controls visibility — wait for that before animating, otherwise the
  // typewriter runs while the panel is still visibility:hidden.
  function armIfNeeded(): void {
    if (armed) return;
    armed = true;
    if (panel!.classList.contains(PANEL_REVEALED_CLASS)) {
      scheduleAll();
      return;
    }
    revealMO = new MutationObserver(() => {
      if (panel!.classList.contains(PANEL_REVEALED_CLASS)) {
        revealMO?.disconnect();
        revealMO = null;
        scheduleAll();
      }
    });
    revealMO.observe(panel!, { attributes: true, attributeFilter: ['class'] });
  }

  const cleanupIO = mountIntersection([panel], (ioEntries, io) => {
    for (const entry of ioEntries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      armIfNeeded();
    }
  }, () => {
    usedFallback = true;
    entries.forEach(ctx => {
      ctx.el.classList.add(VISIBLE_CLASS);
      if (ctx.note) ctx.note.textContent = ctx.noteText;
    });
  });

  if (!usedFallback) {
    entries.forEach(ctx => {
      if (ctx.note) ctx.note.textContent = '';
    });
  }

  return () => {
    cleanupIO();
    revealMO?.disconnect();
    timers.clear();
    entries.forEach(ctx => ctx.el.removeEventListener('click', ctx.onClick));
  };
}
