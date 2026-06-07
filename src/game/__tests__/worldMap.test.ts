import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '../worldMap';
import { portfolio } from '../../data/portfolio';

// Capture the rAF callback so tests can drive the loop manually
let rafCallback: FrameRequestCallback | null = null;

beforeEach(() => {
  rafCallback = null;
  vi.mocked(window.requestAnimationFrame).mockImplementation((cb) => {
    rafCallback = cb;
    return 1;
  });
});

function buildDOM(nodeCount = 2) {
  document.body.innerHTML = '<div id="world-map-timeline"></div>';
  const timeline = document.getElementById('world-map-timeline')!;

  timeline.getBoundingClientRect = vi.fn().mockReturnValue({
    top: 0, bottom: 500, left: 0, right: 200, width: 200, height: 500, x: 0, y: 0,
    toJSON: vi.fn(),
  });

  for (let i = 0; i < nodeCount; i++) {
    const btn = document.createElement('button');
    btn.className = 'wm-node';
    btn.setAttribute('type', 'button');
    btn.textContent = `Node ${i}`;
    // node 0 center Y = 110, node 1 center Y = 210
    btn.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100 + i * 100, bottom: 120 + i * 100,
      left: 40, right: 60, width: 20, height: 20,
      x: 40, y: 100 + i * 100, toJSON: vi.fn(),
    });
    timeline.appendChild(btn);
  }

  return {
    timeline,
    nodes: Array.from(timeline.querySelectorAll<HTMLElement>('.wm-node')),
  };
}

function tick(now: number) {
  rafCallback!(now);
}

describe('worldMap — mount guards', () => {
  it('returns no-op cleanup when #world-map-timeline missing', () => {
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });

  it('returns cleanup without crashing when no .wm-node buttons exist', () => {
    document.body.innerHTML = '<div id="world-map-timeline"></div>';
    const timeline = document.getElementById('world-map-timeline')!;
    timeline.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0, bottom: 500, left: 0, right: 200, width: 200, height: 500, x: 0, y: 0,
      toJSON: vi.fn(),
    });
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });
});

describe('worldMap — touch mode (pointer: coarse)', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => { cleanup?.(); cleanup = undefined; });

  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('does not create hero canvas on touch device', () => {
    buildDOM();
    cleanup = mount();
    expect(document.querySelector('.wm-hero-canvas')).toBeNull();
  });

  it('node button click opens dialog with correct job data', () => {
    buildDOM();
    cleanup = mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    const panel = document.querySelector('.wm-dialog-panel');
    expect(panel).not.toBeNull();
    expect(panel?.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[0].company);
    expect(panel?.querySelector('.wm-dialog__role')?.textContent)
      .toContain(portfolio.experience[0].role);
  });

  it('cleanup removes node click listeners and closes dialog', () => {
    buildDOM();
    cleanup = mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
    cleanup();
    cleanup = undefined;
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
    // After cleanup, clicking again should not reopen
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });
});

describe('worldMap — desktop mode', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => { cleanup?.(); cleanup = undefined; });

  it('injects hero canvas into timeline', () => {
    buildDOM();
    cleanup = mount();
    expect(document.querySelector('.wm-hero-canvas')).not.toBeNull();
  });

  it('node button click opens dialog in desktop mode', () => {
    buildDOM();
    cleanup = mount();
    const nodes = document.querySelectorAll('.wm-node');
    (nodes[0] as HTMLElement).click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
  });

  it('cleanup removes canvas and restores timeline position', () => {
    const { timeline } = buildDOM();
    cleanup = mount();
    expect(timeline.querySelector('.wm-hero-layer')).not.toBeNull();
    cleanup();
    cleanup = undefined;
    expect(timeline.querySelector('.wm-hero-layer')).toBeNull();
    expect(timeline.style.position).toBe('');
  });

  it('cleanup closes any open dialog', () => {
    buildDOM();
    cleanup = mount();
    document.querySelector<HTMLElement>('.wm-node')!.click();
    expect(document.querySelector('.wm-dialog-panel')).not.toBeNull();
    cleanup();
    cleanup = undefined;
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });
});

