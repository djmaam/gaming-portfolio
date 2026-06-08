import { REVEALED_CLASS as PANEL_REVEALED_CLASS } from './panelReveal';
import { ABILITY_CELL_COLORS } from '../data/abilityColors';
import { createStaggerSet } from './lib/staggerTimers';
import { mountIntersection } from './lib/intersectionMount';

export const ANIM_MS      = 600;
export const STAGGER_MS   = 80;
export const FILLED_CLASS = 'stat-cell--filled';
const CELL_COUNT          = 10;

interface RowCtx {
  row: HTMLElement;
  bar: HTMLElement | null;
  cells: HTMLElement[];
  lvEl: HTMLElement | null;
  target: number;
  lastFilled: number;
  started: boolean;
  done: boolean;
  startedAt: number;
}

function readRows(panel: HTMLElement): RowCtx[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('.stat-row')).map(row => {
    const raw = parseInt(row.getAttribute('data-lvl') ?? '', 10);
    const target = Math.max(0, Math.min(CELL_COUNT, Number.isFinite(raw) ? raw : 0));
    return {
      row,
      bar:        row.querySelector<HTMLElement>('.stat-row__bar'),
      cells:      Array.from(row.querySelectorAll<HTMLElement>('.stat-cell')),
      lvEl:       row.querySelector<HTMLElement>('.stat-row__lv'),
      target,
      lastFilled: -1,
      started:    false,
      done:       false,
      startedAt:  0,
    };
  });
}

function paintRow(ctx: RowCtx, filled: number): void {
  if (filled === ctx.lastFilled) return;
  for (let i = 0; i < ctx.cells.length; i++) {
    const cell = ctx.cells[i];
    if (i < filled) {
      cell.classList.add(FILLED_CLASS);
      cell.style.background = ABILITY_CELL_COLORS[i] ?? '';
    } else {
      cell.classList.remove(FILLED_CLASS);
      cell.style.background = '';
    }
  }
  if (ctx.lvEl) ctx.lvEl.textContent = `LV${filled}`;
  if (ctx.bar)  ctx.bar.setAttribute('aria-valuenow', String(filled * 10));
  ctx.lastFilled = filled;
}

export function mount(): () => void {
  const panel = document.querySelector<HTMLElement>('.ability-stats');
  if (!panel) return () => {};

  const rows = readRows(panel);
  const timers = createStaggerSet();
  const active = new Set<RowCtx>();
  let rafId = 0;
  let pausedAt = 0;
  let armed = false;
  let revealMO: MutationObserver | null = null;
  let usedFallback = false;

  function tick(now: number): void {
    // Background tabs throttle rAF to ~1 Hz and would otherwise produce a
    // single giant jump that snaps progress to 1 — match worldMap.ts and
    // exit until visibilitychange wakes us back up.
    if (document.visibilityState === 'hidden') { rafId = 0; return; }
    for (const ctx of active) {
      const progress = Math.max(0, Math.min(1, (now - ctx.startedAt) / ANIM_MS));
      const filled = progress >= 1 ? ctx.target : Math.floor(progress * ctx.target);
      paintRow(ctx, filled);
      if (progress >= 1) {
        active.delete(ctx);
        ctx.done = true;
      }
    }
    rafId = active.size > 0 ? requestAnimationFrame(tick) : 0;
  }

  function startRow(ctx: RowCtx): void {
    if (ctx.done || ctx.started) return;
    ctx.started = true;
    ctx.startedAt = performance.now();
    active.add(ctx);
    if (rafId === 0) rafId = requestAnimationFrame(tick);
  }

  function scheduleAll(): void {
    rows.forEach((ctx, i) => {
      if (ctx.done || ctx.started) return;
      if (i === 0) startRow(ctx);
      else timers.schedule(() => startRow(ctx), i * STAGGER_MS);
    });
  }

  // Gate the count-up on panel--revealed so the animation plays AFTER
  // panelReveal exposes the panel (otherwise abilityStats' IO can resolve
  // first, run the entire animation while visibility:hidden, then 'played'
  // blocks replay).
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
    usedFallback = true;
    rows.forEach(r => paintRow(r, r.target));
  });

  if (usedFallback) return cleanupIO;

  rows.forEach(r => paintRow(r, 0));

  function onVisibility(): void {
    if (document.visibilityState === 'hidden') {
      pausedAt = performance.now();
      return;
    }
    if (pausedAt > 0) {
      // Shift every active row's startedAt forward by the pause length so
      // progress continues from where it left off instead of jumping to 1.
      const skip = performance.now() - pausedAt;
      for (const ctx of active) ctx.startedAt += skip;
      pausedAt = 0;
    }
    if (active.size > 0 && rafId === 0) rafId = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    cleanupIO();
    revealMO?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    timers.clear();
    cancelAnimationFrame(rafId);
    active.clear();
  };
}
