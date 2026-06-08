export const OVERLAY_ID         = 'crt-overlay';
export const GLITCH_CLASS       = 'pixel-panel--glitch';
export const GLITCH_HOLD_MS     = 200;
export const GLITCH_COOLDOWN_MS = 3000;

interface PanelCtx {
  el: HTMLElement;
  inCooldown: boolean;
  removeTimer:   ReturnType<typeof setTimeout> | null;
  cooldownTimer: ReturnType<typeof setTimeout> | null;
  onEnter: () => void;
  onLeave: () => void;
}

function clearPending(ctx: PanelCtx): void {
  if (ctx.removeTimer !== null) {
    clearTimeout(ctx.removeTimer);
    ctx.removeTimer = null;
  }
  if (ctx.cooldownTimer !== null) {
    clearTimeout(ctx.cooldownTimer);
    ctx.cooldownTimer = null;
  }
}

export function mount(): () => void {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) return () => {};

  let overlay = document.getElementById(OVERLAY_ID);
  const overlayWasOurs = !overlay;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  const panels = Array.from(document.querySelectorAll<HTMLElement>('.pixel-panel'));

  const ctxs: PanelCtx[] = panels.map(el => {
    const ctx: PanelCtx = {
      el,
      inCooldown:    false,
      removeTimer:   null,
      cooldownTimer: null,
      onEnter: () => {},
      onLeave: () => {},
    };
    ctx.onEnter = () => {
      if (ctx.inCooldown) return;
      ctx.inCooldown = true;
      el.classList.add(GLITCH_CLASS);
      ctx.removeTimer = setTimeout(() => {
        el.classList.remove(GLITCH_CLASS);
        ctx.removeTimer = null;
      }, GLITCH_HOLD_MS);
      // Hold the cooldown for a few seconds after the glitch finishes so the
      // effect stays subtle even when the cursor stays over the panel.
      ctx.cooldownTimer = setTimeout(() => {
        ctx.inCooldown = false;
        ctx.cooldownTimer = null;
      }, GLITCH_COOLDOWN_MS);
    };
    ctx.onLeave = () => {
      el.classList.remove(GLITCH_CLASS);
      if (ctx.removeTimer !== null) {
        clearTimeout(ctx.removeTimer);
        ctx.removeTimer = null;
      }
    };
    return ctx;
  });

  ctxs.forEach(ctx => {
    ctx.el.addEventListener('mouseenter', ctx.onEnter);
    ctx.el.addEventListener('mouseleave', ctx.onLeave);
  });

  return () => {
    if (overlayWasOurs && overlay && overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    ctxs.forEach(ctx => {
      ctx.el.removeEventListener('mouseenter', ctx.onEnter);
      ctx.el.removeEventListener('mouseleave', ctx.onLeave);
      clearPending(ctx);
    });
  };
}
