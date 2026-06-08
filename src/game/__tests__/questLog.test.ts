import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mount, STAGGER_MS, TYPEWRITER_MS, VISIBLE_CLASS, EXPANDED_CLASS } from '../questLog';
import { MockIntersectionObserver } from './setup';

interface BuildQuest {
  title: string;
  note: string;
  active?: boolean;
}
interface BuildOptions { revealed?: boolean }

function buildPanel(
  quests: BuildQuest[],
  opts: BuildOptions = {},
): { panel: HTMLElement; entries: HTMLElement[]; noteOf: (e: HTMLElement) => HTMLElement } {
  const { revealed = true } = opts;
  document.body.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = revealed ? 'pixel-panel quest-log panel--revealed' : 'pixel-panel quest-log';
  panel.setAttribute('data-reveal', 'slide-left');

  const list = document.createElement('div');
  list.className = 'quest-entries';

  const entryEls = quests.map((q, idx) => {
    const entry = document.createElement('article');
    entry.className = 'quest-entry';
    entry.setAttribute('data-quest-index', String(idx));
    entry.setAttribute('data-quest-active', q.active ? 'true' : 'false');

    const header = document.createElement('div');
    header.className = 'quest-entry__header';
    const title = document.createElement('span');
    title.className = 'quest-entry__title';
    title.textContent = q.title;
    const status = document.createElement('span');
    status.className = 'quest-entry__status';
    status.textContent = q.active ? '▶ ACTIVE' : '✓ COMPLETE';
    header.appendChild(title);
    header.appendChild(status);

    const note = document.createElement('p');
    note.className = 'quest-entry__note';
    note.textContent = q.note;

    entry.appendChild(header);
    entry.appendChild(note);
    list.appendChild(entry);
    return entry;
  });

  panel.appendChild(list);
  document.body.appendChild(panel);

  return {
    panel,
    entries: entryEls,
    noteOf: e => e.querySelector<HTMLElement>('.quest-entry__note')!,
  };
}

function makeEntry(target: Element, isIntersecting: boolean) {
  return { target, isIntersecting } as IntersectionObserverEntry;
}

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

afterEach(() => {
  vi.useRealTimers();
});

describe('questLog — no panel', () => {
  it('no .quest-log → no-op (no observer)', () => {
    document.body.innerHTML = '';
    const cleanup = mount();
    expect(MockIntersectionObserver.last).toBeNull();
    cleanup();
  });
});

describe('questLog — initial reset on mount', () => {
  it('clears every note textContent and removes visible class before reveal', () => {
    const { entries, noteOf } = buildPanel([
      { title: 'Quest A', note: 'alpha' },
      { title: 'Quest B', note: 'beta' },
    ]);
    mount();
    entries.forEach(entry => {
      expect(entry.classList.contains(VISIBLE_CLASS)).toBe(false);
      expect(noteOf(entry).textContent).toBe('');
    });
  });
});

describe('questLog — observer setup', () => {
  it('observes the .quest-log panel itself', () => {
    const { panel } = buildPanel([{ title: 'Q', note: 'n' }]);
    mount();
    const io = MockIntersectionObserver.last!;
    expect(io.observe).toHaveBeenCalledTimes(1);
    expect(io.observe).toHaveBeenCalledWith(panel);
  });
});

describe('questLog — panel--revealed gate', () => {
  it('does NOT start animation on intersect if panel--revealed is absent', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries } = buildPanel([{ title: 'Q', note: 'n' }], { revealed: false });
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    vi.advanceTimersByTime(STAGGER_MS * 4);
    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(false);
  });

  it('starts animation when panel--revealed is added after intersect', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries } = buildPanel([{ title: 'Q', note: 'n' }], { revealed: false });
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    panel.classList.add('panel--revealed');
    await flush();
    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(true);
  });
});

