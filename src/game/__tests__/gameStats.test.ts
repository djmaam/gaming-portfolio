import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mount,
  computeLevel,
  dispatchStatUpdate,
  NODES_TOTAL,
  SKILLS_TOTAL,
  readNodesCount,
  readSkillsCount,
} from '../gameStats';

function buildHud() {
  document.body.innerHTML = `
    <div class="hud">
      <span id="hud-nodes"></span>
      <span id="hud-skills"></span>
      <span id="hud-level"></span>
    </div>
  `;
  return {
    nodes:  document.getElementById('hud-nodes')!,
    skills: document.getElementById('hud-skills')!,
    level:  document.getElementById('hud-level')!,
  };
}

describe('gameStats — totals from portfolio data', () => {
  it('NODES_TOTAL equals experience length', () => {
    expect(NODES_TOTAL).toBe(5);
  });
  it('SKILLS_TOTAL sums every skill item', () => {
    expect(SKILLS_TOTAL).toBe(27);
  });
});

describe('gameStats — computeLevel', () => {
  it('returns 1 floor when no progress', () => {
    expect(computeLevel(0, 0)).toBe(1);
  });
  it('matches formula floor((nodes*3 + skills*0.5)/5)', () => {
    expect(computeLevel(2, 8)).toBe(Math.floor((2 * 3 + 8 * 0.5) / 5));
    expect(computeLevel(3, 10)).toBe(Math.floor((3 * 3 + 10 * 0.5) / 5));
    expect(computeLevel(5, 27)).toBe(Math.floor((5 * 3 + 27 * 0.5) / 5));
  });
  it('caps at 99', () => {
    expect(computeLevel(9999, 9999)).toBe(99);
  });
  it('returns 1 when nodes or skills are NaN/Infinity', () => {
    expect(computeLevel(NaN, 0)).toBe(1);
    expect(computeLevel(0, NaN)).toBe(1);
    expect(computeLevel(Infinity, 0)).toBe(1);
    expect(computeLevel(0, -Infinity)).toBe(1);
  });
  it('boundary at threshold (level increments where floor changes)', () => {
    expect(computeLevel(1, 0)).toBe(1);
    expect(computeLevel(2, 0)).toBe(1);
    expect(computeLevel(3, 0)).toBe(1);
    expect(computeLevel(4, 0)).toBe(2);
  });
});

describe('gameStats — readNodesCount / readSkillsCount', () => {
  beforeEach(() => { sessionStorage.clear(); });

  it('returns 0 when keys missing', () => {
    expect(readNodesCount()).toBe(0);
    expect(readSkillsCount()).toBe(0);
  });
  it('returns array length from sessionStorage', () => {
    sessionStorage.setItem('gp-visited-nodes',    JSON.stringify([1, 2, 3]));
    sessionStorage.setItem('gp-collected-skills', JSON.stringify(['a', 'b']));
    expect(readNodesCount()).toBe(3);
    expect(readSkillsCount()).toBe(2);
  });
  it('returns 0 for malformed JSON', () => {
    sessionStorage.setItem('gp-visited-nodes', '{not json');
    expect(readNodesCount()).toBe(0);
  });
});

describe('gameStats — mount() event wiring', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => { cleanup?.(); cleanup = undefined; sessionStorage.clear(); });

  it('renders initial counts from sessionStorage on mount', () => {
    sessionStorage.setItem('gp-visited-nodes',    JSON.stringify([1, 2]));
    sessionStorage.setItem('gp-collected-skills', JSON.stringify(['x', 'y', 'z']));
    const hud = buildHud();
    cleanup = mount();
    expect(hud.nodes.textContent).toBe(`2/${NODES_TOTAL}`);
    expect(hud.skills.textContent).toBe(`3/${SKILLS_TOTAL}`);
    expect(hud.level.textContent).toBe(`LV.${computeLevel(2, 3)}`);
  });

  it('renders zeros when sessionStorage empty', () => {
    const hud = buildHud();
    cleanup = mount();
    expect(hud.nodes.textContent).toBe(`0/${NODES_TOTAL}`);
    expect(hud.skills.textContent).toBe(`0/${SKILLS_TOTAL}`);
    expect(hud.level.textContent).toBe('LV.1');
  });

  it('updates HUD when gp:stat-update event dispatches', () => {
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: 2, skills: 8 });
    expect(hud.nodes.textContent).toBe(`2/${NODES_TOTAL}`);
    expect(hud.skills.textContent).toBe(`8/${SKILLS_TOTAL}`);
    expect(hud.level.textContent).toBe(`LV.${computeLevel(2, 8)}`);
  });

  it('partial detail (nodes only) leaves skills count unchanged', () => {
    sessionStorage.setItem('gp-collected-skills', JSON.stringify(['a', 'b']));
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: 3 });
    expect(hud.nodes.textContent).toBe(`3/${NODES_TOTAL}`);
    expect(hud.skills.textContent).toBe(`2/${SKILLS_TOTAL}`);
  });

  it('returns no-op cleanup when HUD ids missing', () => {
    document.body.innerHTML = '';
    cleanup = mount();
    expect(() => cleanup!()).not.toThrow();
  });

  it('cleanup removes the gp:stat-update listener', () => {
    const hud = buildHud();
    const c   = mount();
    c();
    dispatchStatUpdate({ nodes: 4, skills: 10 });
    expect(hud.nodes.textContent).toBe(`0/${NODES_TOTAL}`);
  });

  it('rejects NaN / negative / non-finite stat values', () => {
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: NaN, skills: -3 });
    expect(hud.nodes.textContent).toBe(`0/${NODES_TOTAL}`);
    expect(hud.skills.textContent).toBe(`0/${SKILLS_TOTAL}`);
    expect(hud.level.textContent).toBe('LV.1');
  });

  it('flashes level element when level increments (motion enabled)', () => {
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: 4, skills: 0 });
    expect(hud.level.classList.contains('hud__level--flash')).toBe(true);
  });

  it('does not flash when level unchanged', () => {
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: 1, skills: 0 });
    expect(hud.level.classList.contains('hud__level--flash')).toBe(false);
  });

  it('skips flash when prefers-reduced-motion: reduce', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const hud = buildHud();
    cleanup = mount();
    dispatchStatUpdate({ nodes: 4, skills: 0 });
    expect(hud.level.classList.contains('hud__level--flash')).toBe(false);
  });
});