describe('worldMap — proximity detection (rAF loop)', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => { cleanup?.(); cleanup = undefined; });

  it('prompt is visible when hero starts at node 0 Y', () => {
    buildDOM(2);
    cleanup = mount();
    // hero starts at minY = 110 (node 0 center), no movement, run one frame
    tick(0); // dt = (0 - 0) / 1000 = 0, no movement
    const prompt = document.querySelector<HTMLElement>('.wm-enter-prompt')!;
    expect(prompt.hidden).toBe(false);
  });

  it('prompt is hidden when hero is far from all nodes', () => {
    buildDOM(2);
    cleanup = mount();
    // Move hero toward node 1 (Y=210) so it sits at Y≈160, >24px from both
    // At 120px/s with dt=0.05 (capped), each tick = 6px. Need ~8 ticks to reach 160.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    let t = 0;
    for (let i = 0; i < 9; i++) { t += 50; tick(t); }
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    // heroY ≈ 110 + 9*6 = 164, dist to node 0 (110) = 54 > 24, dist to node 1 (210) = 46 > 24
    const prompt = document.querySelector<HTMLElement>('.wm-enter-prompt')!;
    expect(prompt.hidden).toBe(true);
  });

  it('node 1 gets wm-node--active when hero is within PROX of it', () => {
    buildDOM(2);
    cleanup = mount();
    // Move hero all the way to node 1 (Y=210): need (210-110)/6 ≈ 17 ticks
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    let t = 0;
    for (let i = 0; i < 20; i++) { t += 50; tick(t); }
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    // heroY capped at maxY = 210 (node 1 center), dist = 0 ≤ 24
    const nodes = document.querySelectorAll('.wm-node');
    expect(nodes[1].classList.contains('wm-node--active')).toBe(true);
  });
});

