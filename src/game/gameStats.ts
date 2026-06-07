import { portfolio } from '../data/portfolio';

export const VISITED_KEY    = 'gp-visited-nodes';
export const COLLECTED_KEY  = 'gp-collected-skills';
export const STAT_EVENT     = 'gp:stat-update';
const LEVEL_CAP             = 99;

export const NODES_TOTAL  = portfolio.experience.length;
export const SKILLS_TOTAL = portfolio.skills.reduce((sum, g) => sum + g.items.length, 0);

export interface StatUpdateDetail {
  nodes?: number;
  skills?: number;
}

export function computeLevel(nodes: number, skills: number): number {
  if (!Number.isFinite(nodes) || !Number.isFinite(skills)) return 1;
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
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<StatUpdateDetail>(STAT_EVENT, { detail }));
}

const isValidStat = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function mount(): () => void {
  const nodesEl  = document.getElementById('hud-nodes');
  const skillsEl = document.getElementById('hud-skills');
  const levelEl  = document.getElementById('hud-level');
  if (!nodesEl || !skillsEl || !levelEl) {
    if (typeof console !== 'undefined') {
      console.warn('[gameStats] HUD elements missing — stat listener not attached');
    }
    return () => {};
  }

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
  const onAnimEnd = () => levelEl.classList.remove('hud__level--flash');
  levelEl.addEventListener('animationend', onAnimEnd);

  const flashLevelUp = () => {
    if (isReduced) return;
    if (levelEl.classList.contains('hud__level--flash')) return;
    levelEl.classList.add('hud__level--flash');
  };

  const onStat = (e: Event) => {
    const detail = (e as CustomEvent<StatUpdateDetail>).detail ?? {};
    if (isValidStat(detail.nodes))  nodes  = detail.nodes;
    if (isValidStat(detail.skills)) skills = detail.skills;
    const next = computeLevel(nodes, skills);
    const leveledUp = next > level;
    level = next;
    render();
    if (leveledUp) flashLevelUp();
  };

  window.addEventListener(STAT_EVENT, onStat);
  return () => {
    window.removeEventListener(STAT_EVENT, onStat);
    levelEl.removeEventListener('animationend', onAnimEnd);
  };
}
