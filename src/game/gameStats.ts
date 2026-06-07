import { portfolio } from '../data/portfolio';

const VISITED_KEY    = 'gp-visited-nodes';
const COLLECTED_KEY  = 'gp-collected-skills';
const STAT_EVENT     = 'gp:stat-update';
const LEVEL_CAP      = 99;

export const NODES_TOTAL  = portfolio.experience.length;
export const SKILLS_TOTAL = portfolio.skills.reduce((sum, g) => sum + g.items.length, 0);

export interface StatUpdateDetail {
  nodes?: number;
  skills?: number;
}

export function computeLevel(nodes: number, skills: number): number {
  const raw = Math.floor((nodes * 3 + skills * 0.5) / 5);
  return Math.min(LEVEL_CAP, Math.max(1, raw));
}

function readCount(key: string): number {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function readNodesCount():  number { return readCount(VISITED_KEY); }
export function readSkillsCount(): number { return readCount(COLLECTED_KEY); }

export function dispatchStatUpdate(detail: StatUpdateDetail): void {
  window.dispatchEvent(new CustomEvent<StatUpdateDetail>(STAT_EVENT, { detail }));
}

export function mount(): () => void {
  const nodesEl  = document.getElementById('hud-nodes');
  const skillsEl = document.getElementById('hud-skills');
  const levelEl  = document.getElementById('hud-level');
  if (!nodesEl || !skillsEl || !levelEl) return () => {};

  let nodes  = readNodesCount();
  let skills = readSkillsCount();
  let level  = computeLevel(nodes, skills);

  const render = () => {
    nodesEl.textContent  = `${nodes}/${NODES_TOTAL}`;
    skillsEl.textContent = `${skills}/${SKILLS_TOTAL}`;
    levelEl.textContent  = `LV.${level}`;
  };
  render();

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flashLevelUp = () => {
    if (isReduced) return;
    levelEl.classList.remove('hud__level--flash');
    void levelEl.offsetWidth;
    levelEl.classList.add('hud__level--flash');
  };

  const onStat = (e: Event) => {
    const detail = (e as CustomEvent<StatUpdateDetail>).detail ?? {};
    if (typeof detail.nodes  === 'number') nodes  = detail.nodes;
    if (typeof detail.skills === 'number') skills = detail.skills;
    const next = computeLevel(nodes, skills);
    const leveledUp = next > level;
    level = next;
    render();
    if (leveledUp) flashLevelUp();
  };

  window.addEventListener(STAT_EVENT, onStat);
  return () => window.removeEventListener(STAT_EVENT, onStat);
}
