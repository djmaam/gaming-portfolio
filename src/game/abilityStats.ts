export const ANIM_MS      = 600;
export const STAGGER_MS   = 80;
export const FILLED_CLASS = 'stat-cell--filled';

const CELL_COLORS = [
  'var(--c-green)', 'var(--c-green)', 'var(--c-green)', 'var(--c-green)',
  'var(--c-green)', 'var(--c-green)', 'var(--c-yellow)', 'var(--c-yellow)',
  'var(--c-red)',   'var(--c-red)',
];

interface RowCtx {
  row: HTMLElement;
  cells: HTMLElement[];
  lvEl: HTMLElement;
  target: number;
  played: boolean;
}

function readRows(panel: HTMLElement): RowCtx[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('.stat-row')).map(row => {
    const raw = parseInt(row.getAttribute('data-lvl') ?? '', 10);
    const target = Math.max(0, Math.min(10, Number.isFinite(raw) ? raw : 0));
    return {
      row,
      cells: Array.from(row.querySelectorAll<HTMLElement>('.stat-cell')),
      lvEl:  row.querySelector<HTMLElement>('.stat-row__lv')!,
      target,
      played: false,
    };
  });
}

function paintRow(ctx: RowCtx, filled: number): void {
  for (let i = 0; i < ctx.cells.length; i++) {
    const cell = ctx.cells[i];
    if (i < filled) {
      if (!cell.classList.contains(FILLED_CLASS)) {
        cell.classList.add(FILLED_CLASS);
        cell.style.background = CELL_COLORS[i] ?? '';
      }
    } else if (cell.classList.contains(FILLED_CLASS)) {
      cell.classList.remove(FILLED_CLASS);
      cell.style.background = '';
    }
  }
  ctx.lvEl.textContent = `LV${filled}`;
}

function resetRow(ctx: RowCtx): void {
  paintRow(ctx, 0);
}

function finalizeRow(ctx: RowCtx): void {
  paintRow(ctx, ctx.target);
}

export function mount(): () => void {
  const panel = document.querySelector<HTMLElement>('.ability-stats');
  if (!panel) return () => {};

  const rows = readRows(panel);
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isReduced || typeof IntersectionObserver === 'undefined') {
    rows.forEach(finalizeRow);
    return () => {};
  }

  rows.forEach(resetRow);

  const timers = new Set<ReturnType<typeof setTimeout>>();
  let rafId = 0;
  const active = new Set<RowCtx>();
  const startedAt = new WeakMap<RowCtx, number>();

  function tick(now: number): void {
    for (const ctx of active) {
      const t0 = startedAt.get(ctx) ?? now;
      const progress = Math.min(1, (now - t0) / ANIM_MS);
      const filled = Math.floor(progress * ctx.target);
      paintRow(ctx, progress >= 1 ? ctx.target : filled);
      if (progress >= 1) {
        active.delete(ctx);
        ctx.played = true;
      }
    }
    if (active.size > 0) rafId = requestAnimationFrame(tick);
    else rafId = 0;
  }

  function startRow(ctx: RowCtx): void {
    if (ctx.played || active.has(ctx)) return;
    startedAt.set(ctx, performance.now());
    active.add(ctx);
    if (rafId === 0) rafId = requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      rows.forEach((ctx, i) => {
        if (ctx.played || active.has(ctx)) return;
        if (i === 0) {
          startRow(ctx);
        } else {
          const tid = setTimeout(() => {
            timers.delete(tid);
            startRow(ctx);
          }, i * STAGGER_MS);
          timers.add(tid);
        }
      });
      io.unobserve(entry.target);
    }
  });

  io.observe(panel);

  return () => {
    io.disconnect();
    timers.forEach(clearTimeout);
    timers.clear();
    if (rafId !== 0) cancelAnimationFrame(rafId);
    rafId = 0;
    active.clear();
  };
}
