import { REVEALED_CLASS as PANEL_REVEALED_CLASS } from './panelReveal';
import { createStaggerSet } from './lib/staggerTimers';
import { mountIntersection } from './lib/intersectionMount';
import { COLLECTED_KEY, dispatchStatUpdate } from './gameStats';

export const STAGGER_MS       = 30;
export const COLLECTED_CLASS  = 'skill-chip--collected';
export const VISIBLE_CLASS    = 'skill-chip--visible';
export const POP_CLASS        = 'skill-chip--pop';
const DIM_OPACITY             = '0.25';
const DIM_FILTER              = 'grayscale(1)';

interface ChipCtx {
  el: HTMLElement;
  skill: string;
  onClick: () => void;
  onKeydown: (e: KeyboardEvent) => void;
  onPopEnd: () => void;
}

function readCollected(): Set<string> {
  try {
    const raw = sessionStorage.getItem(COLLECTED_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function persistCollected(set: Set<string>): void {
  sessionStorage.setItem(COLLECTED_KEY, JSON.stringify([...set]));
}

function applyDim(el: HTMLElement): void {
  el.style.opacity = DIM_OPACITY;
  el.style.filter  = DIM_FILTER;
}

function applyBright(el: HTMLElement): void {
  el.style.opacity = '1';
  el.style.filter  = 'none';
}

export function mount(): () => void {
  const panel = document.querySelector<HTMLElement>('.skill-tree');
  if (!panel) return () => {};

  const chipEls = Array.from(panel.querySelectorAll<HTMLElement>('.skill-chip[data-skill]'));
  if (!chipEls.length) return () => {};

  const collected = readCollected();
  const timers    = createStaggerSet();
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let armed = false;
  let revealMO: MutationObserver | null = null;

  const ctxs: ChipCtx[] = chipEls.map(el => {
    const skill = el.getAttribute('data-skill') ?? '';
    const ctx: ChipCtx = {
      el,
      skill,
      onClick:   () => {},
      onKeydown: () => {},
      onPopEnd:  () => el.classList.remove(POP_CLASS),
    };
    ctx.onClick = () => collect(ctx);
    ctx.onKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'z' && e.key !== 'Z') return;
      e.preventDefault();
      collect(ctx);
    };
    return ctx;
  });

  function markCollected(ctx: ChipCtx, animate: boolean): void {
    ctx.el.classList.add(COLLECTED_CLASS);
    ctx.el.setAttribute('aria-pressed', 'true');
    applyBright(ctx.el);
    if (animate && !isReduced) {
      ctx.el.classList.add(POP_CLASS);
    }
  }

  function collect(ctx: ChipCtx): void {
    if (collected.has(ctx.skill)) return;
    collected.add(ctx.skill);
    persistCollected(collected);
    markCollected(ctx, true);
    dispatchStatUpdate({ skills: collected.size });
  }

  ctxs.forEach(ctx => {
    if (collected.has(ctx.skill)) {
      markCollected(ctx, false);
    } else {
      applyDim(ctx.el);
    }
    ctx.el.addEventListener('click', ctx.onClick);
    ctx.el.addEventListener('keydown', ctx.onKeydown);
    ctx.el.addEventListener('animationend', ctx.onPopEnd);
  });

  function showChip(el: HTMLElement): void {
    el.classList.add(VISIBLE_CLASS);
  }

  function scheduleAll(): void {
    ctxs.forEach((ctx, i) => {
      if (i === 0) showChip(ctx.el);
      else timers.schedule(() => showChip(ctx.el), i * STAGGER_MS);
    });
  }

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

  const cleanupIO = mountIntersection([panel], (entries, io) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      armIfNeeded();
    }
  }, () => {
    ctxs.forEach(ctx => showChip(ctx.el));
  });

  return () => {
    cleanupIO();
    revealMO?.disconnect();
    timers.clear();
    ctxs.forEach(ctx => {
      ctx.el.removeEventListener('click', ctx.onClick);
      ctx.el.removeEventListener('keydown', ctx.onKeydown);
      ctx.el.removeEventListener('animationend', ctx.onPopEnd);
    });
  };
}