describe('worldMap — progressive disclosure', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    sessionStorage.clear();
  });

  function buildDOMWithCards(count = portfolio.experience.length) {
    document.body.innerHTML = '<div id="world-map-timeline"></div>';
    const timeline = document.getElementById('world-map-timeline')!;
    timeline.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0, bottom: 500, left: 0, right: 200, width: 200, height: 500, x: 0, y: 0,
      toJSON: vi.fn(),
    });
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.className = 'wm-node';
      btn.setAttribute('data-job-index', String(i));
      btn.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100 + i * 100, bottom: 120 + i * 100,
        left: 40, right: 60, width: 20, height: 20,
        x: 40, y: 100 + i * 100, toJSON: vi.fn(),
      });
      timeline.appendChild(btn);

      const card = document.createElement('div');
      card.className = 'wm-card';
      card.setAttribute('data-job-index', String(i));
      const content = document.createElement('div');
      content.className = 'wm-card__content';
      card.appendChild(content);
      if (i !== 0) {
        const cipher = document.createElement('div');
        cipher.className = 'wm-card__cipher';
        cipher.textContent = '??? ENCRYPTED';
        card.appendChild(cipher);
      }
      timeline.appendChild(card);
    }
    return {
      timeline,
      nodes: Array.from(timeline.querySelectorAll<HTMLElement>('.wm-node')),
      cards: Array.from(timeline.querySelectorAll<HTMLElement>('.wm-card')),
    };
  }

  it('card 0 (NOW PLAYING) is never hidden on fresh mount', () => {
    const { cards } = buildDOMWithCards();
    cleanup = mount();
    expect(cards[0].classList.contains('wm-card--hidden')).toBe(false);
  });

  it('cards 1-4 get wm-card--hidden on fresh mount', () => {
    const { cards } = buildDOMWithCards();
    cleanup = mount();
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].classList.contains('wm-card--hidden')).toBe(true);
    }
  });

  it('clicking node 1 reveals card 1 and persists index to sessionStorage', () => {
    const { nodes, cards } = buildDOMWithCards();
    cleanup = mount();
    nodes[1].click();
    expect(cards[1].classList.contains('wm-card--hidden')).toBe(false);
    expect(cards[1].classList.contains('wm-card--revealed')).toBe(true);
    const stored = JSON.parse(sessionStorage.getItem('gp-visited-nodes') ?? '[]') as number[];
    expect(stored).toContain(1);
  });

  it('on remount, previously visited cards start revealed not hidden', () => {
    sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2]));
    const { cards } = buildDOMWithCards();
    cleanup = mount();
    expect(cards[1].classList.contains('wm-card--hidden')).toBe(false);
    expect(cards[2].classList.contains('wm-card--hidden')).toBe(false);
    expect(cards[3].classList.contains('wm-card--hidden')).toBe(true);
  });

  it('ArrowRight in open dialog marks newly-shown job as visited and reveals its card', () => {
    const { nodes, cards } = buildDOMWithCards();
    cleanup = mount();
    nodes[0].click(); // open dialog at job 0
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(cards[1].classList.contains('wm-card--hidden')).toBe(false);
    expect(cards[1].classList.contains('wm-card--revealed')).toBe(true);
    const stored = JSON.parse(sessionStorage.getItem('gp-visited-nodes') ?? '[]') as number[];
    expect(stored).toContain(1);
  });

  it('NEXT button click in dialog marks newly-shown job as visited', () => {
    const { nodes, cards } = buildDOMWithCards();
    cleanup = mount();
    nodes[0].click();
    const nextBtn = document.querySelectorAll<HTMLButtonElement>('.wm-dialog__btn')[2];
    nextBtn.click();
    expect(cards[1].classList.contains('wm-card--hidden')).toBe(false);
    const stored = JSON.parse(sessionStorage.getItem('gp-visited-nodes') ?? '[]') as number[];
    expect(stored).toContain(1);
  });

  it('malformed sessionStorage JSON does not crash mount()', () => {
    sessionStorage.setItem('gp-visited-nodes', '[1, 2,');
    const { cards } = buildDOMWithCards();
    expect(() => { cleanup = mount(); }).not.toThrow();
    // Card 1 should default to hidden when visited set cannot be parsed
    expect(cards[1].classList.contains('wm-card--hidden')).toBe(true);
  });

  it('markVisited does not write to sessionStorage when index already visited', () => {
    sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1]));
    const { nodes } = buildDOMWithCards();
    cleanup = mount();
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    nodes[1].click(); // already visited
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('worldMap — dialog keyboard navigation', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => { cleanup?.(); cleanup = undefined; });

  beforeEach(() => {
    buildDOM(portfolio.experience.length);
    cleanup = mount();
    document.querySelector<HTMLElement>('.wm-node')!.click();
  });

  it('Escape closes dialog', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.wm-dialog-panel')).toBeNull();
  });

  it('ArrowRight navigates to next job', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[1].company);
  });

  it('ArrowLeft is no-op at first job (index 0)', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(document.querySelector('.wm-dialog__company')?.textContent)
      .toBe(portfolio.experience[0].company);
  });

  it('PREV button is disabled at first job', () => {
    const prev = document.querySelector<HTMLButtonElement>('.wm-dialog__btn:first-child');
    expect(prev?.disabled).toBe(true);
  });

  it('NEXT button is disabled at last job', () => {
    // Navigate to last job
    const lastIdx = portfolio.experience.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    }
    const next = document.querySelector<HTMLButtonElement>('.wm-dialog__btn:last-child');
    expect(next?.disabled).toBe(true);
  });

  it('dialog shows NOW PLAYING for index 0', () => {
    expect(document.querySelector('.wm-dialog__status')?.textContent)
      .toContain('NOW PLAYING');
  });

  it('dialog shows CLEARED for non-zero index', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.querySelector('.wm-dialog__status')?.textContent)
      .toContain('CLEARED');
  });
});