describe('questLog — staggered reveal', () => {
  it('entry 0 visible immediately, entry 1 after STAGGER_MS, entry 2 after 2 × STAGGER_MS', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries } = buildPanel([
      { title: 'A', note: 'a' },
      { title: 'B', note: 'b' },
      { title: 'C', note: 'c' },
    ]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);

    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(entries[1].classList.contains(VISIBLE_CLASS)).toBe(false);
    expect(entries[2].classList.contains(VISIBLE_CLASS)).toBe(false);

    vi.advanceTimersByTime(STAGGER_MS);
    expect(entries[1].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(entries[2].classList.contains(VISIBLE_CLASS)).toBe(false);

    vi.advanceTimersByTime(STAGGER_MS);
    expect(entries[2].classList.contains(VISIBLE_CLASS)).toBe(true);
  });
});

describe('questLog — active quest priority', () => {
  it('active quest at DOM index 1 is revealed first; inactive at 0 follows', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries } = buildPanel([
      { title: 'Done',   note: 'd', active: false },
      { title: 'Active', note: 'a', active: true  },
    ]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    expect(entries[1].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(false);
    vi.advanceTimersByTime(STAGGER_MS);
    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(true);
  });
});

describe('questLog — typewriter', () => {
  it('appends one char per TYPEWRITER_MS until note is fully shown', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries, noteOf } = buildPanel([{ title: 'Q', note: 'hello' }]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    const note = noteOf(entries[0]);

    expect(note.textContent).toBe('');
    vi.advanceTimersByTime(TYPEWRITER_MS);
    expect(note.textContent).toBe('h');
    vi.advanceTimersByTime(TYPEWRITER_MS);
    expect(note.textContent).toBe('he');
    vi.advanceTimersByTime(TYPEWRITER_MS * 3);
    expect(note.textContent).toBe('hello');
  });

  it('does not schedule extra timers after the full note is typed', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries, noteOf } = buildPanel([{ title: 'Q', note: 'ab' }]);
    mount();
    MockIntersectionObserver.last!.trigger([makeEntry(panel, true)]);
    vi.advanceTimersByTime(TYPEWRITER_MS * 10);
    expect(noteOf(entries[0]).textContent).toBe('ab');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('questLog — click expand', () => {
  it('clicking an entry toggles the expanded class', () => {
    const { entries } = buildPanel([{ title: 'Q', note: 'n' }]);
    mount();
    expect(entries[0].classList.contains(EXPANDED_CLASS)).toBe(false);
    entries[0].click();
    expect(entries[0].classList.contains(EXPANDED_CLASS)).toBe(true);
    entries[0].click();
    expect(entries[0].classList.contains(EXPANDED_CLASS)).toBe(false);
  });
});

describe('questLog — reduced motion', () => {
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

  it('renders final state instantly, no observer', () => {
    const { entries, noteOf } = buildPanel([
      { title: 'A', note: 'alpha' },
      { title: 'B', note: 'beta'  },
    ]);
    mount();
    expect(MockIntersectionObserver.last).toBeNull();
    expect(entries[0].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(entries[1].classList.contains(VISIBLE_CLASS)).toBe(true);
    expect(noteOf(entries[0]).textContent).toBe('alpha');
    expect(noteOf(entries[1]).textContent).toBe('beta');
  });

  it('click still toggles expanded class under reduced motion', () => {
    const { entries } = buildPanel([{ title: 'Q', note: 'n' }]);
    mount();
    entries[0].click();
    expect(entries[0].classList.contains(EXPANDED_CLASS)).toBe(true);
  });
});

describe('questLog — cleanup', () => {
  it('disconnects observer and clears pending stagger timers', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { panel, entries } = buildPanel([
      { title: 'A', note: 'a' },
      { title: 'B', note: 'b' },
      { title: 'C', note: 'c' },
    ]);
    const cleanup = mount();
    const io = MockIntersectionObserver.last!;
    io.trigger([makeEntry(panel, true)]);
    cleanup();
    expect(io.disconnect).toHaveBeenCalled();
    vi.advanceTimersByTime(STAGGER_MS * 5);
    expect(entries[1].classList.contains(VISIBLE_CLASS)).toBe(false);
    expect(entries[2].classList.contains(VISIBLE_CLASS)).toBe(false);
  });

  it('cleanup removes click listeners', () => {
    const { entries } = buildPanel([{ title: 'Q', note: 'n' }]);
    const cleanup = mount();
    cleanup();
    entries[0].click();
    expect(entries[0].classList.contains(EXPANDED_CLASS)).toBe(false);
  });
});
