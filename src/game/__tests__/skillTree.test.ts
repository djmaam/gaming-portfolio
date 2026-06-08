import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  mount,
  STAGGER_MS,
  COLLECTED_CLASS,
  VISIBLE_CLASS,
} from '../skillTree';
import { COLLECTED_KEY, STAT_EVENT } from '../gameStats';
import { MockIntersectionObserver } from './setup';

interface BuildOptions { revealed?: boolean }

function buildPanel(
  skills: string[],
  opts: BuildOptions = {},
): { panel: HTMLElement; chips: HTMLElement[] } {
  const { revealed = true } = opts;
  document.body.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = revealed ? 'pixel-panel skill-tree panel--revealed' : 'pixel-panel skill-tree';
  panel.setAttribute('data-reveal', 'scale-pop');

  const chips = skills.map(skill => {
    const chip = document.createElement('span');
    chip.className = 'skill-chip';
    chip.setAttribute('data-skill', skill);
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-pressed', 'false');
    chip.textContent = skill.split(':')[1] ?? skill;
    panel.appendChild(chip);
    return chip;
  });

  document.body.appendChild(panel);
  return { panel, chips };
}

function makeEntry(target: Element, isIntersecting: boolean) {
  return { target, isIntersecting } as IntersectionObserverEntry;
}

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});

describe('skillTree — no panel', () => {
  it('no .skill-tree → no-op (no observer)', () => {
    document.body.innerHTML = '';
    const cleanup = mount();
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });
});

describe('skillTree — initial dim state', () => {
  it('uncollected chips render with opacity 0.25 and grayscale filter', () => {
    const { chips } = buildPanel(['FRONTEND:React', 'BACKEND:Node']);
    mount();
    chips.forEach(chip => {
      expect(chip.style.opacity).toBe('0.25');
      expect(chip.style.filter).toContain('grayscale');
      expect(chip.classList.contains(COLLECTED_CLASS)).toBe(false);
    });
  });

  it('observer set up on the .skill-tree panel', () => {
    const { panel } = buildPanel(['G:A']);
    mount();
    const io = MockIntersectionObserver.last!;
    expect(io.observe).toHaveBeenCalledWith(panel);
  });
});

describe('skillTree — collect via click', () => {
  it('clicking a chip clears the dim style and adds the collected class', () => {
    const { chips } = buildPanel(['FRONTEND:React']);
    mount();
    chips[0].click();
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(true);
    expect(chips[0].style.opacity).toBe('1');
    expect(chips[0].style.filter === '' || chips[0].style.filter === 'none').toBe(true);
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('collecting twice is idempotent and dispatches a single stat update', () => {
    const { chips } = buildPanel(['FRONTEND:React']);
    mount();
    const listener = vi.fn();
    window.addEventListener(STAT_EVENT, listener);
    chips[0].click();
    chips[0].click();
    window.removeEventListener(STAT_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('skillTree — collect via keyboard', () => {
  it('Z key on a chip collects it', () => {
    const { chips } = buildPanel(['FRONTEND:React']);
    mount();
    chips[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true }));
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(true);
  });

  it('Enter and Space also collect', () => {
    const { chips } = buildPanel(['A:1', 'B:2']);
    mount();
    chips[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(true);
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    chips[1].dispatchEvent(ev);
    expect(chips[1].classList.contains(COLLECTED_CLASS)).toBe(true);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('other keys do not collect', () => {
    const { chips } = buildPanel(['A:1']);
    mount();
    chips[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(false);
  });
});

describe('skillTree — persistence', () => {
  it('stores collected skill keys in sessionStorage as a JSON array', () => {
    const { chips } = buildPanel(['FRONTEND:React', 'BACKEND:Node']);
    mount();
    chips[0].click();
    const raw = sessionStorage.getItem(COLLECTED_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(['FRONTEND:React']);
    chips[1].click();
    expect(JSON.parse(sessionStorage.getItem(COLLECTED_KEY)!)).toEqual([
      'FRONTEND:React',
      'BACKEND:Node',
    ]);
  });

  it('restores collected state from sessionStorage on mount (chips render bright)', () => {
    sessionStorage.setItem(COLLECTED_KEY, JSON.stringify(['FRONTEND:React']));
    const { chips } = buildPanel(['FRONTEND:React', 'BACKEND:Node']);
    mount();
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(true);
    expect(chips[0].style.opacity).toBe('1');
    expect(chips[1].classList.contains(COLLECTED_CLASS)).toBe(false);
    expect(chips[1].style.opacity).toBe('0.25');
  });

  it('ignores malformed sessionStorage payload', () => {
    sessionStorage.setItem(COLLECTED_KEY, '{not-json');
    const { chips } = buildPanel(['A:1']);
    expect(() => mount()).not.toThrow();
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(false);
  });
});

describe('skillTree — stat-update event', () => {
  it('dispatches gp:stat-update with the running collected count', () => {
    const { chips } = buildPanel(['A:1', 'B:2']);
    mount();
    const events: number[] = [];
    const onStat = (e: Event) => {
      const detail = (e as CustomEvent<{ skills?: number }>).detail;
      if (typeof detail?.skills === 'number') events.push(detail.skills);
    };
    window.addEventListener(STAT_EVENT, onStat);
    chips[0].click();
    chips[1].click();
    window.removeEventListener(STAT_EVENT, onStat);
    expect(events).toEqual([1, 2]);
  });
});

describe('skillTree — entrance stagger', () => {
  it('first chip gets visible class immediately on intersect; later chips wait STAGGER_MS each', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, chips } = buildPanel(['A:1', 'B:2', 'C:3']);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    expect(chips[0].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(chips[1].classList.contains(VISIBLE_CLASS)).toBe(false);
    vi.advanceTimersByTime(STAGGER_MS);
    expect(chips[1].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(chips[2].classList.contains(VISIBLE_CLASS)).toBe(false);
    vi.advanceTimersByTime(STAGGER_MS);
    expect(chips[2].classList.contains(VISIBLE_CLASS)).toBe(true);
  });
});

describe('skillTree — reduced motion', () => {
  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders chips visible immediately, still dim, no observer', () => {
    const { chips } = buildPanel(['A:1', 'B:2']);
    mount();
    expect(MockIntersectionObserver.last).toBeNull();
    chips.forEach(chip => {
      expect(chip.classList.contains(VISIBLE_CLASS)).toBe(true);
      expect(chip.style.opacity).toBe('0.25');
    });
  });

  it('click still collects and dispatches the stat-update event', () => {
    const { chips } = buildPanel(['A:1']);
    mount();
    const listener = vi.fn();
    window.addEventListener(STAT_EVENT, listener);
    chips[0].click();
    window.removeEventListener(STAT_EVENT, listener);
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('skillTree — cleanup', () => {
  it('disconnects observer, clears stagger timers, and removes listeners', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, chips } = buildPanel(['A:1', 'B:2', 'C:3']);
    const cleanup = mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(panel, true)]);
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
    vi.advanceTimersByTime(STAGGER_MS * 5);
    expect(chips[1].classList.contains(VISIBLE_CLASS)).toBe(false);
    expect(chips[2].classList.contains(VISIBLE_CLASS)).toBe(false);
    chips[0].click();
    expect(chips[0].classList.contains(COLLECTED_CLASS)).toBe(false);
  });
});
