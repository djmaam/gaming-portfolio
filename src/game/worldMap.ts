import { portfolio, SP, cmap } from '../data/portfolio';
import './worldMap.css';

const SPEED = 120; // px/s
const PROX  = 24;  // px proximity radius for node activation

export function mount(): () => void {
  const timeline = document.getElementById('world-map-timeline');
  if (!timeline) return () => {};

  const isCoarse  = window.matchMedia('(pointer: coarse)').matches;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const jobs      = portfolio.experience;

  // ── Dialog state (local to this mount call) ─────────────────────────────────
  let dialogOpen = false;
  let dialogEl: HTMLElement | null = null;
  let currentJob = 0;

  function closeDialog() {
    dialogOpen = false;
    dialogEl?.remove();
    dialogEl = null;
  }

  function makeInfoRow(cls: string, label: string, value: string): HTMLParagraphElement {
    const p   = document.createElement('p');
    p.className = cls;
    const lbl = document.createElement('span');
    lbl.className   = 'wm-dialog__lbl';
    lbl.textContent = label;
    p.appendChild(lbl);
    p.appendChild(document.createTextNode(value));
    return p;
  }

  function renderDialog() {
    dialogEl?.remove();
    const job       = jobs[currentJob];
    const isCurrent = currentJob === 0;

    const backdrop = document.createElement('div');
    backdrop.className = 'wm-dialog-backdrop';
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeDialog(); });

    const panel = document.createElement('div');
    panel.className = 'wm-dialog-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', `${job.company} — ${job.role}`);

    // Header
    const header  = document.createElement('div');
    header.className = 'wm-dialog__header';
    const company = document.createElement('span');
    company.className   = 'wm-dialog__company';
    company.textContent = job.company;
    const status  = document.createElement('span');
    status.className   = `wm-dialog__status ${isCurrent ? 'wm-dialog__status--now' : 'wm-dialog__status--cleared'}`;
    status.textContent = isCurrent ? '▶ NOW PLAYING' : `✓ CLEARED · ${job.year}`;
    header.appendChild(company);
    header.appendChild(status);

    // Nav buttons
    const nav   = document.createElement('div');
    nav.className = 'wm-dialog__nav';
    const prev  = document.createElement('button');
    prev.className   = 'wm-dialog__btn';
    prev.textContent = '◀ PREV';
    prev.disabled    = currentJob === 0;
    prev.addEventListener('click', () => { if (currentJob > 0) { currentJob--; renderDialog(); } });
    const close = document.createElement('button');
    close.className   = 'wm-dialog__btn wm-dialog__btn--close';
    close.textContent = 'CLOSE';
    close.addEventListener('click', closeDialog);
    const next  = document.createElement('button');
    next.className   = 'wm-dialog__btn';
    next.textContent = 'NEXT ▶';
    next.disabled    = currentJob === jobs.length - 1;
    next.addEventListener('click', () => { if (currentJob < jobs.length - 1) { currentJob++; renderDialog(); } });
    nav.append(prev, close, next);

    panel.append(
      header,
      makeInfoRow('wm-dialog__role',  'ROLE',  job.role),
      makeInfoRow('wm-dialog__gear',  'GEAR',  job.tech),
      makeInfoRow('wm-dialog__quest', 'QUEST', job.note),
      nav,
    );

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    dialogEl = backdrop;
    close.focus();
  }

  function openDialog(index: number) {
    if (dialogOpen) return;
    currentJob = index;
    dialogOpen = true;
    renderDialog();
  }

  const onDialogKey = (e: KeyboardEvent) => {
    if (!dialogOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (e.key === 'ArrowLeft'  && currentJob > 0)               { currentJob--; renderDialog(); }
    if (e.key === 'ArrowRight' && currentJob < jobs.length - 1) { currentJob++; renderDialog(); }
  };
  window.addEventListener('keydown', onDialogKey);

  // ── Touch: wire node buttons directly to dialog ──────────────────────────────
  if (isCoarse) {
    const cleanups = Array.from(
      timeline.querySelectorAll<HTMLElement>('.wm-node')
    ).map((btn, i) => {
      const h = () => openDialog(i);
      btn.addEventListener('click', h);
      return () => btn.removeEventListener('click', h);
    });
    return () => {
      window.removeEventListener('keydown', onDialogKey);
      cleanups.forEach(fn => fn());
      closeDialog();
    };
  }

  // ── Desktop: hero movement ───────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.className = 'wm-hero-canvas';
  canvas.width  = 32;
  canvas.height = 32;

  const prompt = document.createElement('div');
  prompt.className = 'wm-enter-prompt';
  prompt.textContent = '▲ ENTER';
  prompt.hidden = true;

  const layer = document.createElement('div');
  layer.className = 'wm-hero-layer';
  layer.appendChild(canvas);
  layer.appendChild(prompt);

  timeline.style.position = 'relative';
  timeline.appendChild(layer);

  // Node Y centers relative to timeline top
  const nodeButtons = Array.from(timeline.querySelectorAll<HTMLElement>('.wm-node'));
  const tlRect = timeline.getBoundingClientRect();
  const nodeYs = nodeButtons.map(btn => {
    const r = btn.getBoundingClientRect();
    return (r.top + r.height / 2) - tlRect.top;
  });
  const minY = nodeYs[0];
  const maxY = nodeYs[nodeYs.length - 1];

  // Draw sprite onto canvas; bobOffset shifts sprite 1 row (2px) for walk animation
  const ctx = canvas.getContext('2d')!;
  function drawSprite(bobOffset = 0) {
    ctx.clearRect(0, 0, 32, 32);
    for (let row = 0; row < SP.length; row++) {
      for (let col = 0; col < SP[row].length; col++) {
        const color = cmap[SP[row][col]];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * 2, (row + bobOffset) * 2, 2, 2);
      }
    }
  }
  drawSprite();

  let heroY      = minY;
  let activeNode = 0;
  let walkFrame  = 0;
  let walkTick   = 0;
  const keys = new Set<string>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
      e.preventDefault();
      if (!dialogOpen) keys.add(e.key);
    }
    if ((e.key === 'z' || e.key === 'Z' || e.key === 'Enter') && activeNode !== -1 && !dialogOpen) {
      openDialog(activeNode);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);

  const nodeClickCleanups = nodeButtons.map((btn, i) => {
    const h = () => openDialog(i);
    btn.addEventListener('click', h);
    return () => btn.removeEventListener('click', h);
  });

  let last  = performance.now();
  let rafId = requestAnimationFrame(loop);

  function loop(now: number) {
    rafId = requestAnimationFrame(loop);

    if (document.visibilityState === 'hidden' || dialogOpen) { last = now; return; }

    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const up   = keys.has('ArrowUp')   || keys.has('w') || keys.has('W');
    const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S');
    const dy   = (down ? 1 : 0) - (up ? 1 : 0);

    if (dy !== 0) {
      heroY = Math.max(minY, Math.min(maxY, heroY + dy * SPEED * dt));
      if (!isReduced) {
        walkTick += SPEED * dt;
        if (walkTick > 8) { walkFrame = 1 - walkFrame; walkTick -= 8; }
        drawSprite(walkFrame);
      }
    }

    canvas.style.top = `${heroY - 16}px`;

    // Proximity: find nearest node
    let nearest = 0;
    let nearestDist = Math.abs(heroY - nodeYs[0]);
    for (let i = 1; i < nodeYs.length; i++) {
      const d = Math.abs(heroY - nodeYs[i]);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    }
    const newActive = nearestDist <= PROX ? nearest : -1;

    if (newActive !== activeNode) {
      // Node 0 already has wm-node--current; only toggle others
      nodeButtons.forEach((btn, i) => {
        if (i !== 0) btn.classList.toggle('wm-node--active', i === newActive);
      });
      activeNode = newActive;
    }

    prompt.hidden = activeNode === -1;
    if (activeNode !== -1) prompt.style.top = `${heroY + 20}px`;
  }

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup',   onKeyUp);
    window.removeEventListener('keydown', onDialogKey);
    nodeClickCleanups.forEach(fn => fn());
    layer.remove();
    timeline.style.position = '';
    closeDialog();
  };
}
